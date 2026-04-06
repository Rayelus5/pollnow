import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type Props = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Props) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const { value } = await req.json();
    const userId = session.user.id;

    if (value !== 1 && value !== -1) {
        return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    const existing = await prisma.eventVote.findUnique({
        where: { eventId_userId: { eventId, userId } },
    });

    if (existing && existing.value === value) {
        // Mismo voto → toggle off (eliminar)
        await prisma.eventVote.delete({ where: { id: existing.id } });
    } else {
        // Nuevo voto o cambio de voto → upsert
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
    const userVote = existing?.value === value ? null : value;

    return NextResponse.json({ userVote, score });
}
