'use server';

import { prisma } from "@/lib/prisma";

export async function getEventStats(eventId: string) {
    // Ya no usamos auth() ni filtramos por userId aquí.
    // La autorización la controlas en la page (dashboard/event/[id]/page.tsx)

    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            polls: {
                include: {
                    _count: { select: { votes: true } },
                    options: {
                        include: {
                            participant: true,
                            votes: {
                                include: {
                                    vote: {
                                        include: {
                                            user: {
                                                select: { name: true, image: true, email: true }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            _count: { select: { likes: true } },
            eventVotes: { select: { value: true } },
        }
    });

    if (!event) return null;

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
                votesCount: opt.votes.length,
                voters: opt.votes.map((v) => ({
                    name: v.vote.user?.name || "Anónimo",
                    image: v.vote.user?.image || null,
                    isAnonymous: !v.vote.userId,
                })),
            }))
            .sort((a, b) => b.votesCount - a.votesCount),
    }));

    // Timeline simple de las últimas 50 votaciones
    const recentVotes = await prisma.vote.findMany({
        where: { poll: { eventId } },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { createdAt: true },
    });

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