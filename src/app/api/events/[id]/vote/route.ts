import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit-redis";
import { refreshEventScore } from "@/lib/event-counters";

type Props = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Props) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Rate limit: 20 votes/min per user
    const rl = await rateLimit(`vote:${session.user.id}`, 20);
    if (!rl.allowed) return tooManyRequests(rl);

    const { id: eventId } = await params;
    const body = await req.json().catch(() => null);
    const { value } = body ?? {};
    const userId = session.user.id;

    if (value !== 1 && value !== -1) {
        return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    const existing = await prisma.eventVote.findUnique({
        where: { eventId_userId: { eventId, userId } },
    });

    const isToggleOff = existing?.value === value;

    if (isToggleOff) {
        await prisma.eventVote.delete({ where: { id: existing!.id } });
    } else {
        await prisma.eventVote.upsert({
            where: { eventId_userId: { eventId, userId } },
            create: { eventId, userId, value },
            update: { value },
        });
    }

    // Recalcula el score autoritativo desde BD y refresca el contador en Redis
    const score = await refreshEventScore(eventId);

    return NextResponse.json({
        userVote: isToggleOff ? null : (value as 1 | -1),
        score,
    });
}
