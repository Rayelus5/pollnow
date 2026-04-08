import { prisma } from "@/lib/prisma";
import { getPriceIdForSlug } from "@/lib/plans";

export async function applyWelcomeBonus(
    userId: string,
    planSlug: string,
    durationDays: number
): Promise<void> {
    const priceId = getPriceIdForSlug(planSlug);
    if (!priceId) return;

    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + durationDays);

    await prisma.user.update({
        where: { id: userId },
        data: {
            subscriptionStatus: "active",
            stripePriceId: priceId,
            subscriptionEndDate,
            welcomeBonusApplied: true,
        },
    });
}
