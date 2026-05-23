import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { computeDrawingPhase } from "@/lib/event-modes";

export const dynamic = "force-dynamic";

// GET /api/drawing/batch?eventId=X&seen=id1,id2
// Devuelve ~20 dibujos priorizando los menos vistos (reparto justo de exposición),
// excluyendo los ya vistos por el votante y su propio dibujo. Incrementa impresiones.
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const eventId = url.searchParams.get("eventId") ?? "";
        const seenParam = url.searchParams.get("seen") ?? "";
        const seen = seenParam ? seenParam.split(",").filter(Boolean).slice(0, 2000) : [];
        if (!eventId) return NextResponse.json({ error: "Falta el evento" }, { status: 400 });

        const cookieStore = await cookies();
        const voterId = cookieStore.get("voter_id")?.value ?? "";

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { mode: true, drawingPhase: true, drawingDeadline: true, votingDeadline: true },
        });
        if (!event || event.mode !== "DIBUJO") return NextResponse.json({ error: "Evento no válido" }, { status: 400 });

        const phase = computeDrawingPhase(event);
        if (phase !== "VOTING") return NextResponse.json({ items: [], phase }, { status: 200 });

        // Candidatos: menos vistos primero (índice [eventId, impressions]); excluir vistos y propio.
        const candidates = await prisma.drawingSubmission.findMany({
            where: {
                eventId,
                voterHash: { not: voterId },
                id: { notIn: seen.length ? seen : ["__none__"] },
            },
            orderBy: { impressions: "asc" },
            take: 40,
            select: { id: true, imageUrl: true },
        });

        // Barajar y quedarnos con 20 (variedad dentro de los menos vistos)
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        const batch = candidates.slice(0, 20);

        if (batch.length > 0) {
            await prisma.drawingSubmission.updateMany({
                where: { id: { in: batch.map((b) => b.id) } },
                data: { impressions: { increment: 1 } },
            });
        }

        return NextResponse.json({ items: batch, phase });
    } catch (error) {
        console.error("[drawing/batch]", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
