import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";

type Props = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Props) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Rate limit: 20 votes/min per user
    const { allowed, retryAfter } = rateLimit(`vote:${session.user.id}`, 20);
    if (!allowed) {
        return NextResponse.json(
            { error: "Demasiadas peticiones. Inténtalo en unos segundos." },
            { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
    }

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

    const votes = await prisma.eventVote.findMany({
        where: { eventId },
        select: { value: true },
    });
    const score = votes.reduce((acc, v) => acc + v.value, 0);

    return NextResponse.json({
        userVote: isToggleOff ? null : (value as 1 | -1),
        score,
    });
}
