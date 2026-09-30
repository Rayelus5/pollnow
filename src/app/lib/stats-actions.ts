'use server';

import { prisma } from "@/lib/prisma";

// ─── Estadísticas por modo (v3.0) ───────────────────────────────────────────────
// Devuelve un payload distinto según el modo del evento. GALA sigue usando
// getEventStats (abajo). El resto agregan sus propios votos/respuestas/reacciones.

/** Identidad de un votante. `isAnonymous` = no estaba logueado (sin userId). */
export type Voter = { name: string; image: string | null; isAnonymous: boolean };

/** Punto del timeline de "Rendimiento de votaciones": bucket de tiempo (ISO) + nº de votos. */
export type VotesOverTimePoint = { bucket: string; count: number };

export type ModeStats =
    | { mode: "TIERLIST"; totalVotes: number; votesOverTime: VotesOverTimePoint[]; participants: { id: string; name: string; imageUrl: string | null; placements: number; topTierId: string | null; topTier: { label: string; color: string } | null; tiers: { tierId: string; label: string; color: string; count: number; voters?: Voter[] }[] }[] }
    | { mode: "PREGUNTAS"; totalRespondents: number; votesOverTime: VotesOverTimePoint[]; questions: { id: string; text: string; type: string; totalAnswers: number; options: { id: string; text: string; count: number; pct: number; voters?: Voter[] }[] }[] }
    | { mode: "DIBUJO"; submissions: number; reactions: number; likes: number; dislikes: number; superlikes: number; votesOverTime: VotesOverTimePoint[]; top: { id: string; imageUrl: string; score: number; likeCount: number; dislikeCount: number; superlikeCount: number; author?: Voter | null; reactors?: { type: string; voter: Voter }[] }[] };

// ─── Timeline de votos ("Rendimiento de votaciones") ─────────────────────────────
// Bucketing adaptativo: se calcula el rango real (min/max createdAt) de los votos
// del evento y se reparte en ~24 buckets de ancho variable (nunca menos de 60s),
// para que sirva igual de bien a un evento de 2h que a uno de varias semanas.
// Prisma no soporta date_trunc/date_bin en `groupBy`, así que se usa $queryRaw
// (con `eventId`/intervalo como parámetros normales, sin riesgo de inyección).

type TimelineSource = "vote" | "tierlistVote" | "questionAnswer" | "drawingReaction";

const TIMELINE_BUCKETS = 24;
const MIN_BUCKET_SECONDS = 60;
const TIMELINE_ORIGIN = "2001-01-01 00:00:00";

async function getTimelineRange(source: TimelineSource, eventId: string): Promise<{ min: Date; max: Date } | null> {
    const rows =
        source === "vote"
            ? await prisma.$queryRaw<{ min: Date | null; max: Date | null }[]>`
                SELECT MIN(v."createdAt") as min, MAX(v."createdAt") as max
                FROM "Vote" v JOIN "Poll" p ON v."pollId" = p.id WHERE p."eventId" = ${eventId}`
            : source === "tierlistVote"
            ? await prisma.$queryRaw<{ min: Date | null; max: Date | null }[]>`
                SELECT MIN("createdAt") as min, MAX("createdAt") as max FROM "TierlistVote" WHERE "eventId" = ${eventId}`
            : source === "questionAnswer"
            ? await prisma.$queryRaw<{ min: Date | null; max: Date | null }[]>`
                SELECT MIN("createdAt") as min, MAX("createdAt") as max FROM "QuestionAnswer" WHERE "eventId" = ${eventId}`
            : await prisma.$queryRaw<{ min: Date | null; max: Date | null }[]>`
                SELECT MIN("createdAt") as min, MAX("createdAt") as max FROM "DrawingReaction" WHERE "eventId" = ${eventId}`;

    const row = rows[0];
    if (!row?.min || !row?.max) return null;
    return { min: row.min, max: row.max };
}

