'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getPlanFromUser } from "@/lib/user-plan";
import { pusherServer, eventChannel, PUSHER_EVENTS } from "@/lib/pusher";

// ─── Helper: verifica acceso colaborador con permiso específico ───────────────

type CollabPermission =
    | "canManageNominees"
    | "canManagePolls"
    | "canEditSettings"
    | "canDeleteEvent"
    | "canRegenerateKey";

async function checkEventAccess(
    eventId: string,
    userId: string,
    permission: CollabPermission
): Promise<boolean> {
    const [event, collab] = await Promise.all([
        prisma.event.findUnique({
            where: { id: eventId },
            select: {
                userId: true,
                defaultCanEditSettings: true,
                defaultCanRegenerateKey: true,
                defaultCanDeleteEvent: true,
                defaultCanManageNominees: true,
                defaultCanManagePolls: true,
            },
        }),
        prisma.eventCollaborator.findUnique({
            where: { eventId_userId: { eventId, userId } },
        }),
    ]);
    if (!event) return false;
    if (event.userId === userId) return true;
    if (!collab) return false;

    const defaultMap: Record<CollabPermission, boolean> = {
        canEditSettings: event.defaultCanEditSettings,
        canRegenerateKey: event.defaultCanRegenerateKey,
        canDeleteEvent: event.defaultCanDeleteEvent,
        canManageNominees: event.defaultCanManageNominees,
        canManagePolls: event.defaultCanManagePolls,
    };

    return collab[permission] ?? defaultMap[permission] ?? false;
}

async function triggerDataChanged(eventId: string, triggeredBy: string, dataType: string) {
    try {
        await pusherServer.trigger(eventChannel(eventId), PUSHER_EVENTS.DATA_CHANGED, {
            dataType,
            triggeredBy,
        });
    } catch {
        // no-op: Pusher failures must never break the action
    }
}

// --- EVENTO PRINCIPAL ---

export async function updateEvent(eventId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user) return;

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const galaDateStr = formData.get('galaDate') as string;
    const isPublic = formData.get('isPublic') === 'on';
    const isAnonymousVoting = formData.get('isAnonymousVoting') === 'on';

    let galaDate: Date | null = null;
    if (galaDateStr && galaDateStr !== "") {
        const parsedDate = new Date(galaDateStr);
        if (!isNaN(parsedDate.getTime())) {
            galaDate = parsedDate;
        }
    }

    await prisma.event.update({
        where: { id: eventId, userId: session.user.id },
        data: { title, description, galaDate, isPublic, isAnonymousVoting }
    });

    revalidatePath(`/dashboard/event/${eventId}`);
    if (isPublic) revalidatePath('/polls');
    revalidateTag("events-public", {});
}

export async function deleteEvent(eventId: string, isAdmin: boolean = false) {
    const session = await auth();
    if (!session?.user) return;

    if (isAdmin && session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
        return;
    }

    await prisma.$transaction(async (tx) => {
        await tx.report.deleteMany({ where: { eventId } });
        await tx.moderationLog.updateMany({
            where: { eventId },
            data: { eventId: null },
        });
        if (isAdmin) {
            await tx.event.delete({ where: { id: eventId } });
        } else {
            await tx.event.delete({ where: { id: eventId, userId: session.user.id } });
        }
    });

    revalidateTag("events-public", {});

    if (isAdmin) {
        revalidatePath("/admin/events");
        redirect("/admin/events");
    } else {
        revalidatePath("/dashboard");
        redirect("/dashboard");
    }
}

export async function rotateEventKey(eventId: string) {
    const session = await auth();
    if (!session?.user) return;
    await prisma.event.update({
        where: { id: eventId, userId: session.user.id },
        data: { accessKey: crypto.randomUUID() }
    });
    revalidatePath(`/dashboard/event/${eventId}`);
}

// --- PARTICIPANTES (CON LÍMITE Y SOPORTE COLABORADORES) ---

export async function createEventParticipant(eventId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return;

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canManageNominees");
    if (!hasAccess) return;

    const name = formData.get('name') as string;
    const imageUrl = formData.get('imageUrl') as string;
    if (!name) return;

    // Obtener el plan del dueño del evento (no del colaborador) y el conteo
    // de participantes en una sola query con _count.
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
            user: true,
            _count: { select: { participants: true } },
        },
    });
    if (!event) return;

    const plan = await getPlanFromUser(event.user);

    if (event._count.participants >= plan.limits.participantsPerEvent) {
        console.error("Límite de participantes alcanzado");
        return;
    }

    await prisma.participant.create({ data: { name, imageUrl, eventId } });
    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "participants");
}

