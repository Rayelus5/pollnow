import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit-redis';

type Props = {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Props) {
    const ip = getClientIp(request);
    const rl = await rateLimit(`polls:get:${ip}`, 60);
    if (!rl.allowed) return tooManyRequests(rl, 'Demasiadas peticiones.');

    try {
        const { id } = await params;

        // 1. Identificar usuario
        const cookieStore = await cookies();
        const voterId = cookieStore.get('voter_id')?.value;

        const poll = await prisma.poll.findUnique({
            where: { id },
            include: {
                options: {
                    orderBy: { order: 'asc' },
                    include: { participant: true }
                },
            },
        });

        if (!poll) {
            return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
        }

        // 2. Comprobar si ha votado
        let hasVoted = false;
        if (voterId) {
            const vote = await prisma.vote.findUnique({
                where: {
                    pollId_voterHash: {
                        pollId: id,
                        voterHash: voterId
                    }
                }
            });
            hasVoted = !!vote;
        }

        // 3. Formatear respuesta incluyendo 'hasVoted'
        const formattedPoll = {
            ...poll,
            hasVoted,
            options: poll.options.map(opt => ({
                id: opt.id,
                name: opt.participant.name,
                imageUrl: opt.participant.imageUrl,
                subtitle: opt.subtitle,
                participantId: opt.participantId
            }))
        };

        return NextResponse.json(formattedPoll);

    } catch (error) {
        console.error("ERROR EN API:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}