import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
