import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

type Props = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Props) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Rate limit: 15 likes/min per user
    const { allowed, retryAfter } = rateLimit(`like:${session.user.id}`, 15);
    if (!allowed) {
        return NextResponse.json(
            { error: "Demasiadas peticiones. Inténtalo en unos segundos." },
            { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
    }

    const { id: eventId } = await params;
    const userId = session.user.id;

    const existing = await prisma.eventLike.findUnique({
        where: { eventId_userId: { eventId, userId } },
    });

    if (existing) {
        await prisma.eventLike.delete({ where: { id: existing.id } });
    } else {
        await prisma.eventLike.create({ data: { eventId, userId } });
    }

    const count = await prisma.eventLike.count({ where: { eventId } });
    return NextResponse.json({ liked: !existing, count });
}
