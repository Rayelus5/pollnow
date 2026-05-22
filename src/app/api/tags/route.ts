import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit-redis";

// Conteo de tags de todos los eventos públicos, cacheado (tag "events-public", 5 min).
// Evita escanear todos los eventos en cada pulsación del autocompletado.
const getAllTagCounts = unstable_cache(
    async (): Promise<Record<string, number>> => {
        const events = await prisma.event.findMany({
            select: { tags: true },
            where: { isPublic: true },
        });
        const counts: Record<string, number> = {};
        for (const event of events) {
            for (const raw of event.tags) {
                const tag = raw.toLowerCase().trim();
                if (!tag) continue;
                counts[tag] = (counts[tag] || 0) + 1;
            }
        }
        return counts;
    },
    ["tags-counts"],
    { tags: ["events-public"], revalidate: 300 }
);

export async function GET(req: Request) {
    // Rate limit: 60 suggestions/min per IP
    const ip = getClientIp(req);
    const rl = await rateLimit(`tags:${ip}`, 60);
    if (!rl.allowed) return tooManyRequests(rl, "Demasiadas peticiones.");

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase().trim().slice(0, 30) ?? "";

    const allCounts = await getAllTagCounts();

    const suggestions = Object.entries(allCounts)
        .filter(([tag]) => !q || tag.includes(q))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag, count]) => ({ tag, count }));

    return NextResponse.json(suggestions);
}
