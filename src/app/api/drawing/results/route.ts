import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/drawing/results?eventId=X → top 100 por score
export async function GET(req: Request) {
    try {
        const eventId = new URL(req.url).searchParams.get("eventId") ?? "";
        if (!eventId) return NextResponse.json({ error: "Falta el evento" }, { status: 400 });

        const top = await prisma.drawingSubmission.findMany({
            where: { eventId },
            orderBy: [{ score: "desc" }, { createdAt: "asc" }],
            take: 100,
            select: {
                id: true,
                imageUrl: true,
                score: true,
                likeCount: true,
                dislikeCount: true,
                superlikeCount: true,
            },
        });

        const total = await prisma.drawingSubmission.count({ where: { eventId } });

        return NextResponse.json({ results: top, total });
    } catch (error) {
        console.error("[drawing/results]", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
