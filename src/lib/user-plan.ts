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
    const l = (row.limits ?? {}) as Record<string, number | boolean | null | undefined>;
    // Fallback por SLUG a los límites hardcodeados: cubre planes de BD creados antes
    // de que existieran campos nuevos (TIERLIST/PREGUNTAS/DIBUJO), evitando que un
    // límite ausente en el JSON resuelva a 0 y bloquee funciones que sí debería tener.
    const fb = FALLBACK_PLANS.find((p) => p.slug === row.slug)?.limits;

    const num = (v: number | boolean | null | undefined, fallback: number) =>
        v === null || v === undefined ? fallback : (v as number);
    // Para tiempos: si el JSON trae el campo se respeta (incluido null = sin tope);
    // si está ausente se usa el valor hardcodeado del plan.
    const numOrNull = (v: number | boolean | null | undefined, fallback: number | null): number | null =>
        v === undefined ? fallback : v === null ? null : (v as number);
    const bool = (v: number | boolean | null | undefined, fallback: boolean) =>
        v === undefined ? fallback : v === true;

    return {
        name: row.name,
        slug: row.slug,
        quota: row.quota,
        limits: {
            pollsPerEvent: num(l.pollsPerEvent, fb?.pollsPerEvent ?? 0),
            participantsPerEvent: num(l.participantsPerEvent, fb?.participantsPerEvent ?? 0),
            collaboratorsPerEvent: num(l.collaboratorsPerEvent, fb?.collaboratorsPerEvent ?? 0),
            // null/ausente = ilimitado
            maxSharedEvents:
                l.maxSharedEvents === null || l.maxSharedEvents === undefined
                    ? Infinity
                    : (l.maxSharedEvents as number),
            // TIERLIST / PREGUNTAS / DIBUJO (fallback al valor hardcodeado del plan)
            tierlistMaxTiers: num(l.tierlistMaxTiers, fb?.tierlistMaxTiers ?? 0),
            tierlistMaxOptions: num(l.tierlistMaxOptions, fb?.tierlistMaxOptions ?? 0),
            preguntasMaxQuestions: num(l.preguntasMaxQuestions, fb?.preguntasMaxQuestions ?? 0),
            preguntasMaxOptions: num(l.preguntasMaxOptions, fb?.preguntasMaxOptions ?? 0),
            preguntasMaxPerPage: num(l.preguntasMaxPerPage, fb?.preguntasMaxPerPage ?? 0),
            drawingMaxEvents: num(l.drawingMaxEvents, fb?.drawingMaxEvents ?? 0),
            drawingMinTimeSecs: numOrNull(l.drawingMinTimeSecs, fb?.drawingMinTimeSecs ?? null),
            drawingMaxTimeSecs: numOrNull(l.drawingMaxTimeSecs, fb?.drawingMaxTimeSecs ?? null),
            drawingAllowUnlimited: bool(l.drawingAllowUnlimited, fb?.drawingAllowUnlimited ?? false),
        },
        price: row.price,
        priceId: row.stripePriceId,
        features: (row.features ?? {}) as Record<string, unknown>,
    };
}

// IMPORTANTE: cacheamos las FILAS CRUDAS de BD y aplicamos mapRow DESPUÉS, fuera de
// la caché. `unstable_cache` serializa su valor a JSON y `Infinity` (que mapRow usa
// para "ilimitado") se convierte en `null` al serializarse, corrompiendo límites como
// `maxSharedEvents`. Manteniendo mapRow fuera de la caché, el `Infinity` se regenera
// fresco en cada llamada y nunca se serializa.
const loadPlanRows = unstable_cache(
    async (): Promise<DbPlanRow[]> => {
        return prisma.subscriptionPlan.findMany({
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
    },
    ["subscription-plans"],
    { tags: ["subscription-plans"], revalidate: 3600 }
);

/** Lista de planes activos desde BD (cacheada), con fallback hardcodeado. */
export async function getActivePlans(): Promise<ResolvedPlan[]> {
    try {
        const rows = await loadPlanRows();
        return rows.length ? rows.map(mapRow) : FALLBACK_PLANS;
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
