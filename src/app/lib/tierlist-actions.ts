"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanFromUser } from "@/lib/user-plan";
import { checkEventAccess, triggerDataChanged } from "@/lib/event-access";
import { revalidatePath } from "next/cache";

const DEFAULT_TIER_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

// --- CREAR TIER ---
export async function createTier(eventId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canManagePolls");
    if (!hasAccess) return { error: "Sin permisos" };

    const label = ((formData.get("label") as string) ?? "").trim().slice(0, 50);
    const color = (formData.get("color") as string) || null;
    if (!label) return { error: "El nombre del tier es obligatorio." };

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { userId: true, _count: { select: { tiers: true } } },
    });
    if (!event) return { error: "Evento no encontrado" };

    const owner = await prisma.user.findUnique({ where: { id: event.userId } });
    if (!owner) return { error: "Dueño no encontrado" };
    const plan = await getPlanFromUser(owner);

    if (event._count.tiers >= plan.limits.tierlistMaxTiers) {
        return { error: `Límite de ${plan.limits.tierlistMaxTiers} tiers de tu plan ${plan.name}.` };
    }

    const last = await prisma.tierlistTier.findFirst({ where: { eventId }, orderBy: { order: "desc" } });
    const order = (last?.order ?? -1) + 1;

    await prisma.tierlistTier.create({
        data: {
            eventId,
            label,
            color: color ?? DEFAULT_TIER_COLORS[order % DEFAULT_TIER_COLORS.length],
            order,
        },
    });

    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "tiers");
    return { success: true };
}

// --- ACTUALIZAR TIER ---
export async function updateTier(tierId: string, eventId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canManagePolls");
    if (!hasAccess) return { error: "Sin permisos" };

    const label = ((formData.get("label") as string) ?? "").trim().slice(0, 50);
    const color = (formData.get("color") as string) || undefined;
    if (!label) return { error: "El nombre del tier es obligatorio." };

    await prisma.tierlistTier.update({ where: { id: tierId }, data: { label, color } });

    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "tiers");
    return { success: true };
}

// --- BORRAR TIER ---
export async function deleteTier(tierId: string, eventId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canManagePolls");
    if (!hasAccess) return { error: "Sin permisos" };

    await prisma.tierlistTier.delete({ where: { id: tierId } });

    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "tiers");
    return { success: true };
}

// --- REORDENAR TIERS ---
export async function reorderTiers(items: { id: string; order: number }[], eventId: string) {
    const session = await auth();
    if (!session?.user?.id) return;

    const hasAccess = await checkEventAccess(eventId, session.user.id, "canManagePolls");
    if (!hasAccess) return;

    await prisma.$transaction(
        items.map((item) => prisma.tierlistTier.update({ where: { id: item.id }, data: { order: item.order } }))
    );

    revalidatePath(`/dashboard/event/${eventId}`);
    await triggerDataChanged(eventId, session.user.id, "tiers");
}