async function getTimelineBuckets(
    source: TimelineSource,
    eventId: string,
    intervalText: string
): Promise<{ bucket: Date; count: number }[]> {
    if (source === "vote") {
        return prisma.$queryRaw<{ bucket: Date; count: number }[]>`
            SELECT date_bin(${intervalText}::interval, v."createdAt", TIMESTAMP ${TIMELINE_ORIGIN}) AS bucket, COUNT(*)::int AS count
            FROM "Vote" v JOIN "Poll" p ON v."pollId" = p.id
            WHERE p."eventId" = ${eventId}
            GROUP BY bucket ORDER BY bucket`;
    }
    if (source === "tierlistVote") {
        return prisma.$queryRaw<{ bucket: Date; count: number }[]>`
            SELECT date_bin(${intervalText}::interval, "createdAt", TIMESTAMP ${TIMELINE_ORIGIN}) AS bucket, COUNT(*)::int AS count
            FROM "TierlistVote" WHERE "eventId" = ${eventId}
            GROUP BY bucket ORDER BY bucket`;
    }
    if (source === "questionAnswer") {
        // Interesa el envío del formulario (1 por voterHash), no cada fila de respuesta.
        return prisma.$queryRaw<{ bucket: Date; count: number }[]>`
            SELECT bucket, COUNT(*)::int AS count FROM (
                SELECT DISTINCT ON ("voterHash") "voterHash",
                       date_bin(${intervalText}::interval, "createdAt", TIMESTAMP ${TIMELINE_ORIGIN}) AS bucket
                FROM "QuestionAnswer" WHERE "eventId" = ${eventId}
                ORDER BY "voterHash", "createdAt" ASC
            ) sub GROUP BY bucket ORDER BY bucket`;
    }
    return prisma.$queryRaw<{ bucket: Date; count: number }[]>`
        SELECT date_bin(${intervalText}::interval, "createdAt", TIMESTAMP ${TIMELINE_ORIGIN}) AS bucket, COUNT(*)::int AS count
        FROM "DrawingReaction" WHERE "eventId" = ${eventId}
        GROUP BY bucket ORDER BY bucket`;
}

async function computeVotesOverTime(source: TimelineSource, eventId: string): Promise<VotesOverTimePoint[]> {
    const range = await getTimelineRange(source, eventId);
    if (!range) return [];

    const spanSeconds = Math.max(1, (range.max.getTime() - range.min.getTime()) / 1000);
    const bucketSeconds = Math.max(MIN_BUCKET_SECONDS, Math.ceil(spanSeconds / TIMELINE_BUCKETS));

    const rows = await getTimelineBuckets(source, eventId, `${bucketSeconds} seconds`);
    return rows.map((r) => ({ bucket: r.bucket.toISOString(), count: Number(r.count) }));
}

/**
 * Estadísticas por modo. Si `includeVoters` es true (plan suficiente + voto NO anónimo),
 * se adjunta la identidad de los votantes registrados (los no logueados aparecen como "Anónimo").
 */
/**
 * Resuelve un conjunto de userIds a identidades. Los modelos de voto solo guardan
 * `userId` (sin relación `user`), así que cargamos los usuarios en una sola query.
 */
async function buildVoterResolver(userIds: (string | null | undefined)[]) {
    const ids = [...new Set(userIds.filter((x): x is string => !!x))];
    const users = ids.length
        ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, image: true } })
        : [];
    const map = new Map(users.map((u) => [u.id, u]));
    return (userId: string | null | undefined): Voter => {
        if (!userId) return { name: "Anónimo", image: null, isAnonymous: true };
        const u = map.get(userId);
        return { name: u?.name || "Anónimo", image: u?.image || null, isAnonymous: false };
    };
}

