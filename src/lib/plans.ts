// src/lib/plans.ts
//
// Módulo CLIENT-SAFE de planes. NO importa prisma ni next/cache, por lo que se
// puede usar tanto en componentes cliente (display de tiers) como de servidor.
//
// Fuente de verdad para ENFORCEMENT en servidor: la tabla `SubscriptionPlan`
// (ver `getPlanFromUser` async en `@/lib/user-plan`). Las constantes `PLANS` de
// aquí se conservan como:
//   1) Datos de display en componentes cliente (tarjetas de precios, upsells).
//   2) Fallback fail-open si la BD no responde.

export type PlanLimits = {
    pollsPerEvent: number;
    participantsPerEvent: number;
    collaboratorsPerEvent: number;
    /** Infinity = ilimitado (en BD se almacena como null). */
    maxSharedEvents: number;

    // --- MODO TIERLIST (v3.0) ---
    /** Máximo de tiers (categorías) por tierlist. */
    tierlistMaxTiers: number;
    /** Máximo de nominados (opciones) por tierlist. */
    tierlistMaxOptions: number;

    // --- MODO PREGUNTAS (v3.0) ---
    /** Máximo de preguntas por evento. */
    preguntasMaxQuestions: number;
    /** Máximo de opciones (box/radio) por pregunta. */
    preguntasMaxOptions: number;
    /** Máximo de preguntas por página. */
    preguntasMaxPerPage: number;

    // --- MODO DIBUJO (v3.0) ---
    /** Máximo de eventos DIBUJO que puede tener el usuario (0 = no disponible). */
    drawingMaxEvents: number;
    /** Tiempo mínimo por participante en segundos (null = no aplica). */
    drawingMinTimeSecs: number | null;
    /** Tiempo máximo por participante en segundos (null = sin tope). */
    drawingMaxTimeSecs: number | null;
    /** Si puede configurar tiempo ilimitado para dibujar. */
    drawingAllowUnlimited: boolean;
};

export type ResolvedPlan = {
    name: string;
    slug: string;
    quota: number;
    limits: PlanLimits;
    price: number;
    priceId: string | null;
    features: Record<string, unknown>;
};

/**
 * @deprecated La fuente de verdad para los límites es la tabla `SubscriptionPlan`.
 * Estas constantes se mantienen solo para display en cliente y como fallback.
 */
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
            tierlistMaxTiers: 5,
            tierlistMaxOptions: 10,
            preguntasMaxQuestions: 8,
            preguntasMaxOptions: 5,
            preguntasMaxPerPage: 4,
            drawingMaxEvents: 0,
            drawingMinTimeSecs: null,
            drawingMaxTimeSecs: null,
            drawingAllowUnlimited: false,
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
            tierlistMaxTiers: 50,
            tierlistMaxOptions: 120,
            preguntasMaxQuestions: 70,
            preguntasMaxOptions: 50,
            preguntasMaxPerPage: 70,
            drawingMaxEvents: 15,
            drawingMinTimeSecs: 10,
            drawingMaxTimeSecs: null,
            drawingAllowUnlimited: true,
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
            tierlistMaxTiers: 10,
            tierlistMaxOptions: 20,
            preguntasMaxQuestions: 15,
            preguntasMaxOptions: 10,
            preguntasMaxPerPage: 15,
            drawingMaxEvents: 1,
            drawingMinTimeSecs: 10,
            drawingMaxTimeSecs: 180,
            drawingAllowUnlimited: false,
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
            tierlistMaxTiers: 15,
            tierlistMaxOptions: 35,
            preguntasMaxQuestions: 30,
            preguntasMaxOptions: 20,
            preguntasMaxPerPage: 30,
            drawingMaxEvents: 3,
            drawingMinTimeSecs: 10,
            drawingMaxTimeSecs: null,
            drawingAllowUnlimited: true,
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
            tierlistMaxTiers: 25,
            tierlistMaxOptions: 80,
            preguntasMaxQuestions: 50,
            preguntasMaxOptions: 30,
            preguntasMaxPerPage: 50,
            drawingMaxEvents: 8,
            drawingMinTimeSecs: 10,
            drawingMaxTimeSecs: null,
            drawingAllowUnlimited: true,
        },
        price: 12.99,
        priceId: "price_1SVz24AnnRNk3k0PvSjAEVQA",
    },
};

/** Lista de planes hardcodeados normalizada a `ResolvedPlan` (fallback fail-open). */
export const FALLBACK_PLANS: ResolvedPlan[] = Object.values(PLANS).map((p) => ({
    name: p.name,
    slug: p.slug,
    quota: p.quota,
    limits: p.limits,
    price: p.price,
    priceId: "priceId" in p ? (p as { priceId: string }).priceId : null,
    features: {},
}));

type PlanUserInput = {
    subscriptionStatus: string | null;
    stripePriceId: string | null;
    subscriptionEndDate?: Date | null;
    stripeSubscriptionId?: string | null;
};

const FALLBACK_FREE = FALLBACK_PLANS.find((p) => p.slug === "free")!;

/**
 * Lógica PURA de resolución de plan a partir de una lista de planes ya cargada.
 * No accede a BD: se usa tanto desde el resolver de servidor (con planes de BD)
 * como desde el fallback hardcodeado.
 */
export function resolvePlanFromList(user: PlanUserInput, plans: ResolvedPlan[]): ResolvedPlan {
    const free = plans.find((p) => p.slug === "free") ?? FALLBACK_FREE;

    if (user.subscriptionStatus !== "active") return free;

    // Suscripción de promoción sin Stripe ya caducada → tratar como Free
    if (
        !user.stripeSubscriptionId &&
        user.subscriptionEndDate &&
        user.subscriptionEndDate < new Date()
    ) {
        return free;
    }

    if (user.stripePriceId) {
        const match = plans.find((p) => p.priceId && p.priceId === user.stripePriceId);
        if (match) return match;
    }

    return free;
}

/**
 * @deprecated Versión SÍNCRONA basada en planes hardcodeados. En código de
 * servidor usa la versión async de `@/lib/user-plan`, que lee de BD y refleja
 * los cambios del admin. Se mantiene para componentes cliente y como fallback.
 */
export function getPlanFromUser(user: PlanUserInput): ResolvedPlan {
    return resolvePlanFromList(user, FALLBACK_PLANS);
}

/** Devuelve el priceId de Stripe para un slug de plan dado (versión hardcodeada/fallback). */
export function getPriceIdForSlug(slug: string): string | null {
    const plan = FALLBACK_PLANS.find((p) => p.slug === slug);
    return plan?.priceId ?? null;
}
