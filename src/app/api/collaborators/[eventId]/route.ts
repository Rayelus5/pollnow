import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer, eventChannel, PUSHER_EVENTS } from "@/lib/pusher";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ eventId: string }> };

// GET /api/collaborators/[eventId]
// Devuelve owner, colaboradores actuales + invitaciones pendientes del evento
export async function GET(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rl = rateLimit(`${ip}:collab-get`, 60);
    if (!rl.allowed) {
        return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
    }

    const { eventId } = await params;

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
            userId: true,
            defaultCanEditSettings: true,
            defaultCanRegenerateKey: true,
            defaultCanDeleteEvent: true,
            defaultCanManageNominees: true,
            defaultCanManagePolls: true,
            defaultCanViewStats: true,
        },
    });
    if (!event) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

    const isOwner = event.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
    const collaborator = await prisma.eventCollaborator.findUnique({
        where: { eventId_userId: { eventId, userId: session.user.id } },
    });

    if (!isOwner && !isAdmin && !collaborator) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const [ownerUser, collaborators, pendingInvitations] = await Promise.all([
        prisma.user.findUnique({
            where: { id: event.userId },
            select: { id: true, name: true, username: true, image: true },
        }),
        prisma.eventCollaborator.findMany({
            where: { eventId },
            include: { user: { select: { id: true, name: true, username: true, image: true } } },
            orderBy: { createdAt: "asc" },
        }),
        prisma.collaboratorInvitation.findMany({
            where: { eventId, status: "PENDING" },
            include: { invitedUser: { select: { id: true, name: true, username: true, image: true } } },
            orderBy: { createdAt: "asc" },
        }),
    ]);

    return NextResponse.json({
        owner: ownerUser,
        collaborators,
        pendingInvitations,
        eventDefaults: {
            defaultCanEditSettings: event.defaultCanEditSettings,
            defaultCanRegenerateKey: event.defaultCanRegenerateKey,
            defaultCanDeleteEvent: event.defaultCanDeleteEvent,
            defaultCanManageNominees: event.defaultCanManageNominees,
            defaultCanManagePolls: event.defaultCanManagePolls,
            defaultCanViewStats: event.defaultCanViewStats,
        },
    });
}

// PATCH /api/collaborators/[eventId]
// Body: { type: "global" | "individual", permissions, userId? }
export async function PATCH(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rl = rateLimit(`${ip}:collab-patch`, 30);
    if (!rl.allowed) {
        return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
    }

    const { eventId } = await params;

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { userId: true } });
    if (!event || event.userId !== session.user.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { type, permissions, userId } = body as {
        type: "global" | "individual";
        permissions: Record<string, boolean>;
        userId?: string;
    };

    if (type === "global") {
        await prisma.event.update({
            where: { id: eventId },
            data: {
                defaultCanEditSettings: permissions.canEditSettings,
                defaultCanRegenerateKey: permissions.canRegenerateKey,
                defaultCanDeleteEvent: permissions.canDeleteEvent,
                defaultCanManageNominees: permissions.canManageNominees,
                defaultCanManagePolls: permissions.canManagePolls,
                defaultCanViewStats: permissions.canViewStats,
            },
        });
    } else if (type === "individual" && userId) {
        // null = heredar del evento; true/false = sobreescribir
        await prisma.eventCollaborator.update({
            where: { eventId_userId: { eventId, userId } },
            data: {
                canEditSettings: permissions.canEditSettings ?? null,
                canRegenerateKey: permissions.canRegenerateKey ?? null,
                canDeleteEvent: permissions.canDeleteEvent ?? null,
                canManageNominees: permissions.canManageNominees ?? null,
                canManagePolls: permissions.canManagePolls ?? null,
                canViewStats: permissions.canViewStats ?? null,
            },
        });
    } else {
        return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    try {
        await pusherServer.trigger(eventChannel(eventId), PUSHER_EVENTS.PERMISSIONS_UPDATED, {
            type,
            userId: userId ?? null,
            permissions,
            triggeredBy: session.user.id,
        });
    } catch (pusherErr) {
        console.error("[Pusher] Error al notificar permissions-updated:", pusherErr);
    }

    return NextResponse.json({ ok: true });
}

// DELETE /api/collaborators/[eventId]?userId=<userId>
// Elimina un colaborador del evento
export async function DELETE(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rl = rateLimit(`${ip}:collab-delete`, 20);
    if (!rl.allowed) {
        return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
    }

    const { eventId } = await params;

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { userId: true } });
    if (!event || event.userId !== session.user.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

    await prisma.eventCollaborator.delete({
        where: { eventId_userId: { eventId, userId } },
    });

    try {
        await pusherServer.trigger(eventChannel(eventId), PUSHER_EVENTS.COLLABORATOR_LEFT, { userId });
    } catch (pusherErr) {
        console.error("[Pusher] Error al notificar collaborator-left:", pusherErr);
    }

    return NextResponse.json({ ok: true });
}
