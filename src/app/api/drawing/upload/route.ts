import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit-redis";
import { putDrawing, drawingKey } from "@/lib/drawing-storage";
import { computeDrawingPhase } from "@/lib/event-modes";

export const runtime = "nodejs";

// POST /api/drawing/upload  (multipart: file=PNG, eventId)
export async function POST(req: Request) {
    const ip = getClientIp(req);
    const rl = await rateLimit(`drawing:upload:${ip}`, 5);
    if (!rl.allowed) return tooManyRequests(rl, "Demasiadas subidas.");

    try {
        const form = await req.formData();
        const eventId = String(form.get("eventId") ?? "");
        const file = form.get("file");
        if (!eventId || !(file instanceof Blob)) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
        }
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "El dibujo es demasiado grande." }, { status: 413 });
        }

        const cookieStore = await cookies();
        const voterId = cookieStore.get("voter_id")?.value;
        if (!voterId) return NextResponse.json({ error: "No se pudo identificar la sesión" }, { status: 400 });

        const session = await auth();
        const userId = session?.user?.id ?? null;

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { mode: true, drawingPhase: true, drawingDeadline: true, votingDeadline: true },
        });
        if (!event || event.mode !== "DIBUJO") return NextResponse.json({ error: "Evento no válido" }, { status: 400 });

        const phase = computeDrawingPhase(event);
        if (phase !== "DRAWING") return NextResponse.json({ error: "La fase de dibujo ha terminado." }, { status: 403 });

        // Un dibujo por votante
        const existing = await prisma.drawingSubmission.findUnique({
            where: { eventId_voterHash: { eventId, voterHash: voterId } },
            select: { id: true },
        });
        if (existing) return NextResponse.json({ error: "Ya has enviado tu dibujo." }, { status: 403 });

        // Crear el registro para obtener el id, subir a Blob, y actualizar la URL
        const submission = await prisma.drawingSubmission.create({
            data: { eventId, voterHash: voterId, userId, imageUrl: "", blobKey: "" },
        });

        const buffer = Buffer.from(await file.arrayBuffer());
        const key = drawingKey(eventId, submission.id);
        const stored = await putDrawing(buffer, key);

        await prisma.drawingSubmission.update({
            where: { id: submission.id },
            data: { imageUrl: stored.url, blobKey: stored.key },
        });

        return NextResponse.json({ success: true, imageUrl: stored.url });
    } catch (error: unknown) {
        const code = (error as { code?: string })?.code;
        if (code === "P2002") return NextResponse.json({ error: "Ya has enviado tu dibujo." }, { status: 403 });
        console.error("[drawing/upload]", error);
        return NextResponse.json({ error: "Error al subir el dibujo" }, { status: 500 });
    }
}
