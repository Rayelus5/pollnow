import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit-redis";
import { refreshEventLikes } from "@/lib/event-counters";

type Props = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Props) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Rate limit: 15 likes/min per user
    const rl = await rateLimit(`like:${session.user.id}`, 15);
    if (!rl.allowed) return tooManyRequests(rl);

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

    // Recalcula los likes autoritativos desde BD y refresca el contador en Redis
    const count = await refreshEventLikes(eventId);
    return NextResponse.json({ liked: !existing, count });
}
