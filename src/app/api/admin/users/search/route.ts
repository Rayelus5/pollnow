import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (
        !session?.user ||
        (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")
    ) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const q = req.nextUrl.searchParams.get("q")?.trim() || "";
    if (q.length < 2) return NextResponse.json([]);

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { email: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
            ],
        },
        select: { id: true, name: true, email: true, image: true },
        take: 8,
        orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
}
