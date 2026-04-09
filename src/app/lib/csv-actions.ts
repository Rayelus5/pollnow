'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getPlanFromUser } from "@/lib/plans";
import { pusherServer, eventChannel, PUSHER_EVENTS } from "@/lib/pusher";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParticipantImportRow = {
    name: string;
    imageUrl?: string;
};

export type PollImportRow = {
    title: string;
    description?: string;
    votingType: "SINGLE" | "MULTIPLE" | "LIMITED_MULTIPLE";
    maxOptions?: number;
};

export type BulkImportError = {
    row: number;
    value: string;
    reason: string;
};

export type BulkImportResult = {
    created: number;
    errors: BulkImportError[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

async function getEventAccessAndPlan(eventId: string, userId: string, permission: "canManageNominees" | "canManagePolls") {
    const [event, collab] = await Promise.all([
        prisma.event.findUnique({
            where: { id: eventId },
            select: { userId: true },
        }),
        prisma.eventCollaborator.findUnique({
            where: { eventId_userId: { eventId, userId } },
        }),
    ]);

    if (!event) return { hasAccess: false, owner: null };

    const isOwner = event.userId === userId;

    if (!isOwner && !collab) return { hasAccess: false, owner: null };

    const permGranted = isOwner || !!(collab?.[permission]);
    if (!permGranted) return { hasAccess: false, owner: null };

    const owner = await prisma.user.findUnique({ where: { id: event.userId } });
    return { hasAccess: true, owner };
}

// ─── Bulk create participants ─────────────────────────────────────────────────

export async function bulkCreateParticipants(
    eventId: string,
    rows: ParticipantImportRow[]
): Promise<BulkImportResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return { created: 0, errors: [{ row: 0, value: "", reason: "No autenticado" }] };
    }

    if (!rows.length) {
        return { created: 0, errors: [] };
    }

    const { hasAccess, owner } = await getEventAccessAndPlan(eventId, session.user.id, "canManageNominees");
    if (!hasAccess || !owner) {
        return { created: 0, errors: [{ row: 0, value: "", reason: "Sin permisos para gestionar nominados" }] };
    }

    const plan = getPlanFromUser(owner);
    const limit = plan.limits.participantsPerEvent;

    let currentCount = await prisma.participant.count({ where: { eventId } });
    const errors: BulkImportError[] = [];
    let created = 0;

    for (let i = 0; i < rows.length; i++) {
        const { name, imageUrl } = rows[i];
        const rowNum = i + 1;

        if (!name?.trim()) {
            errors.push({ row: rowNum, value: name ?? "", reason: "El nombre es obligatorio" });
            continue;
        }
        if (name.trim().length > 80) {
            errors.push({ row: rowNum, value: name, reason: "El nombre supera los 80 caracteres" });
            continue;
        }
        if (currentCount >= limit) {
            errors.push({ row: rowNum, value: name, reason: `Límite de ${limit} nominados alcanzado` });
            continue;
        }

        try {
            await prisma.participant.create({
                data: { name: name.trim(), imageUrl: imageUrl?.trim() || null, eventId },
            });
            currentCount++;
            created++;
        } catch {
            errors.push({ row: rowNum, value: name, reason: "Error al guardar en base de datos" });
        }
    }

    if (created > 0) {
        revalidatePath(`/dashboard/event/${eventId}`);
        await triggerDataChanged(eventId, session.user.id, "participants");
    }

    return { created, errors };
}

// ─── Bulk create polls (categories) ──────────────────────────────────────────

export async function bulkCreatePolls(
    eventId: string,
    rows: PollImportRow[]
): Promise<BulkImportResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return { created: 0, errors: [{ row: 0, value: "", reason: "No autenticado" }] };
    }

    if (!rows.length) {
        return { created: 0, errors: [] };
    }

    const { hasAccess, owner } = await getEventAccessAndPlan(eventId, session.user.id, "canManagePolls");
    if (!hasAccess || !owner) {
        return { created: 0, errors: [{ row: 0, value: "", reason: "Sin permisos para gestionar categorías" }] };
    }

    const plan = getPlanFromUser(owner);
    const limit = plan.limits.pollsPerEvent;

    let currentCount = await prisma.poll.count({ where: { eventId } });
    const lastPoll = await prisma.poll.findFirst({
        where: { eventId },
        orderBy: { order: "desc" },
        select: { order: true },
    });
    let nextOrder = (lastPoll?.order ?? 0) + 1;

    const errors: BulkImportError[] = [];
    let created = 0;
    const validVotingTypes = ["SINGLE", "MULTIPLE", "LIMITED_MULTIPLE"];

    for (let i = 0; i < rows.length; i++) {
        const { title, description, votingType, maxOptions } = rows[i];
        const rowNum = i + 1;

        if (!title?.trim()) {
            errors.push({ row: rowNum, value: title ?? "", reason: "El título es obligatorio" });
            continue;
        }
        if (title.trim().length > 100) {
            errors.push({ row: rowNum, value: title, reason: "El título supera los 100 caracteres" });
            continue;
        }
        if (!validVotingTypes.includes(votingType)) {
            errors.push({ row: rowNum, value: title, reason: `Tipo de votación inválido: "${votingType}". Usa SINGLE, MULTIPLE o LIMITED_MULTIPLE` });
            continue;
        }
        if (currentCount >= limit) {
            errors.push({ row: rowNum, value: title, reason: `Límite de ${limit} categorías alcanzado` });
            continue;
        }

        const computedMaxOptions =
            votingType === "LIMITED_MULTIPLE"
                ? (maxOptions && maxOptions >= 2 ? maxOptions : 2)
                : votingType === "SINGLE"
                    ? 1
                    : 999;

        try {
            await prisma.poll.create({
                data: {
                    title: title.trim(),
                    description: description?.trim() || null,
                    order: nextOrder,
                    isPublished: true,
                    votingType,
                    maxOptions: computedMaxOptions,
                    event: { connect: { id: eventId } },
                },
            });
            nextOrder++;
            currentCount++;
            created++;
        } catch {
            errors.push({ row: rowNum, value: title, reason: "Error al guardar en base de datos" });
        }
    }

    if (created > 0) {
        revalidatePath(`/dashboard/event/${eventId}`);
        await triggerDataChanged(eventId, session.user.id, "polls");
    }

    return { created, errors };
}
