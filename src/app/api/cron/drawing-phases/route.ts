import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Respaldo del cálculo en tiempo real de /e/[slug]: avanza la fase de los eventos
// DIBUJO según sus fechas. La transición real ocurre lazy al cargar la página,
// así que este cron solo "limpia" los que nadie haya visitado.
export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // DRAWING → VOTING (pasó el cierre de dibujo, aún no el de votación)
    const toVoting = await prisma.event.updateMany({
        where: { mode: "DIBUJO", drawingPhase: "DRAWING", drawingDeadline: { lt: now } },
        data: { drawingPhase: "VOTING" },
    });

    // VOTING → RESULTS (pasó el cierre de votación)
    const toResults = await prisma.event.updateMany({
        where: { mode: "DIBUJO", drawingPhase: { in: ["DRAWING", "VOTING"] }, votingDeadline: { lt: now } },
        data: { drawingPhase: "RESULTS" },
    });

    return NextResponse.json({ toVoting: toVoting.count, toResults: toResults.count, at: now.toISOString() });
}
