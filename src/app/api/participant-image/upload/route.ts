import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit-redis";
import { checkEventAccess } from "@/lib/event-access";
import { storeParticipantImage } from "@/lib/participant-image";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

// POST /api/participant-image/upload  FormData { file, eventId }
// Sube un archivo elegido manualmente por el creador del evento: se optimiza
// (resize + WebP) y se aloja en Vercel Blob en vez de guardarse como base64.
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const ip = getClientIp(req);
    const rl = await rateLimit(`img-upload:${session.user.id}:${ip}`, 15);
    if (!rl.allowed) return tooManyRequests(rl, "Demasiadas imágenes. Espera un momento.");

    try {
        const form = await req.formData();
        const file = form.get("file");
        const eventId = String(form.get("eventId") ?? "");

        if (!eventId) return NextResponse.json({ error: "Falta el evento" }, { status: 400 });
        if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
        if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "El archivo no es una imagen válida" }, { status: 415 });
        if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "La imagen es demasiado grande (máx. 6MB)" }, { status: 413 });

        const hasAccess = await checkEventAccess(eventId, session.user.id, "canManageNominees");
        if (!hasAccess) return NextResponse.json({ error: "Sin permisos sobre este evento" }, { status: 403 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const { url } = await storeParticipantImage(eventId, buffer);

        return NextResponse.json({ url });
    } catch (error) {
        console.error("[participant-image/upload]", error);
        return NextResponse.json({ error: "Error al guardar la imagen" }, { status: 500 });
    }
}
