'use server';

import { prisma } from "@/lib/prisma";

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
