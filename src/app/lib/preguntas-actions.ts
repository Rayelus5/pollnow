"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanFromUser } from "@/lib/user-plan";
import { checkEventAccess, triggerDataChanged } from "@/lib/event-access";
import { revalidatePath } from "next/cache";

type OptionInput = { id?: string; text: string };

function parseOptions(raw: FormDataEntryValue | null, maxOptions: number): OptionInput[] {
    if (!raw) return [];
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw as string);
    } catch {
        return [];
    }
    if (!Array.isArray(parsed)) return [];
    return parsed
        .map((o) => ({ id: typeof o?.id === "string" ? o.id : undefined, text: String(o?.text ?? "").trim().slice(0, 200) }))
        .filter((o) => o.text.length > 0)
        .slice(0, maxOptions);
}

async function getOwnerPlan(eventId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { userId: true } });
    if (!event) return null;
    const owner = await prisma.user.findUnique({ where: { id: event.userId } });
    if (!owner) return null;
    return getPlanFromUser(owner);
}

// --- CREAR PREGUNTA ---
export async function createQuestion(eventId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canManagePolls");
    if (!hasAccess) return { error: "Sin permisos" };

    const plan = await getOwnerPlan(eventId);
    if (!plan) return { error: "Evento no encontrado" };

    const currentCount = await prisma.question.count({ where: { eventId } });
    if (currentCount >= plan.limits.preguntasMaxQuestions) {
        return { error: `Límite de ${plan.limits.preguntasMaxQuestions} preguntas de tu plan ${plan.name}.` };
    }

    const text = ((formData.get("text") as string) ?? "").trim().slice(0, 300);
    const description = ((formData.get("description") as string) ?? "").trim().slice(0, 500) || null;
    const type = (formData.get("type") as string) === "CHECKBOX" ? "CHECKBOX" : "RADIO";
    const isRequired = formData.get("isRequired") === "on" || formData.get("isRequired") === "true";
    const pageIndex = Math.max(0, parseInt((formData.get("pageIndex") as string) || "0", 10) || 0);
    const options = parseOptions(formData.get("optionsJson"), plan.limits.preguntasMaxOptions);

    if (!text) return { error: "El texto de la pregunta es obligatorio." };
    if (options.length < 2) return { error: "Añade al menos 2 opciones." };

    const last = await prisma.question.findFirst({ where: { eventId }, orderBy: { order: "desc" } });
    const order = (last?.order ?? -1) + 1;

    await prisma.question.create({
        data: {
            eventId,
            text,
            description,
            type,
            isRequired,
            pageIndex,
            order,
            options: { create: options.map((o, i) => ({ text: o.text, order: i })) },
        },
    });

    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "questions");
    return { success: true };
}

// --- ACTUALIZAR PREGUNTA (sincroniza opciones por id) ---
export async function updateQuestion(questionId: string, eventId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canManagePolls");
    if (!hasAccess) return { error: "Sin permisos" };

    const plan = await getOwnerPlan(eventId);
    if (!plan) return { error: "Evento no encontrado" };

    const text = ((formData.get("text") as string) ?? "").trim().slice(0, 300);
    const description = ((formData.get("description") as string) ?? "").trim().slice(0, 500) || null;
    const type = (formData.get("type") as string) === "CHECKBOX" ? "CHECKBOX" : "RADIO";
    const isRequired = formData.get("isRequired") === "on" || formData.get("isRequired") === "true";
    const pageIndex = Math.max(0, parseInt((formData.get("pageIndex") as string) || "0", 10) || 0);
    const options = parseOptions(formData.get("optionsJson"), plan.limits.preguntasMaxOptions);

    if (!text) return { error: "El texto de la pregunta es obligatorio." };
    if (options.length < 2) return { error: "Añade al menos 2 opciones." };

    const existing = await prisma.questionOption.findMany({ where: { questionId }, select: { id: true } });
    const existingIds = new Set(existing.map((o) => o.id));
    const keptIds = new Set(options.filter((o) => o.id && existingIds.has(o.id)).map((o) => o.id!));
    const toDelete = existing.filter((o) => !keptIds.has(o.id)).map((o) => o.id);

    await prisma.$transaction([
        prisma.question.update({ where: { id: questionId }, data: { text, description, type, isRequired, pageIndex } }),
        prisma.questionOption.deleteMany({ where: { id: { in: toDelete } } }),
        // Actualizar las opciones conservadas (texto + orden)
        ...options
            .filter((o) => o.id && existingIds.has(o.id))
            .map((o, i) => prisma.questionOption.update({ where: { id: o.id! }, data: { text: o.text, order: i } })),
        // Crear las nuevas
        prisma.questionOption.createMany({
            data: options
                .map((o, i) => ({ o, i }))
                .filter(({ o }) => !o.id || !existingIds.has(o.id))
                .map(({ o, i }) => ({ questionId, text: o.text, order: i })),
        }),
    ]);

    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "questions");
    return { success: true };
}

// --- BORRAR PREGUNTA ---
export async function deleteQuestion(questionId: string, eventId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canManagePolls");
    if (!hasAccess) return { error: "Sin permisos" };

    await prisma.question.delete({ where: { id: questionId } });

    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "questions");
    return { success: true };
}

// --- REORDENAR PREGUNTAS ---
export async function reorderQuestions(items: { id: string; order: number }[], eventId: string) {
    const session = await auth();
    if (!session?.user?.id) return;

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canManagePolls");
    if (!hasAccess) return;

    await prisma.$transaction(
        items.map((item) => prisma.question.update({ where: { id: item.id }, data: { order: item.order } }))
    );

    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "questions");
}
