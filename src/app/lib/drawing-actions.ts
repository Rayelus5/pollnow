"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanFromUser } from "@/lib/user-plan";
import { clampDrawingTime } from "@/lib/event-modes";
import { checkEventAccess, triggerDataChanged } from "@/lib/event-access";
import { revalidatePath } from "next/cache";

// --- ACTUALIZAR CONFIGURACIÓN DEL EVENTO DIBUJO ---
export async function updateDrawingConfig(eventId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canEditSettings");
    if (!hasAccess) return { error: "Sin permisos" };

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { userId: true, mode: true, drawingPhase: true },
    });
    if (!event || event.mode !== "DIBUJO") return { error: "Evento no válido" };

    const owner = await prisma.user.findUnique({ where: { id: event.userId } });
    if (!owner) return { error: "Dueño no encontrado" };
    const plan = await getPlanFromUser(owner);

    const drawingPrompt = ((formData.get("drawingPrompt") as string) ?? "").slice(0, 500);

    const drawingDeadlineStr = formData.get("drawingDeadline") as string | null;
    const votingDeadlineStr = formData.get("votingDeadline") as string | null;
    const drawingDeadline = drawingDeadlineStr ? new Date(drawingDeadlineStr) : null;
    const votingDeadline = votingDeadlineStr ? new Date(votingDeadlineStr) : null;

    if (!drawingDeadline || isNaN(drawingDeadline.getTime()) || !votingDeadline || isNaN(votingDeadline.getTime())) {
        return { error: "Fechas de cierre inválidas." };
    }
    if (votingDeadline <= drawingDeadline) {
        return { error: "El cierre de votación debe ser posterior al de dibujo." };
    }

    const wantsUnlimited = formData.get("drawingUnlimited") === "on" || formData.get("drawingUnlimited") === "true";
    const timeRaw = formData.get("drawingTimeLimit") as string | null;
    const requested = wantsUnlimited ? null : timeRaw ? parseInt(timeRaw, 10) : null;
    const drawingTimeLimit = clampDrawingTime(requested, plan);

    await prisma.event.update({
        where: { id: eventId },
        data: {
            drawingPrompt,
            drawingDeadline,
            votingDeadline,
            drawingTimeLimit,
            galaDate: votingDeadline, // el "fin" del evento DIBUJO es el cierre de votación
        },
    });

    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "drawing");
    return { success: true };
}

// --- AVANZAR FASE MANUALMENTE (emergencia; solo dueño/canEditSettings) ---
export async function advanceDrawingPhase(eventId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canEditSettings");
    if (!hasAccess) return { error: "Sin permisos" };

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { mode: true, drawingPhase: true },
    });
    if (!event || event.mode !== "DIBUJO") return { error: "Evento no válido" };

    const next =
        event.drawingPhase === "DRAWING" ? "VOTING" : event.drawingPhase === "VOTING" ? "RESULTS" : null;
    if (!next) return { error: "El evento ya está en la fase final." };

    await prisma.event.update({ where: { id: eventId }, data: { drawingPhase: next } });

    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "drawing");
    return { success: true, phase: next };
}
