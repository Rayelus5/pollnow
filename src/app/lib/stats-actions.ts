'use server';

import { prisma } from "@/lib/prisma";

// ─── Estadísticas por modo (v3.0) ───────────────────────────────────────────────
// Devuelve un payload distinto según el modo del evento. GALA sigue usando
// getEventStats (abajo). El resto agregan sus propios votos/respuestas/reacciones.

export type ModeStats =
    | { mode: "TIERLIST"; totalVotes: number; participants: { id: string; name: string; imageUrl: string | null; placements: number; topTierId: string | null; topTier: { label: string; color: string } | null; tiers: { tierId: string; label: string; color: string; count: number }[] }[] }
    | { mode: "PREGUNTAS"; totalRespondents: number; questions: { id: string; text: string; type: string; totalAnswers: number; options: { id: string; text: string; count: number; pct: number }[] }[] }
    | { mode: "DIBUJO"; submissions: number; reactions: number; likes: number; dislikes: number; superlikes: number; top: { id: string; imageUrl: string; score: number; likeCount: number; dislikeCount: number; superlikeCount: number }[] };

export async function getModeStats(eventId: string, mode: "TIERLIST" | "PREGUNTAS" | "DIBUJO"): Promise<ModeStats | null> {
    if (mode === "TIERLIST") {
        const [totalVotes, tiers, participants, entries] = await Promise.all([
            prisma.tierlistVote.count({ where: { eventId } }),
            prisma.tierlistTier.findMany({ where: { eventId }, orderBy: { order: "asc" }, select: { id: true, label: true, color: true } }),
            prisma.participant.findMany({ where: { eventId }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, imageUrl: true } }),
            prisma.tierlistVoteEntry.findMany({ where: { vote: { eventId } }, select: { tierId: true, participantId: true } }),
        ]);
        const tierById = new Map(tiers.map((t) => [t.id, t]));
        // count[participantId][tierId]
        const count = new Map<string, Map<string, number>>();
        for (const e of entries) {
            if (!count.has(e.participantId)) count.set(e.participantId, new Map());
            const m = count.get(e.participantId)!;
            m.set(e.tierId, (m.get(e.tierId) ?? 0) + 1);
        }
        const result = participants.map((p) => {
            const m = count.get(p.id) ?? new Map<string, number>();
            const tierCounts = tiers.map((t) => ({ tierId: t.id, label: t.label, color: t.color, count: m.get(t.id) ?? 0 }));
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
        return { mode: "TIERLIST", totalVotes, participants: result };
    }

    if (mode === "PREGUNTAS") {
        const [questions, answers, respondents] = await Promise.all([
            prisma.question.findMany({ where: { eventId }, orderBy: { order: "asc" }, include: { options: { orderBy: { order: "asc" }, select: { id: true, text: true } } } }),
            prisma.questionAnswer.groupBy({ by: ["optionId"], where: { eventId }, _count: { optionId: true } }),
            prisma.questionAnswer.findMany({ where: { eventId }, select: { voterHash: true }, distinct: ["voterHash"] }),
        ]);
        const countByOption = new Map(answers.map((a) => [a.optionId, a._count.optionId]));
        const qStats = questions.map((q) => {
            const opts = q.options.map((o) => ({ id: o.id, text: o.text, count: countByOption.get(o.id) ?? 0 }));
            const totalAnswers = opts.reduce((acc, o) => acc + o.count, 0);
            return {
                id: q.id, text: q.text, type: q.type, totalAnswers,
                options: opts.map((o) => ({ ...o, pct: totalAnswers > 0 ? Math.round((o.count / totalAnswers) * 100) : 0 })),
            };
        });
        return { mode: "PREGUNTAS", totalRespondents: respondents.length, questions: qStats };
    }

    // DIBUJO
    const [submissions, agg, top] = await Promise.all([
        prisma.drawingSubmission.count({ where: { eventId } }),
        prisma.drawingReaction.groupBy({ by: ["type"], where: { eventId }, _count: { type: true } }),
        prisma.drawingSubmission.findMany({ where: { eventId }, orderBy: [{ score: "desc" }, { createdAt: "asc" }], take: 10, select: { id: true, imageUrl: true, score: true, likeCount: true, dislikeCount: true, superlikeCount: true } }),
    ]);
    const byType = new Map(agg.map((a) => [a.type, a._count.type]));
    const likes = byType.get("LIKE") ?? 0;
    const dislikes = byType.get("DISLIKE") ?? 0;
    const superlikes = byType.get("SUPERLIKE") ?? 0;
    return { mode: "DIBUJO", submissions, reactions: likes + dislikes + superlikes, likes, dislikes, superlikes, top };
}

export async function getEventStats(eventId: string) {
    // Ya no usamos auth() ni filtramos por userId aquí.
    // La autorización la controlas en la page (dashboard/event/[id]/page.tsx)

    // Query 1: estructura del evento + contadores (sin arrastrar votos/usuarios anidados).
    // Query 2: detalle de votantes por opción (solo lo que necesita el modal), con join plano.
    // Query 3: timeline de las últimas 50 votaciones.
    // Las tres se ejecutan en paralelo.
    const [event, voteOptionRows, recentVotes] = await Promise.all([
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
        prisma.vote.findMany({
            where: { poll: { eventId } },
            orderBy: { createdAt: "desc" },
            take: 50,
            select: { createdAt: true },
        }),
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

    // Timeline simple de las últimas 50 votaciones
    const votesByDateMap = new Map<string, number>();
    recentVotes.forEach((vote) => {
        const date = vote.createdAt.toISOString().split("T")[0];
        votesByDateMap.set(date, (votesByDateMap.get(date) || 0) + 1);
    });

    const activityTimeline = Array.from(votesByDateMap.entries())
        .map(([date, count]) => ({ date, count }))
        .reverse();

    const likeCount = event._count.likes;
    const upvotes = event.eventVotes.filter((v) => v.value === 1).length;
    const downvotes = event.eventVotes.filter((v) => v.value === -1).length;
    const voteScore = upvotes - downvotes;

    return {
        totalVotes,
        totalPolls,
        votesByPoll,
        activityTimeline,
        pollsDetail,
        isAnonymousConfig: event.isAnonymousVoting,
        likeCount,
        upvotes,
        downvotes,
        voteScore,
    };
}
