import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit-redis";
import { NextRequest, NextResponse } from "next/server";

// GET /api/users/search?q=<query>&eventId=<eventId>
// Devuelve usuarios cuyo nombre o @username coincida con la query.
// Excluye: el usuario actual, usuarios ya colaboradores y usuarios con invitación pendiente.
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rl = await rateLimit(`${ip}:users-search`, 30);
    if (!rl.allowed) return tooManyRequests(rl, "Demasiadas solicitudes. Espera un momento.");

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const eventId = searchParams.get("eventId") ?? "";

    if (q.length < 2) return NextResponse.json({ users: [] });
    if (!eventId) return NextResponse.json({ error: "eventId requerido" }, { status: 400 });

    // IDs a excluir: propietario actual + colaboradores actuales + invitaciones pendientes
    const [collaborators, pendingInvitations, event] = await Promise.all([
        prisma.eventCollaborator.findMany({
            where: { eventId },
            select: { userId: true },
        }),
        prisma.collaboratorInvitation.findMany({
            where: { eventId, status: "PENDING" },
            select: { invitedUserId: true },
        }),
        prisma.event.findUnique({ where: { id: eventId }, select: { userId: true } }),
    ]);

    const excludeIds = new Set<string>([
        session.user.id,
        event?.userId ?? "",
        ...collaborators.map((c) => c.userId),
        ...pendingInvitations.map((i) => i.invitedUserId),
    ]);

    const users = await prisma.user.findMany({
        where: {
            AND: [
                { id: { notIn: Array.from(excludeIds) } },
                {
                    OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { username: { contains: q, mode: "insensitive" } },
                    ],
                },
            ],
        },
        select: { id: true, name: true, username: true, image: true },
        take: 6,
        orderBy: { name: "asc" },
    });

    return NextResponse.json({ users });
}
