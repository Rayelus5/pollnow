export const PLANS = {
    FREE: {
        name: "Free",
        slug: "free",
        quota: 1,
        limits: {
            pollsPerEvent: 5,
            participantsPerEvent: 12,
            collaboratorsPerEvent: 0,
            maxSharedEvents: 2,
        },
        price: 0,
    },
    ENTERPRISE: {
        name: "Enterprise",
        slug: "enterprise",
        quota: 150,
        limits: {
            pollsPerEvent: 50,
            participantsPerEvent: 1000,
            collaboratorsPerEvent: 30,
            maxSharedEvents: Infinity,
        },
        price: 0,
        priceId: "enterprise",
    },
    PREMIUM: {
        name: "Premium",
        slug: "premium",
        quota: 5,
        limits: {
            pollsPerEvent: 10,
            participantsPerEvent: 30,
            collaboratorsPerEvent: 1,
            maxSharedEvents: Infinity,
        },
        price: 2.99,
        priceId: "price_1T1tQSAnnRNk3k0PKQVAbjnb",
    },
    PLUS: {
        name: "Plus",
        slug: "plus",
        quota: 10,
        limits: {
            pollsPerEvent: 15,
            participantsPerEvent: 50,
            collaboratorsPerEvent: 5,
            maxSharedEvents: Infinity,
        },
        price: 8.99,
        priceId: "price_1T1tRmAnnRNk3k0PLPBcN1Pk",
    },
    UNLIMITED: {
        name: "Unlimited",
        slug: "unlimited",
        quota: 20,
        limits: {
            pollsPerEvent: 30,
            participantsPerEvent: 100,
            collaboratorsPerEvent: 15,
            maxSharedEvents: Infinity,
        },
        price: 12.99,
        priceId: "price_1SVz24AnnRNk3k0PvSjAEVQA",
    },
};

export function getPlanFromUser(user: {
    subscriptionStatus: string | null;
    stripePriceId: string | null;
    subscriptionEndDate?: Date | null;
    stripeSubscriptionId?: string | null;
}) {
    if (user.subscriptionStatus !== "active") return PLANS.FREE;

    // Si no hay Stripe real y la fecha de fin ha pasado, tratar como FREE
    // (el cron expira en batch, pero esto evita que el usuario vea perks caducados)
    if (
        !user.stripeSubscriptionId &&
        user.subscriptionEndDate &&
        user.subscriptionEndDate < new Date()
    ) {
        return PLANS.FREE;
    }

    if (user.stripePriceId === PLANS.ENTERPRISE.priceId) return PLANS.ENTERPRISE;
    if (user.stripePriceId === PLANS.UNLIMITED.priceId) return PLANS.UNLIMITED;
    if (user.stripePriceId === PLANS.PLUS.priceId) return PLANS.PLUS;
    if (user.stripePriceId === PLANS.PREMIUM.priceId) return PLANS.PREMIUM;

    return PLANS.FREE;
}

/** Devuelve el priceId de Stripe para un slug de plan dado. */
export function getPriceIdForSlug(slug: string): string | null {
    for (const plan of Object.values(PLANS)) {
        if (plan.slug === slug && "priceId" in plan) return plan.priceId;
    }
    return null;
}