export async function updateEventParticipant(participantId: string, eventId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return;

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canManageNominees");
    if (!hasAccess) return;

    const name = formData.get('name') as string;
    const imageUrl = formData.get('imageUrl') as string;
    await prisma.participant.update({ where: { id: participantId }, data: { name, imageUrl } });
    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "participants");
}

export async function deleteEventParticipant(participantId: string, eventId: string) {
    const session = await auth();
    if (!session?.user?.id) return;

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canManageNominees");
    if (!hasAccess) return;

    await prisma.participant.delete({ where: { id: participantId } });
    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "participants");
}

// --- ENCUESTAS (CON LÍMITE Y SOPORTE COLABORADORES) ---

export async function createEventPoll(eventId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return;

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canManagePolls");
    if (!hasAccess) return;

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const participantIds = formData.getAll("participantIds") as string[];

    const votingType = formData.get("votingType") as
        | "SINGLE"
        | "MULTIPLE"
        | "LIMITED_MULTIPLE";

    const maxOptionsStr = formData.get("maxOptions") as string | null;
    const maxOptionsFromForm = maxOptionsStr ? parseInt(maxOptionsStr, 10) : null;

    if (!title) return;

    // Plan del dueño del evento
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { userId: true },
    });
    if (!event) return;

    const owner = await prisma.user.findUnique({ where: { id: event.userId } });
    if (!owner) return;
    const plan = await getPlanFromUser(owner);

    const currentPollsCount = await prisma.poll.count({ where: { eventId } });
    if (currentPollsCount >= plan.limits.pollsPerEvent) {
        console.error("Límite de categorías alcanzado");
        return;
    }

    const lastPoll = await prisma.poll.findFirst({
        where: { eventId },
        orderBy: { order: "desc" },
    });
    const newOrder = (lastPoll?.order ?? 0) + 1;
    const optionsCount = participantIds.length;

    await prisma.poll.create({
        data: {
            title,
            description,
            order: newOrder,
            isPublished: true,
            votingType: votingType || "SINGLE",
            maxOptions:
                votingType === "LIMITED_MULTIPLE"
                    ? (maxOptionsFromForm ?? 2)
                    : votingType === "SINGLE"
                        ? 1
                        : optionsCount || 1,
            event: { connect: { id: eventId } },
            options: {
                create: participantIds.map((pId) => ({ participantId: pId })),
            },
        },
    });

    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "polls");
}

export async function updateEventPoll(pollId: string, eventId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return;

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canManagePolls");
    if (!hasAccess) return;

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const participantIds = formData.getAll("participantIds") as string[];

    const votingType = formData.get("votingType") as
        | "SINGLE"
        | "MULTIPLE"
        | "LIMITED_MULTIPLE";

    const maxOptionsStr = formData.get("maxOptions") as string | null;
    const maxOptionsFromForm = maxOptionsStr ? parseInt(maxOptionsStr, 10) : null;

    const currentOptions = await prisma.option.findMany({ where: { pollId } });
    const optionsCount =
        participantIds.length > 0 ? participantIds.length : currentOptions.length;

    await prisma.poll.update({
        where: { id: pollId },
        data: {
            title,
            description,
            votingType: votingType || "SINGLE",
            maxOptions:
                votingType === "LIMITED_MULTIPLE"
                    ? (maxOptionsFromForm ?? 2)
                    : votingType === "SINGLE"
                        ? 1
                        : optionsCount || 1,
        },
    });

    const toDeleteIds = currentOptions
        .filter((o) => !participantIds.includes(o.participantId))
        .map((o) => o.id);

    const currentIds = currentOptions.map((o) => o.participantId);
    const toCreate = participantIds.filter((pId) => !currentIds.includes(pId));

    // Una sola transacción en lugar de N queries (delete/create por opción)
    await prisma.$transaction([
        prisma.option.deleteMany({ where: { id: { in: toDeleteIds } } }),
        prisma.option.createMany({
            data: toCreate.map((pId) => ({ pollId, participantId: pId })),
            skipDuplicates: true,
        }),
    ]);

    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "polls");
}

export async function deleteEventPoll(pollId: string, eventId: string) {
    const session = await auth();
    if (!session?.user?.id) return;

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canManagePolls");
    if (!hasAccess) return;

    await prisma.poll.delete({ where: { id: pollId } });
    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "polls");
}

export async function reorderEventPolls(items: { id: string, order: number }[], eventId: string) {
    const session = await auth();
    if (!session?.user?.id) return;

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canManagePolls");
    if (!hasAccess) return;

    await prisma.$transaction(items.map((item) =>
        prisma.poll.update({ where: { id: item.id }, data: { order: item.order } })
    ));
    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "polls");
}
