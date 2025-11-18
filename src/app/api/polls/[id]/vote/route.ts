// app/api/polls/[id]/vote/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Asegúrate de crear lib/prisma.ts para instanciar el cliente
import { cookies } from 'next/headers';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Esperamos a que se resuelvan los params
        const { id: pollId } = await params; 
        
        const body = await req.json();
        const { optionIds } = body;

        if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
            return NextResponse.json({ error: 'Debe seleccionar al menos una opción' }, { status: 400 });
        }

        // 1. Fetch Poll y reglas
        const poll = await prisma.poll.findUnique({ where: { id: pollId } });
        if (!poll) return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 });

        // 2. Validar Fechas
        const now = new Date();
        if (now < poll.startAt || now > poll.endAt) {
            return NextResponse.json({ error: 'La votación está cerrada' }, { status: 403 });
        }

        // 3. Validar Límites (VotingType)
        if (poll.votingType === 'SINGLE' && optionIds.length > 1) {
            return NextResponse.json({ error: 'Solo se permite una opción' }, { status: 400 });
        }
        if (poll.votingType === 'LIMITED_MULTIPLE' && poll.maxChoices && optionIds.length > poll.maxChoices) {
            return NextResponse.json({ error: `Máximo ${poll.maxChoices} opciones permitidas` }, { status: 400 });
        }

        // 4. Guardar Voto (Transacción para consistencia)
        // Opcional: Cookie anti-spam simple
        const cookieStore = await cookies();
        const hasVotedCookie = cookieStore.get(`voted_${pollId}`);
        if (hasVotedCookie) {
            // Para MVP permitimos re-votar o bloqueamos según prefieras.
            // return NextResponse.json({ error: 'Ya has votado' }, { status: 403 });
        }

        await prisma.$transaction(async (tx) => {
        const vote = await tx.vote.create({
            data: { pollId },
        });

        await tx.voteOption.createMany({
            data: optionIds.map((optId: string) => ({
            voteId: vote.id,
            optionId: optId,
            })),
        });
        });

        // Setear cookie httpOnly para feedback visual (no seguridad estricta)
        // En Next.js App Router, setear cookies en response es diferente, 
        // aquí retornamos JSON y el cliente maneja localStorage o usamos middleware.

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}