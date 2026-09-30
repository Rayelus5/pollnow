import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { replaceParticipantImage } from "@/lib/participant-image";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; participantId: string }> };

// POST /api/dashboard/event/[id]/participants/[participantId]/optimize-image
// Herramienta de admin: recomprime a WebP y re-aloja en Vercel Blob la imagen
// actual de un nominado (venga de base64, de una URL externa o de un blob sin
// optimizar), y borra el blob anterior si lo había. Usada por el botón
// "Optimizar todas las imágenes" en /dashboard/event/[id] (sección Nominados).
export async function POST(_req: Request, { params }: Params) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id: eventId, participantId } = await params;

    const participant = await prisma.participant.findUnique({ where: { id: participantId } });
    if (!participant || participant.eventId !== eventId) {
        return NextResponse.json({ error: "Nominado no encontrado" }, { status: 404 });
    }
    if (!participant.imageUrl) {
        return NextResponse.json({ error: "El nominado no tiene imagen" }, { status: 400 });
    }

    try {
        let buffer: Buffer;
        if (participant.imageUrl.startsWith("data:")) {
            const base64 = participant.imageUrl.split(",")[1] ?? "";
            buffer = Buffer.from(base64, "base64");
        } else {
            const res = await fetch(participant.imageUrl);
            if (!res.ok) return NextResponse.json({ error: "No se pudo descargar la imagen actual" }, { status: 502 });
            buffer = Buffer.from(await res.arrayBuffer());
        }

        const { url, originalSize, optimizedSize } = await replaceParticipantImage(eventId, participant.imageUrl, buffer);

        await prisma.participant.update({ where: { id: participantId }, data: { imageUrl: url } });
        revalidatePath(`/dashboard/event/${eventId}`);

        return NextResponse.json({ url, originalSize, optimizedSize });
    } catch (error) {
        console.error("[optimize-image]", error);
        return NextResponse.json({ error: "No se pudo optimizar la imagen" }, { status: 500 });
    }
}
