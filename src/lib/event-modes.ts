// src/lib/event-modes.ts
//
// Lógica de negocio compartida de los modos de evento (v3.0). Centraliza la
// validación de límites por plan y el cálculo de la fase efectiva de DIBUJO,
// para no duplicarla entre server actions y rutas API.

import { prisma } from "@/lib/prisma";
import type { ResolvedPlan } from "@/lib/plans";
import type { DrawingPhase } from "@prisma/client";

/** Valores de DrawingPhase como strings (evita acoplar a importaciones de enum en cliente). */
export const DRAWING_PHASES = ["DRAWING", "VOTING", "RESULTS"] as const;
export type DrawingPhaseValue = (typeof DRAWING_PHASES)[number];

/** Puntos que aporta cada reacción al score de un dibujo. */
export const REACTION_POINTS = { LIKE: 100, DISLIKE: -100, SUPERLIKE: 300 } as const;

export type LimitCheck = { ok: boolean; error?: string };

// ---------------------------------------------------------------------------
// DIBUJO
// ---------------------------------------------------------------------------

/**
 * Comprueba si el usuario puede crear OTRO evento DIBUJO según su plan.
 * Cuenta los eventos DIBUJO ya existentes del usuario y los compara con el límite.
 */
export async function canCreateDrawingEvent(
    userId: string,
    plan: ResolvedPlan
): Promise<LimitCheck> {
    const max = plan.limits.drawingMaxEvents;
    if (max <= 0) {
        return {
            ok: false,
            error: `Tu plan ${plan.name} no permite crear eventos de tipo Dibujo. Mejora a Premium o superior.`,
        };
    }
    const current = await prisma.event.count({ where: { userId, mode: "DIBUJO" } });
    if (current >= max) {
        return {
            ok: false,
            error: `Has alcanzado el máximo de ${max} evento(s) de tipo Dibujo de tu plan ${plan.name}.`,
        };
    }
    return { ok: true };
}

/**
 * Normaliza el tiempo de dibujo (segundos por participante) al rango permitido por el plan.
 * - `null` = el creador pidió "sin límite": se respeta solo si el plan lo permite; si no, se
 *   fuerza al máximo del plan.
 * - número: se acota a [min, max] del plan (si el plan no tiene tope, se respeta el valor).
 * Devuelve los segundos finales, o `null` si queda sin límite.
 */
export function clampDrawingTime(secs: number | null, plan: ResolvedPlan): number | null {
    const { drawingMinTimeSecs, drawingMaxTimeSecs, drawingAllowUnlimited } = plan.limits;
    const min = drawingMinTimeSecs ?? 10;

    // Petición de tiempo ilimitado
    if (secs === null) {
        if (drawingAllowUnlimited) return null;
        return drawingMaxTimeSecs ?? min; // sin permiso de ilimitado → tope del plan
    }

    let value = Math.max(min, Math.trunc(secs));
    if (drawingMaxTimeSecs !== null) value = Math.min(value, drawingMaxTimeSecs);
    return value;
}

/**
 * Calcula la fase EFECTIVA de un evento DIBUJO según las fechas y el ahora.
 * Es la fuente de verdad en tiempo real (la página `/e/[slug]` es force-dynamic),
 * independiente de la frecuencia del cron de respaldo.
 */
export function computeDrawingPhase(
    event: {
        drawingPhase: DrawingPhase | null;
        drawingDeadline: Date | null;
        votingDeadline: Date | null;
    },
    now: Date = new Date()
): DrawingPhaseValue {
    if (event.votingDeadline && now >= event.votingDeadline) return "RESULTS";
    if (event.drawingDeadline && now >= event.drawingDeadline) return "VOTING";
    return (event.drawingPhase as DrawingPhaseValue | null) ?? "DRAWING";
}

// ---------------------------------------------------------------------------
// TIERLIST
// ---------------------------------------------------------------------------

export function checkTierlistTiersLimit(currentTiers: number, plan: ResolvedPlan): LimitCheck {
    if (currentTiers >= plan.limits.tierlistMaxTiers) {
        return { ok: false, error: `Límite de ${plan.limits.tierlistMaxTiers} tiers alcanzado en tu plan ${plan.name}.` };
    }
    return { ok: true };
}

export function checkTierlistOptionsLimit(currentOptions: number, plan: ResolvedPlan): LimitCheck {
    if (currentOptions >= plan.limits.tierlistMaxOptions) {
        return { ok: false, error: `Límite de ${plan.limits.tierlistMaxOptions} nominados alcanzado en tu plan ${plan.name}.` };
    }
    return { ok: true };
}

// ---------------------------------------------------------------------------
// PREGUNTAS
// ---------------------------------------------------------------------------

export function checkPreguntasQuestionsLimit(currentQuestions: number, plan: ResolvedPlan): LimitCheck {
    if (currentQuestions >= plan.limits.preguntasMaxQuestions) {
        return { ok: false, error: `Límite de ${plan.limits.preguntasMaxQuestions} preguntas alcanzado en tu plan ${plan.name}.` };
    }
    return { ok: true };
}

export function checkPreguntasOptionsLimit(currentOptions: number, plan: ResolvedPlan): LimitCheck {
    if (currentOptions >= plan.limits.preguntasMaxOptions) {
        return { ok: false, error: `Límite de ${plan.limits.preguntasMaxOptions} opciones por pregunta de tu plan ${plan.name}.` };
    }
    return { ok: true };
}
