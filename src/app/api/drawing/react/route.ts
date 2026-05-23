import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit-redis";
import { computeDrawingPhase, REACTION_POINTS } from "@/lib/event-modes";

// POST /api/drawing/react
// Body: { submissionId, type: "LIKE" | "DISLIKE" | "SUPERLIKE" }
export async function POST(req: Request) {
    const ip = getClientIp(req);
    const rl = await rateLimit(`drawing:react:${ip}`, 60);
    if (!rl.allowed) return tooManyRequests(rl, "Demasiadas reacciones.");

    try {
        const body = await req.json();
        const submissionId = String(body.submissionId ?? "");
        const type = String(body.type ?? "") as "LIKE" | "DISLIKE" | "SUPERLIKE";
        if (!submissionId || !["LIKE", "DISLIKE", "SUPERLIKE"].includes(type)) {
            return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
        }

        const cookieStore = await cookies();
        const voterId = cookieStore.get("voter_id")?.value;
        if (!voterId) return NextResponse.json({ error: "No se pudo identificar la sesión" }, { status: 400 });

        const session = await auth();
        const userId = session?.user?.id ?? null;

        const submission = await prisma.drawingSubmission.findUnique({
            where: { id: submissionId },
            select: {
                id: true,
                eventId: true,
                event: { select: { mode: true, drawingPhase: true, drawingDeadline: true, votingDeadline: true } },
            },
        });
        if (!submission || submission.event.mode !== "DIBUJO") {
            return NextResponse.json({ error: "Dibujo no encontrado" }, { status: 404 });
        }
        if (computeDrawingPhase(submission.event) !== "VOTING") {
            return NextResponse.json({ error: "La votación no está activa." }, { status: 403 });
        }

        const eventId = submission.eventId;

        // Una reacción por dibujo y votante
        const existing = await prisma.drawingReaction.findUnique({
            where: { submissionId_voterHash: { submissionId, voterHash: voterId } },
            select: { id: true },
        });
        if (existing) return NextResponse.json({ error: "Ya has reaccionado a este dibujo" }, { status: 403 });

        // Máximo 1 SUPERLIKE por evento y votante
        if (type === "SUPERLIKE") {
            const used = await prisma.drawingReaction.count({
                where: { eventId, voterHash: voterId, type: "SUPERLIKE" },
            });
            if (used >= 1) {
                return NextResponse.json({ error: "Ya has usado tu superlike en este evento." }, { status: 409 });
            }
        }

        const delta = REACTION_POINTS[type];
        const counterField =
            type === "LIKE" ? "likeCount" : type === "DISLIKE" ? "dislikeCount" : "superlikeCount";

        await prisma.$transaction([
            prisma.drawingReaction.create({
                data: { submissionId, eventId, voterHash: voterId, userId, type },
            }),
            prisma.drawingSubmission.update({
                where: { id: submissionId },
                data: { score: { increment: delta }, [counterField]: { increment: 1 } },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const code = (error as { code?: string })?.code;
        if (code === "P2002") return NextResponse.json({ error: "Ya has reaccionado a este dibujo" }, { status: 403 });
        console.error("[drawing/react]", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
