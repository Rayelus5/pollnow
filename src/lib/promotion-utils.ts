import { prisma } from "@/lib/prisma";
import { getPriceIdForSlug } from "@/lib/user-plan";

export async function applyWelcomeBonus(
    userId: string,
    planSlug: string,
    durationDays: number
): Promise<void> {
    const priceId = await getPriceIdForSlug(planSlug);
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
