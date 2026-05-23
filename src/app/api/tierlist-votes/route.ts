import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit-redis";

// POST /api/tierlist-votes
// Body: { eventId, entries: [{ tierId, participantId }] }
export async function POST(req: Request) {
    const ip = getClientIp(req);
    const rl = await rateLimit(`tierlist:vote:${ip}`, 15);
    if (!rl.allowed) return tooManyRequests(rl, "Demasiadas peticiones.");

    try {
        const body = await req.json();
        const eventId = String(body.eventId ?? "");
        const entriesRaw = Array.isArray(body.entries) ? body.entries : [];

        if (!eventId) return NextResponse.json({ error: "Falta el evento" }, { status: 400 });

        const cookieStore = await cookies();
        const voterId = cookieStore.get("voter_id")?.value;
        if (!voterId) return NextResponse.json({ error: "No se pudo identificar la sesión" }, { status: 400 });

        const session = await auth();
        const userId = session?.user?.id ?? null;

        // Dedup: un voto por (eventId, voterHash)
        const existing = await prisma.tierlistVote.findUnique({
            where: { eventId_voterHash: { eventId, voterHash: voterId } },
        });
        if (existing) return NextResponse.json({ error: "Ya has votado en esta tierlist" }, { status: 403 });

        // Validar que tiers y participantes pertenecen al evento
        const [tiers, participants] = await Promise.all([
            prisma.tierlistTier.findMany({ where: { eventId }, select: { id: true } }),
            prisma.participant.findMany({ where: { eventId }, select: { id: true } }),
        ]);
        const tierIds = new Set(tiers.map((t) => t.id));
        const partIds = new Set(participants.map((p) => p.id));

        // Normalizar entries: cada participante en un único tier válido
        const seen = new Set<string>();
        const entries: { tierId: string; participantId: string }[] = [];
        for (const e of entriesRaw) {
            const tierId = String(e?.tierId ?? "");
            const participantId = String(e?.participantId ?? "");
            if (!tierIds.has(tierId) || !partIds.has(participantId)) continue;
            if (seen.has(participantId)) continue;
            seen.add(participantId);
            entries.push({ tierId, participantId });
        }

        if (entries.length === 0) {
            return NextResponse.json({ error: "Coloca al menos un nominado en un tier" }, { status: 400 });
        }

        await prisma.tierlistVote.create({
            data: {
                eventId,
                voterHash: voterId,
                userId,
                entries: { create: entries },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const code = (error as { code?: string })?.code;
        if (code === "P2002") return NextResponse.json({ error: "Ya has votado en esta tierlist" }, { status: 403 });
        console.error("[tierlist-votes]", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
