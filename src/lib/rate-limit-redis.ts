/**
 * Rate limiting distribuido con Upstash Redis (multi-instancia / Vercel).
 *
 * Fail-open: si faltan las env vars de Upstash o Redis no responde, se PERMITE
 * la request (y se registra), para no tumbar la app por un fallo de infra.
 *
 * Sustituye al limitador in-memory de `@/lib/rate-limit` (deprecado).
 */

import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

if (!redis) {
    console.warn(
        "[rate-limit] Upstash no configurado (UPSTASH_REDIS_REST_URL/TOKEN ausentes). " +
            "Rate limiting en modo FAIL-OPEN: todas las requests pasan."
    );
}

// Reutilizamos instancias de Ratelimit por combinación límite+ventana
const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, window: Duration): Ratelimit | null {
    if (!redis) return null;
    const cacheKey = `${limit}:${window}`;
    let limiter = limiters.get(cacheKey);
    if (!limiter) {
        limiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(limit, window),
            analytics: true,
            prefix: "pollnow_rl",
        });
        limiters.set(cacheKey, limiter);
    }
    return limiter;
}

export type RateLimitResult = {
    allowed: boolean;
    limit: number;
    remaining: number;
    /** Timestamp Unix (segundos) en que se reinicia la ventana. */
    reset: number;
    /** Segundos hasta poder reintentar (0 si allowed). */
    retryAfter: number;
};

const nowSec = () => Math.floor(Date.now() / 1000);

function failOpen(limit: number): RateLimitResult {
    return { allowed: true, limit, remaining: limit, reset: nowSec() + 60, retryAfter: 0 };
}

/**
 * Comprueba el rate limit para una clave.
 * @param key    Identificador único, p.ej. `vote:${userId}` o `tags:${ip}`
 * @param limit  Máximo de requests por ventana
 * @param window Ventana (formato Upstash, p.ej. "60 s", "1 m"). Por defecto "60 s".
 */
export async function rateLimit(
    key: string,
    limit: number,
    window: Duration = "60 s"
): Promise<RateLimitResult> {
    const limiter = getLimiter(limit, window);
    if (!limiter) return failOpen(limit);

    try {
        const res = await limiter.limit(key);
        const resetSec = Math.ceil(res.reset / 1000);
        return {
            allowed: res.success,
            limit: res.limit,
            remaining: Math.max(0, res.remaining),
            reset: resetSec,
            retryAfter: Math.max(0, resetSec - nowSec()),
        };
    } catch (e) {
        console.error("[rate-limit] Error de Redis; fail-open:", e);
        return failOpen(limit);
    }
}

/** Headers RFC de rate limit. Incluye `Retry-After` solo si `include429`. */
export function rateLimitHeaders(r: RateLimitResult, include429 = false): Record<string, string> {
    const h: Record<string, string> = {
        "RateLimit-Limit": String(r.limit),
        "RateLimit-Remaining": String(r.remaining),
        "RateLimit-Reset": String(r.reset),
    };
    if (include429) h["Retry-After"] = String(r.retryAfter);
    return h;
}

/** Respuesta 429 estándar con headers RFC. */
export function tooManyRequests(
    r: RateLimitResult,
    message = "Demasiadas peticiones. Inténtalo en unos segundos."
) {
    return NextResponse.json({ error: message }, { status: 429, headers: rateLimitHeaders(r, true) });
}

/** Extrae la IP del cliente de una Request de Next.js. */
export function getClientIp(req: Request): string {
    const xff = req.headers.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
    return req.headers.get("x-real-ip") ?? "unknown";
}
