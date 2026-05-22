// src/lib/event-counters.ts
//
// Contadores de hot path (score de votos y likes por evento) cacheados en Redis
// con TTL 60s. Fail-open: si Redis no está configurado o falla, se recurre a la BD.
//
// - get*  → read-through (Redis, o BD + repoblar caché).
// - refresh* → recalcula desde BD (autoritativo) y refresca la caché; usar tras mutar.

import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/prisma";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const TTL = 60; // segundos
const scoreKey = (id: string) => `event:${id}:score`;
const likesKey = (id: string) => `event:${id}:likes`;

async function dbScore(eventId: string): Promise<number> {
    const { _sum } = await prisma.eventVote.aggregate({ where: { eventId }, _sum: { value: true } });
    return _sum.value ?? 0;
}

async function dbLikes(eventId: string): Promise<number> {
    return prisma.eventLike.count({ where: { eventId } });
}

async function cacheGet(key: string): Promise<number | null> {
    if (!redis) return null;
    try {
        const v = await redis.get<number>(key);
        return v === null || v === undefined ? null : Number(v);
    } catch (e) {
        console.error("[counters] Redis get falló; fail-open:", e);
        return null;
    }
}

async function cacheSet(key: string, value: number): Promise<void> {
    if (!redis) return;
    try {
        await redis.set(key, value, { ex: TTL });
    } catch (e) {
        console.error("[counters] Redis set falló; ignorado:", e);
    }
}

/** Score de votos del evento (Redis read-through, fallback BD). */
export async function getEventScore(eventId: string): Promise<number> {
    const cached = await cacheGet(scoreKey(eventId));
    if (cached !== null) return cached;
    const score = await dbScore(eventId);
    await cacheSet(scoreKey(eventId), score);
    return score;
}

/** Nº de likes del evento (Redis read-through, fallback BD). */
export async function getEventLikes(eventId: string): Promise<number> {
    const cached = await cacheGet(likesKey(eventId));
    if (cached !== null) return cached;
    const likes = await dbLikes(eventId);
    await cacheSet(likesKey(eventId), likes);
    return likes;
}

/** Recalcula el score desde BD y refresca la caché. Usar tras registrar un voto. */
export async function refreshEventScore(eventId: string): Promise<number> {
    const score = await dbScore(eventId);
    await cacheSet(scoreKey(eventId), score);
    return score;
}

/** Recalcula los likes desde BD y refresca la caché. Usar tras un like/unlike. */
export async function refreshEventLikes(eventId: string): Promise<number> {
    const likes = await dbLikes(eventId);
    await cacheSet(likesKey(eventId), likes);
    return likes;
}
