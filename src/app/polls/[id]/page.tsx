import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VotingForm from "@/components/VotingForm";
import { cookies } from 'next/headers';

type Props = {
    params: Promise<{ id: string }>
}

export default async function PollPage({ params }: Props) {
    const { id } = await params;
    const cookieStore = await cookies();
    const voterId = cookieStore.get('foty_voter_id')?.value;

    // 1. Buscar encuesta actual
    const poll = await prisma.poll.findUnique({
        where: { id },
        include: {
            options: {
                orderBy: { order: 'asc' },
                include: { participant: true }
            }
        },
    });

    if (!poll) notFound();

    // 2. Buscar si YA VOTÓ y QUÉ votó
    let hasVoted = false;
    let initialSelectedOptions: string[] = [];

    if (voterId) {
        const vote = await prisma.vote.findUnique({
            where: {
                pollId_voterHash: {
                    pollId: id,
                    voterHash: voterId
                }
            },
            include: { voteOptions: true }
        });

        if (vote) {
            hasVoted = true;
            initialSelectedOptions = vote.voteOptions.map(vo => vo.optionId);
        }
    }

    // --- CAMBIO CLAVE AQUÍ ---
    // 3. Buscar Siguiente basada en el ORDEN
    const nextPoll = await prisma.poll.findFirst({
        where: {
            isPublished: true,
            // Buscamos una que tenga un número de orden MAYOR que la actual
            order: { gt: poll.order }
        },
        // Ordenamos ascendente para coger la inmediatamente siguiente
        orderBy: { order: 'asc' },
        select: { id: true }
    });

    const formattedPoll = {
        ...poll,
        options: poll.options.map(opt => ({
            id: opt.id,
            name: opt.participant.name,
            imageUrl: opt.participant.imageUrl,
            subtitle: opt.subtitle,
        }))
    };

    return (
        <main className="min-h-screen bg-black text-white selection:bg-blue-500/30">
            <VotingForm
                poll={formattedPoll}
                nextPollId={nextPoll?.id || null}
                initialHasVoted={hasVoted}
                initialSelected={initialSelectedOptions}
            />
        </main>
    );
}