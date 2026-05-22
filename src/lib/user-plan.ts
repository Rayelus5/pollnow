// src/lib/user-plan.ts
//
// Resolución de plan en SERVIDOR a partir de la tabla `SubscriptionPlan` (BD),
// con caché (`unstable_cache`, tag "subscription-plans", revalidate 1h) y
// fallback fail-open a los planes hardcodeados si la BD no responde.

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { FALLBACK_PLANS, resolvePlanFromList, type ResolvedPlan } from "@/lib/plans";

type PlanUserInput = {
    subscriptionStatus: string | null;
    stripePriceId: string | null;
    subscriptionEndDate?: Date | null;
    stripeSubscriptionId?: string | null;
};

type DbPlanRow = {
    name: string;
    slug: string;
    quota: number;
    limits: unknown;
    features: unknown;
    price: number;
    stripePriceId: string | null;
};

function mapRow(row: DbPlanRow): ResolvedPlan {
    const l = (row.limits ?? {}) as Record<string, number | null | undefined>;
    const num = (v: number | null | undefined, fallback: number) =>
        v === null || v === undefined ? fallback : v;
    return {
        name: row.name,
        slug: row.slug,
        quota: row.quota,
        limits: {
            pollsPerEvent: num(l.pollsPerEvent, 0),
            participantsPerEvent: num(l.participantsPerEvent, 0),
            collaboratorsPerEvent: num(l.collaboratorsPerEvent, 0),
            // null/ausente = ilimitado
            maxSharedEvents:
                l.maxSharedEvents === null || l.maxSharedEvents === undefined
                    ? Infinity
                    : l.maxSharedEvents,
        },
        price: row.price,
        priceId: row.stripePriceId,
        features: (row.features ?? {}) as Record<string, unknown>,
    };
}

const loadPlans = unstable_cache(
    async (): Promise<ResolvedPlan[]> => {
        const rows = await prisma.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: {
                name: true,
                slug: true,
                quota: true,
                limits: true,
                features: true,
                price: true,
                stripePriceId: true,
            },
        });
        return rows.map(mapRow);
    },
    ["subscription-plans"],
    { tags: ["subscription-plans"], revalidate: 3600 }
);

/** Lista de planes activos desde BD (cacheada), con fallback hardcodeado. */
export async function getActivePlans(): Promise<ResolvedPlan[]> {
    try {
        const plans = await loadPlans();
        return plans.length ? plans : FALLBACK_PLANS;
    } catch (e) {
        console.error("[plans] Error leyendo SubscriptionPlan de BD; usando fallback hardcodeado:", e);
        return FALLBACK_PLANS;
    }
}

function freeOf(plans: ResolvedPlan[]): ResolvedPlan {
    return (
        plans.find((p) => p.slug === "free") ??
        FALLBACK_PLANS.find((p) => p.slug === "free")!
    );
}

/**
 * Resuelve el plan de un usuario leyendo los planes de BD (cacheados).
 * Reemplaza la versión síncrona hardcodeada de `@/lib/plans` en servidor.
 */
export async function getPlanFromUser(user: PlanUserInput): Promise<ResolvedPlan> {
    const plans = await getActivePlans();
    return resolvePlanFromList(user, plans);
}

/** priceId de Stripe para un slug de plan, leído de BD (con fallback hardcodeado). */
export async function getPriceIdForSlug(slug: string): Promise<string | null> {
    const plans = await getActivePlans();
    return plans.find((p) => p.slug === slug)?.priceId ?? null;
}

/** Plan del usuario de la sesión actual (o Free para visitantes). */
export async function getCurrentUserPlan(): Promise<ResolvedPlan> {
    const session = await auth();

    if (!session?.user?.id) {
        return freeOf(await getActivePlans());
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            subscriptionStatus: true,
            stripePriceId: true,
            subscriptionEndDate: true,
            stripeSubscriptionId: true,
        },
    });

    if (!user) return freeOf(await getActivePlans());

    return getPlanFromUser(user);
}
