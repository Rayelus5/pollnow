import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit-redis";

// POST /api/preguntas-votes
// Body: { eventId, answers: [{ questionId, optionIds: string[] }] }
export async function POST(req: Request) {
    const ip = getClientIp(req);
    const rl = await rateLimit(`preguntas:vote:${ip}`, 15);
    if (!rl.allowed) return tooManyRequests(rl, "Demasiadas peticiones.");

    try {
        const body = await req.json();
        const eventId = String(body.eventId ?? "");
        const answersRaw = Array.isArray(body.answers) ? body.answers : [];
        if (!eventId) return NextResponse.json({ error: "Falta el evento" }, { status: 400 });

        const cookieStore = await cookies();
        const voterId = cookieStore.get("voter_id")?.value;
        if (!voterId) return NextResponse.json({ error: "No se pudo identificar la sesión" }, { status: 400 });

        const session = await auth();
        const userId = session?.user?.id ?? null;

        // Dedup: si ya respondió en este evento, rechazar
        const already = await prisma.questionAnswer.findFirst({ where: { eventId, voterHash: voterId }, select: { id: true } });
        if (already) return NextResponse.json({ error: "Ya has respondido este formulario" }, { status: 403 });

        // Cargar preguntas + opciones del evento
        const questions = await prisma.question.findMany({
            where: { eventId },
            include: { options: { select: { id: true } } },
        });
        const qById = new Map(questions.map((q) => [q.id, q]));

        // Indexar respuestas recibidas
        const received = new Map<string, string[]>();
        for (const a of answersRaw) {
            const qid = String(a?.questionId ?? "");
            const opts = Array.isArray(a?.optionIds) ? a.optionIds.map(String) : [];
            if (qid) received.set(qid, opts);
        }

        const rows: { eventId: string; questionId: string; optionId: string; voterHash: string; userId: string | null }[] = [];

        for (const q of questions) {
            const validOpts = new Set(q.options.map((o) => o.id));
            const chosen = (received.get(q.id) ?? []).filter((o) => validOpts.has(o));

            if (chosen.length === 0) {
                if (q.isRequired) {
                    return NextResponse.json({ error: `Falta responder una pregunta obligatoria.` }, { status: 400 });
                }
                continue;
            }
            if (q.type === "RADIO" && chosen.length > 1) {
                return NextResponse.json({ error: "Solo puedes elegir una opción en una pregunta de respuesta única." }, { status: 400 });
            }
            for (const optionId of chosen) {
                rows.push({ eventId, questionId: q.id, optionId, voterHash: voterId, userId });
            }
        }

        if (rows.length === 0) {
            return NextResponse.json({ error: "No hay respuestas que registrar." }, { status: 400 });
        }
        // Verificar que no se enviaron respuestas a preguntas inexistentes (silenciosamente ignoradas)
        void qById;

        await prisma.questionAnswer.createMany({ data: rows, skipDuplicates: true });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const code = (error as { code?: string })?.code;
        if (code === "P2002") return NextResponse.json({ error: "Ya has respondido este formulario" }, { status: 403 });
        console.error("[preguntas-votes]", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
