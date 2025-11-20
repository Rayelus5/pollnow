'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getEventStats(eventId: string) {
    const session = await auth();
    if (!session?.user) return null;

    const event = await prisma.event.findUnique({
        where: { id: eventId, userId: session.user.id },
        include: {
            polls: {
                include: {
                    _count: { select: { votes: true } },
                    // Traemos las opciones y sus votos detallados (con usuario)
                    options: {
                        include: {
                            participant: true, // Para saber el nombre del nominado
                            votes: {
                                include: {
                                    vote: {
                                        include: { user: { select: { name: true, image: true, email: true } } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!event) return null;

    const totalPolls = event.polls.length;
    const totalVotes = event.polls.reduce((acc, poll) => acc + poll._count.votes, 0);

    // Datos para gráficos generales
    const votesByPoll = event.polls.map(p => ({
        name: p.title,
        votes: p._count.votes
    })).sort((a, b) => b.votes - a.votes);

    // Datos detallados para el Modal Premium
    const pollsDetail = event.polls.map(poll => ({
        id: poll.id,
        title: poll.title,
        totalVotes: poll._count.votes,
        options: poll.options.map(opt => ({
            id: opt.id,
            name: opt.participant.name, // Nombre del nominado
            imageUrl: opt.participant.imageUrl,
            votesCount: opt.votes.length,
            // Lista de votantes (solo info pública o email si es necesario)
            voters: opt.votes.map(v => ({
                name: v.vote.user?.name || "Anónimo",
                image: v.vote.user?.image || null,
                isAnonymous: !v.vote.userId
            }))
        })).sort((a, b) => b.votesCount - a.votesCount)
    }));

    // Calcular Timeline (igual que antes)
    const recentVotes = await prisma.vote.findMany({
        where: { poll: { eventId: eventId } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { createdAt: true }
    });

    const votesByDateMap = new Map<string, number>();
    recentVotes.forEach(vote => {
        const date = vote.createdAt.toISOString().split('T')[0];
        votesByDateMap.set(date, (votesByDateMap.get(date) || 0) + 1);
    });

    const activityTimeline = Array.from(votesByDateMap.entries())
        .map(([date, count]) => ({ date, count }))
        .reverse();

    return {
        totalVotes,
        totalPolls,
        votesByPoll,
        activityTimeline,
        pollsDetail, // <--- Nuevo campo con todo el detalle
        isAnonymousConfig: event.isAnonymousVoting // Para saber si debemos ocultar nombres en el front
    };
}