export async function getModeStats(
    eventId: string,
    mode: "TIERLIST" | "PREGUNTAS" | "DIBUJO",
    opts?: { includeVoters?: boolean }
): Promise<ModeStats | null> {
    const includeVoters = opts?.includeVoters === true;

    if (mode === "TIERLIST") {
        const [totalVotes, tiers, participants, entries] = await Promise.all([
            prisma.tierlistVote.count({ where: { eventId } }),
            prisma.tierlistTier.findMany({ where: { eventId }, orderBy: { order: "asc" }, select: { id: true, label: true, color: true } }),
            prisma.participant.findMany({ where: { eventId }, orderBy: [{ order: "asc" }, { createdAt: "asc" }, { id: "asc" }], select: { id: true, name: true, imageUrl: true } }),
            prisma.tierlistVoteEntry.findMany({
                where: { vote: { eventId } },
                select: { tierId: true, participantId: true, vote: { select: { userId: true } } },
            }),
        ]);
        const tierById = new Map(tiers.map((t) => [t.id, t]));
        const resolveVoter = includeVoters ? await buildVoterResolver(entries.map((e) => e.vote.userId)) : null;
        // count[participantId][tierId]
        const count = new Map<string, Map<string, number>>();
        // voters[`${participantId}|${tierId}`]
        const votersByPT = new Map<string, Voter[]>();
        for (const e of entries) {
            if (!count.has(e.participantId)) count.set(e.participantId, new Map());
            const m = count.get(e.participantId)!;
            m.set(e.tierId, (m.get(e.tierId) ?? 0) + 1);
            if (resolveVoter) {
                const key = `${e.participantId}|${e.tierId}`;
                const list = votersByPT.get(key) ?? [];
                list.push(resolveVoter(e.vote.userId));
                votersByPT.set(key, list);
            }
        }
        const result = participants.map((p) => {
            const m = count.get(p.id) ?? new Map<string, number>();
            const tierCounts = tiers.map((t) => ({
                tierId: t.id, label: t.label, color: t.color, count: m.get(t.id) ?? 0,
                ...(includeVoters ? { voters: votersByPT.get(`${p.id}|${t.id}`) ?? [] } : {}),
            }));
            let placements = 0;
            let topTierId: string | null = null;
            let topCount = -1;
            for (const tc of tierCounts) {
                placements += tc.count;
                if (tc.count > topCount) { topCount = tc.count; topTierId = tc.tierId; }
            }
            const top = topTierId && topCount > 0 ? tierById.get(topTierId) ?? null : null;
            return {
                id: p.id, name: p.name, imageUrl: p.imageUrl, placements,
                topTierId: top ? topTierId : null,
                topTier: top ? { label: top.label, color: top.color } : null,
                tiers: tierCounts,
            };
        }).sort((a, b) => b.placements - a.placements);
        const votesOverTime = await computeVotesOverTime("tierlistVote", eventId);
        return { mode: "TIERLIST", totalVotes, votesOverTime, participants: result };
    }

    if (mode === "PREGUNTAS") {
        const [questions, answers, respondents] = await Promise.all([
            prisma.question.findMany({ where: { eventId }, orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" }, select: { id: true, text: true } } } }),
            prisma.questionAnswer.groupBy({ by: ["optionId"], where: { eventId }, _count: { optionId: true } }),
            prisma.questionAnswer.findMany({ where: { eventId }, select: { voterHash: true }, distinct: ["voterHash"] }),
        ]);
        const countByOption = new Map(answers.map((a) => [a.optionId, a._count.optionId]));
        const votersByOption = new Map<string, Voter[]>();
        if (includeVoters) {
            const answerRows = await prisma.questionAnswer.findMany({ where: { eventId }, select: { optionId: true, userId: true } });
            const resolveVoter = await buildVoterResolver(answerRows.map((a) => a.userId));
            for (const a of answerRows) {
                const list = votersByOption.get(a.optionId) ?? [];
                list.push(resolveVoter(a.userId));
                votersByOption.set(a.optionId, list);
            }
        }
        const qStats = questions.map((q) => {
            const opts = q.options.map((o) => ({ id: o.id, text: o.text, count: countByOption.get(o.id) ?? 0 }));
            const totalAnswers = opts.reduce((acc, o) => acc + o.count, 0);
            return {
                id: q.id, text: q.text, type: q.type, totalAnswers,
                options: opts.map((o) => ({
                    ...o,
                    pct: totalAnswers > 0 ? Math.round((o.count / totalAnswers) * 100) : 0,
                    ...(includeVoters ? { voters: votersByOption.get(o.id) ?? [] } : {}),
                })),
            };
        });
        const votesOverTime = await computeVotesOverTime("questionAnswer", eventId);
        return { mode: "PREGUNTAS", totalRespondents: respondents.length, votesOverTime, questions: qStats };
    }

    // DIBUJO
    const [submissions, agg, topRows] = await Promise.all([
        prisma.drawingSubmission.count({ where: { eventId } }),
        prisma.drawingReaction.groupBy({ by: ["type"], where: { eventId }, _count: { type: true } }),
        prisma.drawingSubmission.findMany({
            where: { eventId },
            orderBy: [{ score: "desc" }, { createdAt: "asc" }],
            take: 10,
            select: { id: true, imageUrl: true, score: true, likeCount: true, dislikeCount: true, superlikeCount: true, userId: true },
        }),
    ]);
    const byType = new Map(agg.map((a) => [a.type, a._count.type]));
    const likes = byType.get("LIKE") ?? 0;
    const dislikes = byType.get("DISLIKE") ?? 0;
    const superlikes = byType.get("SUPERLIKE") ?? 0;
    const votesOverTime = await computeVotesOverTime("drawingReaction", eventId);

    // Reacciones (con identidad) para los dibujos del top
    const reactorsBySubmission = new Map<string, { type: string; voter: Voter }[]>();
    if (includeVoters && topRows.length > 0) {
        const reacts = await prisma.drawingReaction.findMany({
            where: { submissionId: { in: topRows.map((t) => t.id) } },
            select: { submissionId: true, type: true, userId: true },
        });
        const resolveVoter = await buildVoterResolver([
            ...reacts.map((r) => r.userId),
            ...topRows.map((t) => t.userId),
        ]);
        for (const r of reacts) {
            const list = reactorsBySubmission.get(r.submissionId) ?? [];
            list.push({ type: r.type, voter: resolveVoter(r.userId) });
            reactorsBySubmission.set(r.submissionId, list);
        }
        const top = topRows.map((t) => ({
            id: t.id, imageUrl: t.imageUrl, score: t.score, likeCount: t.likeCount, dislikeCount: t.dislikeCount, superlikeCount: t.superlikeCount,
            author: resolveVoter(t.userId),
            reactors: reactorsBySubmission.get(t.id) ?? [],
        }));
        return { mode: "DIBUJO", submissions, reactions: likes + dislikes + superlikes, likes, dislikes, superlikes, votesOverTime, top };
    }

    const top = topRows.map((t) => ({
        id: t.id, imageUrl: t.imageUrl, score: t.score, likeCount: t.likeCount, dislikeCount: t.dislikeCount, superlikeCount: t.superlikeCount,
    }));

    return { mode: "DIBUJO", submissions, reactions: likes + dislikes + superlikes, likes, dislikes, superlikes, votesOverTime, top };
}

export async function getEventStats(eventId: string) {
    // Ya no usamos auth() ni filtramos por userId aquí.
    // La autorización la controlas en la page (dashboard/event/[id]/page.tsx)

    // Query 1: estructura del evento + contadores (sin arrastrar votos/usuarios anidados).
    // Query 2: detalle de votantes por opción (solo lo que necesita el modal), con join plano.
    // Query 3: timeline de "rendimiento de votaciones" (bucketing adaptativo, ver computeVotesOverTime).
    // Las tres se ejecutan en paralelo.
    const [event, voteOptionRows, votesOverTime] = await Promise.all([
        prisma.event.findUnique({
            where: { id: eventId },
            select: {
                isAnonymousVoting: true,
                _count: { select: { likes: true } },
                eventVotes: { select: { value: true } },
                polls: {
                    select: {
                        id: true,
                        title: true,
                        _count: { select: { votes: true } },
                        options: {
                            select: {
                                id: true,
                                participant: { select: { name: true, imageUrl: true } },
                                _count: { select: { votes: true } },
                            },
                        },
                    },
                },
            },
        }),
        prisma.voteOption.findMany({
            where: { option: { poll: { eventId } } },
            select: {
                optionId: true,
                vote: {
                    select: {
                        userId: true,
                        user: { select: { name: true, image: true } },
                    },
                },
            },
        }),
        computeVotesOverTime("vote", eventId),
    ]);

    if (!event) return null;

    // Agrupar votantes por opción a partir del join plano
    const votersByOption = new Map<string, { name: string; image: string | null; isAnonymous: boolean }[]>();
    for (const row of voteOptionRows) {
        const list = votersByOption.get(row.optionId) ?? [];
        list.push({
            name: row.vote.user?.name || "Anónimo",
            image: row.vote.user?.image || null,
            isAnonymous: !row.vote.userId,
        });
        votersByOption.set(row.optionId, list);
    }

    const totalPolls = event.polls.length;
    const totalVotes = event.polls.reduce(
        (acc, poll) => acc + poll._count.votes,
        0
    );

    // Datos para gráfico general
    const votesByPoll = event.polls
        .map((p) => ({
            name: p.title,
            votes: p._count.votes,
        }))
        .sort((a, b) => b.votes - a.votes);

    // Detalle por categoría para el modal
    const pollsDetail = event.polls.map((poll) => ({
        id: poll.id,
        title: poll.title,
        totalVotes: poll._count.votes,
        options: poll.options
            .map((opt) => ({
                id: opt.id,
                name: opt.participant.name,
                imageUrl: opt.participant.imageUrl,
                votesCount: opt._count.votes,
                voters: votersByOption.get(opt.id) ?? [],
            }))
            .sort((a, b) => b.votesCount - a.votesCount),
    }));

    const likeCount = event._count.likes;
    const upvotes = event.eventVotes.filter((v) => v.value === 1).length;
    const downvotes = event.eventVotes.filter((v) => v.value === -1).length;
    const voteScore = upvotes - downvotes;

    return {
        totalVotes,
        totalPolls,
        votesByPoll,
        votesOverTime,
        pollsDetail,
        isAnonymousConfig: event.isAnonymousVoting,
        likeCount,
        upvotes,
        downvotes,
        voteScore,
    };
}
