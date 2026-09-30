import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit-redis";
import { replaceUserAvatar } from "@/lib/user-avatar";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

// POST /api/user-avatar/upload  FormData { file }
// Sube el avatar del propio usuario autenticado: se optimiza (resize + WebP)
// y se aloja en Vercel Blob en vez de guardarse como base64.
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const ip = getClientIp(req);
    const rl = await rateLimit(`avatar-upload:${session.user.id}:${ip}`, 10);
    if (!rl.allowed) return tooManyRequests(rl, "Demasiadas subidas. Espera un momento.");

    try {
        const form = await req.formData();
        const file = form.get("file");

        if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
        if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "El archivo no es una imagen válida" }, { status: 415 });
        if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "La imagen es demasiado grande (máx. 6MB)" }, { status: 413 });

        const current = await prisma.user.findUnique({ where: { id: session.user.id }, select: { image: true } });
        const buffer = Buffer.from(await file.arrayBuffer());
        const { url } = await replaceUserAvatar(session.user.id, current?.image, buffer);

        return NextResponse.json({ url });
    } catch (error) {
        console.error("[user-avatar/upload]", error);
        return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 });
    }
}
