import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await auth();
    // @ts-ignore
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (q.length < 2) {
        return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { username: { contains: q, mode: "insensitive" } },
            ],
        },
        select: { id: true, name: true, email: true, username: true, subscriptionStatus: true },
        take: 8,
        orderBy: { name: "asc" },
    });

    return NextResponse.json({ users });
}
