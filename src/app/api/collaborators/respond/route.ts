import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanFromUser } from "@/lib/user-plan";
import { pusherServer, eventChannel, PUSHER_EVENTS } from "@/lib/pusher";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit-redis";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// POST /api/collaborators/respond
// Body: { invitationId, action: "accept" | "reject" }
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rl = await rateLimit(`${ip}:collab-respond`, 20);
    if (!rl.allowed) return tooManyRequests(rl, "Demasiadas solicitudes. Espera un momento.");

    const { invitationId, action } = (await req.json()) as {
        invitationId?: string;
        action?: "accept" | "reject";
    };

    if (!invitationId || !action) {
        return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    // 1. Obtener invitación
    const invitation = await prisma.collaboratorInvitation.findUnique({
        where: { id: invitationId },
        include: {
            event: { select: { id: true, title: true, userId: true } },
            invitedBy: { select: { id: true, name: true } },
        },
    });

    if (!invitation) {
        return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }
    if (invitation.invitedUserId !== session.user.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    if (invitation.status !== "PENDING") {
        return NextResponse.json({ error: "Esta invitación ya fue respondida" }, { status: 409 });
    }

    if (action === "accept") {
        // 2a. Verificar límite maxSharedEvents del plan del invitado
        const invitedUser = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!invitedUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

        const plan = await getPlanFromUser(invitedUser);
        const maxSharedEvents = plan.limits.maxSharedEvents;

        if (maxSharedEvents !== Infinity) {
            const currentShared = await prisma.eventCollaborator.count({
                where: { userId: session.user.id },
            });
            if (currentShared >= maxSharedEvents) {
                return NextResponse.json(
                    {
                        error: `Con el plan ${plan.name} solo puedes colaborar en ${maxSharedEvents} evento${maxSharedEvents > 1 ? "s" : ""} a la vez. Actualiza tu suscripción para participar en más.`,
                    },
                    { status: 403 }
                );
            }
        }

        // 3. Crear colaborador + actualizar invitación
        await prisma.$transaction([
            prisma.eventCollaborator.upsert({
                where: { eventId_userId: { eventId: invitation.eventId, userId: session.user.id } },
                create: { eventId: invitation.eventId, userId: session.user.id },
                update: {},
            }),
            prisma.collaboratorInvitation.update({
                where: { id: invitationId },
                data: { status: "ACCEPTED", respondedAt: new Date() },
            }),
        ]);

        // Marcar la notificación como leída
        await prisma.notification.updateMany({
            where: { invitationId, userId: session.user.id },
            data: { isRead: true },
        });

        // Pusher: avisar al canal del evento que hay un nuevo colaborador (no-throw)
        try {
            const collaboratorFull = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { id: true, name: true, username: true, image: true },
            });
            await pusherServer.trigger(eventChannel(invitation.eventId), PUSHER_EVENTS.COLLABORATOR_JOINED, {
                collaborator: collaboratorFull,
            });
        } catch (pusherErr) {
            console.error("[Pusher] Error al notificar collaborator-joined:", pusherErr);
        }

    } else {
        // 2b. Rechazar
        await prisma.collaboratorInvitation.update({
            where: { id: invitationId },
            data: { status: "REJECTED", respondedAt: new Date() },
        });
        await prisma.notification.updateMany({
            where: { invitationId, userId: session.user.id },
            data: { isRead: true },
        });
    }

    revalidatePath("/dashboard");
    return NextResponse.json({ ok: true });
}
