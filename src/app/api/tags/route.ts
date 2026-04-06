import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: Request) {
    // Rate limit: 60 suggestions/min per IP
    const ip = getClientIp(req);
    const { allowed, retryAfter } = rateLimit(`tags:${ip}`, 60);
    if (!allowed) {
        return NextResponse.json(
            { error: "Demasiadas peticiones." },
            { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase().trim().slice(0, 30) ?? "";

    const events = await prisma.event.findMany({
        select: { tags: true },
        where: { isPublic: true },
    });

    const tagCounts: Record<string, number> = {};
    for (const event of events) {
        for (const raw of event.tags) {
            const tag = raw.toLowerCase().trim();
            if (!tag) continue;
            if (!q || tag.includes(q)) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
        }
    }

    const suggestions = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag, count]) => ({ tag, count }));

    return NextResponse.json(suggestions);
}
