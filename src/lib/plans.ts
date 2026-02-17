export const PLANS = {
    FREE: {
        name: "Free",
        slug: "free",
        quota: 1,
        limits: {
            pollsPerEvent: 5,
            participantsPerEvent: 12
        },
        price: 0,
    },
    PREMIUM: {
        name: "Premium",
        slug: "premium",
        quota: 5,
        limits: {
            pollsPerEvent: 10,
            participantsPerEvent: 30
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
            participantsPerEvent: 50
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
            participantsPerEvent: 100
        },
        price: 12.99,
        priceId: "price_1SVz24AnnRNk3k0PvSjAEVQA",
    },
};

export function getPlanFromUser(user: { subscriptionStatus: string | null; stripePriceId: string | null }) {
    // Si la suscripción no está activa, es FREE
    if (user.subscriptionStatus !== 'active') return PLANS.FREE;

    // Si es activa, miramos qué precio está pagando
    if (user.stripePriceId === PLANS.UNLIMITED.priceId) return PLANS.UNLIMITED;
    if (user.stripePriceId === PLANS.PLUS.priceId) return PLANS.PLUS;
    if (user.stripePriceId === PLANS.PREMIUM.priceId) return PLANS.PREMIUM;

    return PLANS.FREE;
}