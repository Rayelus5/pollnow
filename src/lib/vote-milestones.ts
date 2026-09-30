// src/lib/vote-milestones.ts
//
// Aviso de "hitos" de votación de nominados (GALA/TIERLIST/PREGUNTAS) sin
// generar una notificación por cada voto. Un evento puede recibir 400+ votos
// en menos de 2 horas (streamers en directo): notificar cada voto saturaría
// Telegram y sería ruido inútil.
//
// En su lugar, se lleva un contador atómico en Redis (mismo Upstash usado
// para rate limiting) y un "lock" NX por umbral: aunque lleguen cientos de
// peticiones casi simultáneas, cada umbral dispara como máximo un mensaje.
// Fail-open: si Redis no está configurado o falla, simplemente no se avisa
// (nunca bloquea ni rompe el flujo de voto).

import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/prisma";
import { notifyVoteMilestone } from "@/lib/telegram";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const MILESTONES = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
const MILESTONE_LOCK_TTL_SECONDS = 60 * 60 * 24 * 120; // 120 días

const countKey = (eventId: string) => `votes:count:${eventId}`;
const milestoneKey = (eventId: string, threshold: number) => `votes:milestone:${eventId}:${threshold}`;

/** Incrementa el contador de votos del evento y avisa por Telegram si se cruza un umbral. */
export async function checkVoteMilestone(eventId: string): Promise<void> {
    if (!redis) return;
    try {
        const count = await redis.incr(countKey(eventId));
        for (const threshold of MILESTONES) {
            if (count < threshold) continue;

            const claimed = await redis.set(milestoneKey(eventId, threshold), 1, {
                nx: true,
                ex: MILESTONE_LOCK_TTL_SECONDS,
            });
            if (claimed !== "OK") continue; // ya notificado por otra petición concurrente

            const event = await prisma.event.findUnique({
                where: { id: eventId },
                select: { title: true, slug: true },
            });
            if (event) {
                await notifyVoteMilestone({ eventId, slug: event.slug, title: event.title, threshold, count });
            }
        }
    } catch (e) {
        console.error("[vote-milestones] error (ignorado):", e);
    }
}
