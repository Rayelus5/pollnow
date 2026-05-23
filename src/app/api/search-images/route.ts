import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit-redis";
import { searchImages } from "@/lib/image-search";

export const dynamic = "force-dynamic";

// GET /api/search-images?q=...  → hasta 20 imágenes (Pexels + Wikimedia)
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const ip = getClientIp(req);
    const rl = await rateLimit(`img-search:${session.user.id}:${ip}`, 20);
    if (!rl.allowed) return tooManyRequests(rl, "Demasiadas búsquedas. Espera un momento.");

    const q = new URL(req.url).searchParams.get("q") ?? "";
    if (!q.trim()) return NextResponse.json({ images: [] });

    const images = await searchImages(q);
    return NextResponse.json({ images });
}
