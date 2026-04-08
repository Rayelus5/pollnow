"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== "ADMIN") redirect("/admin");
    return session!;
}

// ─── Promotion Config (bono de bienvenida) ────────────────────────────────────

export async function getPromotionConfig() {
    return prisma.promotionConfig.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", isActive: false, planSlug: "plus", durationDays: 30 },
        update: {},
    });
}

export async function updatePromotionConfig(data: {
    isActive: boolean;
    planSlug: string;
    durationDays: number;
}) {
    await requireAdmin();
    await prisma.promotionConfig.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", ...data },
        update: data,
    });
    revalidatePath("/admin/promotions", "page");
}

// ─── Sorteos (Raffles) ────────────────────────────────────────────────────────

export async function getRaffles() {
    return prisma.raffle.findMany({
        orderBy: { createdAt: "desc" },
        include: { winner: { select: { id: true, name: true, email: true, image: true } } },
    });
}

export async function createRaffle(data: {
    title: string;
    description: string;
    deadline: string;
    showCounter: boolean;
    maxParticipants?: number | null;
    condition: string;
    bannerText?: string;
    showInBanner: boolean;
}) {
    await requireAdmin();
    await prisma.raffle.create({
        data: {
            title: data.title,
            description: data.description,
            deadline: new Date(data.deadline),
            showCounter: data.showCounter,
            maxParticipants: data.maxParticipants ?? null,
            condition: data.condition,
            bannerText: data.bannerText ?? null,
            showInBanner: data.showInBanner,
        },
    });
    // revalidatePath omitted intentionally: the client calls window.location.reload()
    // which handles the refresh. Calling revalidatePath here triggers an inline
    // page re-render in the action response that can fail in the auth context.
    if (data.showInBanner) revalidateTag("announcement", {});
}

export async function updateRaffle(
    id: string,
    data: Partial<{
        title: string;
        description: string;
        deadline: string;
        showCounter: boolean;
        maxParticipants: number | null;
        condition: string;
        bannerText: string;
        showInBanner: boolean;
        status: string;
    }>
) {
    await requireAdmin();
    const { deadline, status, ...rest } = data;
    await prisma.raffle.update({
        where: { id },
        data: {
            ...rest,
            ...(deadline ? { deadline: new Date(deadline) } : {}),
            ...(status ? { status: status as any } : {}),
        },
    });
    revalidatePath("/admin/promotions", "page");
    revalidateTag("announcement", {});
}

export async function deleteRaffle(id: string) {
    await requireAdmin();
    await prisma.raffle.delete({ where: { id } });
    revalidateTag("announcement", {});
}

export async function selectRaffleWinner(raffleId: string, winnerId?: string) {
    await requireAdmin();

    let chosenId = winnerId;

    if (!chosenId) {
        const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
        if (!raffle) return { error: "Sorteo no encontrado" };

        const where =
            raffle.condition === "registered_before_deadline"
                ? { createdAt: { lte: raffle.deadline } }
                : {};

        const users = await prisma.user.findMany({ where, select: { id: true } });
        if (users.length === 0) return { error: "No hay participantes elegibles" };

        chosenId = users[Math.floor(Math.random() * users.length)].id;
    }

    await prisma.raffle.update({
        where: { id: raffleId },
        data: { winnerId: chosenId, status: "WINNER_SELECTED" },
    });

    revalidatePath("/admin/promotions", "page");
    return { success: true };
}

export async function getRaffleEligibleUsers(raffleId: string) {
    await requireAdmin();
    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
    if (!raffle) return [];

    const where =
        raffle.condition === "registered_before_deadline"
            ? { createdAt: { lte: raffle.deadline } }
            : {};

    return prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, image: true, createdAt: true },
        orderBy: { createdAt: "asc" },
    });
}

// ─── Announcement Bar ─────────────────────────────────────────────────────────

export async function getAnnouncementBar() {
    return prisma.announcementBar.upsert({
        where: { id: "global" },
        create: { id: "global", text: "", isActive: false },
        update: {},
    });
}

export async function upsertAnnouncementBar(data: {
    text: string;
    link?: string;
    linkText?: string;
    isActive: boolean;
}) {
    await requireAdmin();
    await prisma.announcementBar.upsert({
        where: { id: "global" },
        create: { id: "global", ...data },
        update: data,
    });
    revalidatePath("/", "layout");
    revalidateTag("announcement", {});
    revalidatePath("/admin/promotions", "page");
}
