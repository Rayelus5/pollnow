import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type Props = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Props) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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
