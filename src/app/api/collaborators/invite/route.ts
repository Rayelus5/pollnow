import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanFromUser } from "@/lib/user-plan";
import { pusherServer, eventChannel, userChannel, PUSHER_EVENTS } from "@/lib/pusher";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit-redis";
import { sendCollaborationInviteEmail } from "@/lib/mail";
import { buildUnsubscribeUrl } from "@/lib/unsubscribe";
import { NextRequest, NextResponse } from "next/server";

// POST /api/collaborators/invite
// Body: { eventId, invitedUserId }
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rl = await rateLimit(`${ip}:collab-invite`, 10);
    if (!rl.allowed) return tooManyRequests(rl, "Demasiadas solicitudes. Espera un momento.");

    const body = await req.json();
    const { eventId, invitedUserId } = body as { eventId?: string; invitedUserId?: string };

    if (!eventId || !invitedUserId) {
        return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    // 1. Verificar que el usuario es dueño del evento
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { _count: { select: { collaborators: true } } },
    });

    if (!event || event.userId !== session.user.id) {
        return NextResponse.json({ error: "No tienes permiso" }, { status: 403 });
    }

    // 2. Verificar plan del propietario
    const owner = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!owner) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const plan = await getPlanFromUser(owner);
    const collaboratorLimit = plan.limits.collaboratorsPerEvent;

    if (collaboratorLimit === 0) {
        return NextResponse.json(
            { error: "Tu plan no permite invitar colaboradores. Actualiza tu suscripción." },
            { status: 403 }
        );
    }

    if (event._count.collaborators >= collaboratorLimit) {
        return NextResponse.json(
            { error: `Has alcanzado el límite de ${collaboratorLimit} colaborador${collaboratorLimit > 1 ? "es" : ""} para tu plan.` },
            { status: 403 }
        );
    }

    // 3. Verificar que el invitado existe y no es ya colaborador
    const invitedUser = await prisma.user.findUnique({
        where: { id: invitedUserId },
        select: { id: true, name: true, username: true, email: true, emailCollaborations: true },
    });
    if (!invitedUser) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // 4. Verificar que no hay invitación pendiente o activa
    const existing = await prisma.collaboratorInvitation.findUnique({
        where: { eventId_invitedUserId: { eventId, invitedUserId } },
    });
    if (existing) {
        if (existing.status === "PENDING") {
            return NextResponse.json({ error: "Ya existe una invitación pendiente para este usuario" }, { status: 409 });
        }
        if (existing.status === "ACCEPTED") {
            // Verificar que el colaborador sigue activo (puede haber sido eliminado)
            const stillCollaborator = await prisma.eventCollaborator.findUnique({
                where: { eventId_userId: { eventId, userId: invitedUserId } },
                select: { userId: true },
            });
            if (stillCollaborator) {
                return NextResponse.json({ error: "Este usuario ya es colaborador" }, { status: 409 });
            }
            // Fue eliminado como colaborador → permitir re-invitar
        }
        // Si fue rechazada o fue eliminado tras aceptar, permitir re-invitar: actualizamos en lugar de crear
        const updated = await prisma.collaboratorInvitation.update({
            where: { id: existing.id },
            data: { status: "PENDING", respondedAt: null, createdAt: new Date() },
        });
        // Crear notificación
        await prisma.notification.create({
            data: {
                message: `${owner.name} te ha invitado a colaborar en "${event.title}"`,
                link: "/dashboard?tab=events",
                type: "COLLABORATION",
                invitationId: updated.id,
                adminUserId: session.user.id,
                userId: invitedUserId,
            },
        });
        // Notificar al usuario invitado en tiempo real
        try {
            await pusherServer.trigger(userChannel(invitedUserId), PUSHER_EVENTS.INVITATION_SENT, {
                invitationId: updated.id,
                eventId,
                eventTitle: event.title,
                invitedBy: { name: owner.name, username: owner.username ?? "" },
            });
        } catch (pusherErr) {
            console.error("[Pusher] Error al notificar invitation-sent al usuario:", pusherErr);
        }

        // Enviar correo de invitación de colaboración (solo si el usuario lo tiene activado)
        if (invitedUser?.email && invitedUser.emailCollaborations) {
            const unsubUrl = buildUnsubscribeUrl(
                process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
                invitedUserId,
                "collaborations"
            );
            sendCollaborationInviteEmail(
                invitedUser.email,
                invitedUser.name ?? "Usuario",
                owner.name ?? "Un usuario",
                event.title,
                "/dashboard?tab=events",
                unsubUrl
            ).catch((err) => console.error("[Mail] Error al enviar correo de re-invitación:", err));
        }

        return NextResponse.json({ invitation: updated }, { status: 200 });
    }

    // 5. Crear invitación + notificación en transacción
    const [invitation] = await prisma.$transaction([
        prisma.collaboratorInvitation.create({
            data: { eventId, invitedById: session.user.id, invitedUserId },
        }),
    ]);

    await prisma.notification.create({
        data: {
            message: `${owner.name} te ha invitado a colaborar en "${event.title}"`,
            link: "/dashboard?tab=events",
            type: "COLLABORATION",
            invitationId: invitation.id,
            adminUserId: session.user.id,
            userId: invitedUserId,
        },
    });

    // Enviar correo de invitación de colaboración
    if (invitedUser?.email) {
        sendCollaborationInviteEmail(
            invitedUser.email,
            invitedUser.name ?? "Usuario",
            owner.name ?? "Un usuario",
            event.title,
            "/dashboard?tab=events"
        ).catch((err) => console.error("[Mail] Error al enviar correo de invitación:", err));
    }

    // 6. Avisar en tiempo real al canal del evento (no-throw)
    try {
        await pusherServer.trigger(eventChannel(eventId), PUSHER_EVENTS.INVITATION_SENT, {
            invitedUser: { id: invitedUser.id, name: invitedUser.name, username: invitedUser.username },
            invitationId: invitation.id,
        });
    } catch (pusherErr) {
        console.error("[Pusher] Error al notificar invitation-sent al canal del evento:", pusherErr);
    }

    // 7. Notificar al usuario invitado en tiempo real en su canal personal
    try {
        await pusherServer.trigger(userChannel(invitedUserId), PUSHER_EVENTS.INVITATION_SENT, {
            invitationId: invitation.id,
            eventId,
            eventTitle: event.title,
            invitedBy: { name: owner.name, username: owner.username ?? "" },
        });
    } catch (pusherErr) {
        console.error("[Pusher] Error al notificar invitation-sent al usuario:", pusherErr);
    }

    return NextResponse.json({ invitation }, { status: 201 });
}
