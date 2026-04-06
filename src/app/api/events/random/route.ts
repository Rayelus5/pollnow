import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: Request) {
    // Rate limit: 30 requests/min per IP
    const ip = getClientIp(req);
    const { allowed, retryAfter } = rateLimit(`random:${ip}`, 30);
    if (!allowed) {
        return NextResponse.json(
            { error: "Demasiadas peticiones." },
            { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
    }

    const count = await prisma.event.count({
        where: { isPublic: true, status: "APPROVED" },
    });

    if (count === 0) {
        return NextResponse.json({ error: "No hay eventos disponibles" }, { status: 404 });
    }

    const skip = Math.floor(Math.random() * count);
    const event = await prisma.event.findFirst({
        where: { isPublic: true, status: "APPROVED" },
        skip,
        select: { slug: true },
    });

    if (!event) {
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ slug: event.slug });
}
