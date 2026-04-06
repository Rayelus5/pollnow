import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase().trim() || "";

    const events = await prisma.event.findMany({
        select: { tags: true },
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
