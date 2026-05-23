import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { put } from "@vercel/blob";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit-redis";
import { checkEventAccess } from "@/lib/event-access";
import { isAllowedImageHost } from "@/lib/image-search";

export const runtime = "nodejs";

const EXT_BY_TYPE: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};

// POST /api/participant-image/rehost  { url, eventId }
// Descarga una imagen de una fuente permitida y la re-aloja en Vercel Blob.
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const ip = getClientIp(req);
    const rl = await rateLimit(`img-rehost:${session.user.id}:${ip}`, 15);
    if (!rl.allowed) return tooManyRequests(rl, "Demasiadas imágenes. Espera un momento.");

    try {
        const body = await req.json();
        const url = String(body.url ?? "");
        const eventId = String(body.eventId ?? "");

        if (!eventId) return NextResponse.json({ error: "Falta el evento" }, { status: 400 });
        if (!isAllowedImageHost(url)) return NextResponse.json({ error: "Origen de imagen no permitido" }, { status: 400 });

        const hasAccess = await checkEventAccess(eventId, session.user.id, "canManageNominees");
        if (!hasAccess) return NextResponse.json({ error: "Sin permisos sobre este evento" }, { status: 403 });

        const imgRes = await fetch(url);
        if (!imgRes.ok) return NextResponse.json({ error: "No se pudo descargar la imagen" }, { status: 502 });

        const contentType = (imgRes.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
        const ext = EXT_BY_TYPE[contentType];
        if (!ext) return NextResponse.json({ error: "El recurso no es una imagen válida" }, { status: 415 });

        const buffer = Buffer.from(await imgRes.arrayBuffer());
        if (buffer.byteLength > 5 * 1024 * 1024) return NextResponse.json({ error: "La imagen es demasiado grande" }, { status: 413 });

        const key = `events/${eventId}/participants/${crypto.randomUUID()}.${ext}`;
        const blob = await put(key, new Blob([buffer as BlobPart], { type: contentType }), {
            access: "public",
            contentType,
            addRandomSuffix: false,
        });

        return NextResponse.json({ url: blob.url });
    } catch (error) {
        console.error("[participant-image/rehost]", error);
        return NextResponse.json({ error: "Error al guardar la imagen" }, { status: 500 });
    }
}
