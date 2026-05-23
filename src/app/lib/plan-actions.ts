"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";

// Solo ADMIN puede gestionar planes (no MODERATOR)
async function requireAdmin() {
    const session = await auth();
    // @ts-ignore - role está en el token de sesión
    const role = session?.user?.role;
    if (!session || role !== "ADMIN") {
        throw new Error("Acceso denegado: se requieren permisos de administrador.");
    }
    return session.user;
}

export type PlanLimitsInput = {
    pollsPerEvent: number;
    participantsPerEvent: number;
    collaboratorsPerEvent: number;
    /** null = ilimitado */
    maxSharedEvents: number | null;
    // TIERLIST
    tierlistMaxTiers: number;
    tierlistMaxOptions: number;
    // PREGUNTAS
    preguntasMaxQuestions: number;
    preguntasMaxOptions: number;
    preguntasMaxPerPage: number;
    // DIBUJO
    drawingMaxEvents: number;
    /** null = no aplica */
    drawingMinTimeSecs: number | null;
    /** null = sin tope (ilimitado) */
    drawingMaxTimeSecs: number | null;
    drawingAllowUnlimited: boolean;
};

export type PlanFormInput = {
    name: string;
    slug: string;
    quota: number;
    price: number;
    stripePriceId: string | null;
    isActive: boolean;
    sortOrder: number;
    limits: PlanLimitsInput;
    features: Record<string, unknown>;
};

type ActionResult = { ok: boolean; error?: string };

function invalidatePlans() {
    // Refresca la caché de planes (getActivePlans / getPlanFromUser) sin redeploy
    revalidateTag("subscription-plans", {});
    revalidatePath("/admin/plans");
}

function sanitize(data: PlanFormInput) {
    return {
        name: data.name.trim(),
        slug: data.slug.trim().toLowerCase(),
        quota: Math.max(0, Math.trunc(data.quota)),
        price: Math.max(0, data.price),
        stripePriceId: data.stripePriceId?.trim() || null,
        isActive: data.isActive,
        sortOrder: Math.trunc(data.sortOrder),
        limits: {
            pollsPerEvent: Math.max(0, Math.trunc(data.limits.pollsPerEvent)),
            participantsPerEvent: Math.max(0, Math.trunc(data.limits.participantsPerEvent)),
            collaboratorsPerEvent: Math.max(0, Math.trunc(data.limits.collaboratorsPerEvent)),
            maxSharedEvents:
                data.limits.maxSharedEvents === null
                    ? null
                    : Math.max(0, Math.trunc(data.limits.maxSharedEvents)),
            // TIERLIST
            tierlistMaxTiers: Math.max(0, Math.trunc(data.limits.tierlistMaxTiers)),
            tierlistMaxOptions: Math.max(0, Math.trunc(data.limits.tierlistMaxOptions)),
            // PREGUNTAS
            preguntasMaxQuestions: Math.max(0, Math.trunc(data.limits.preguntasMaxQuestions)),
            preguntasMaxOptions: Math.max(0, Math.trunc(data.limits.preguntasMaxOptions)),
            preguntasMaxPerPage: Math.max(0, Math.trunc(data.limits.preguntasMaxPerPage)),
            // DIBUJO
            drawingMaxEvents: Math.max(0, Math.trunc(data.limits.drawingMaxEvents)),
            drawingMinTimeSecs:
                data.limits.drawingMinTimeSecs === null
                    ? null
                    : Math.max(0, Math.trunc(data.limits.drawingMinTimeSecs)),
            drawingMaxTimeSecs:
                data.limits.drawingMaxTimeSecs === null
                    ? null
                    : Math.max(0, Math.trunc(data.limits.drawingMaxTimeSecs)),
            drawingAllowUnlimited: data.limits.drawingAllowUnlimited === true,
        } as Prisma.InputJsonValue,
        features: (data.features ?? {}) as Prisma.InputJsonValue,
    };
}

export async function updateSubscriptionPlan(id: string, data: PlanFormInput): Promise<ActionResult> {
    await requireAdmin();
    if (!data.name.trim() || !data.slug.trim()) {
        return { ok: false, error: "Nombre y slug son obligatorios." };
    }
    try {
        await prisma.subscriptionPlan.update({ where: { id }, data: sanitize(data) });
        invalidatePlans();
        return { ok: true };
    } catch (e) {
        console.error("[plan-actions] updateSubscriptionPlan:", e);
        return { ok: false, error: "Error al guardar. ¿Slug o priceId duplicado?" };
    }
}

export async function createSubscriptionPlan(data: PlanFormInput): Promise<ActionResult> {
    await requireAdmin();
    if (!data.name.trim() || !data.slug.trim()) {
        return { ok: false, error: "Nombre y slug son obligatorios." };
    }
    try {
        await prisma.subscriptionPlan.create({ data: sanitize(data) });
        invalidatePlans();
        return { ok: true };
    } catch (e) {
        console.error("[plan-actions] createSubscriptionPlan:", e);
        return { ok: false, error: "Error al crear. ¿Slug o priceId duplicado?" };
    }
}

export async function togglePlanActive(id: string): Promise<ActionResult> {
    await requireAdmin();
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id }, select: { isActive: true } });
    if (!plan) return { ok: false, error: "Plan no encontrado." };
    await prisma.subscriptionPlan.update({ where: { id }, data: { isActive: !plan.isActive } });
    invalidatePlans();
    return { ok: true };
}

export async function deleteSubscriptionPlan(id: string): Promise<ActionResult> {
    await requireAdmin();
    const plan = await prisma.subscriptionPlan.findUnique({
        where: { id },
        select: { stripePriceId: true },
    });
    if (!plan) return { ok: false, error: "Plan no encontrado." };

    // No permitir eliminar un plan con usuarios activos asociados
    if (plan.stripePriceId) {
        const count = await prisma.user.count({ where: { stripePriceId: plan.stripePriceId } });
        if (count > 0) {
            return { ok: false, error: `No se puede eliminar: ${count} usuario(s) tienen este plan. Desactívalo en su lugar.` };
        }
    }

    await prisma.subscriptionPlan.delete({ where: { id } });
    invalidatePlans();
    return { ok: true };
}
