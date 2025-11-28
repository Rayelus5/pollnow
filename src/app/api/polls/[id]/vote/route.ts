import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { auth } from "@/auth";

type Props = {
    params: Promise<{ id: string }>
}

export async function POST(req: Request, { params }: Props) {
    try {
        const { id: pollId } = await params;
        const body = await req.json();
        const optionIdsRaw = body.optionIds;

        const optionIds: string[] = Array.isArray(optionIdsRaw)
            ? optionIdsRaw.filter((id) => typeof id === "string")
            : [];

        if (optionIds.length === 0) {
            return NextResponse.json(
                { error: "Debes seleccionar al menos una opción" },
                { status: 400 }
            );
        }

        // 1. Identificación (cookie + sesión)
        const cookieStore = await cookies();
        const voterId = cookieStore.get('voter_id')?.value;

        const session = await auth();
        const userId = session?.user?.id;

        if (!voterId) {
            return NextResponse.json({ error: 'No se pudo identificar la sesión' }, { status: 400 });
        }

        // 2. Validar si YA votó
        const existingVote = await prisma.vote.findUnique({
            where: {
                pollId_voterHash: {
                    pollId,
                    voterHash: voterId
                }
            }
        });

        if (existingVote) {
            return NextResponse.json({ error: 'Ya has votado en esta categoría' }, { status: 403 });
        }

        // 3. Cargar poll + opciones
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            include: {
                options: true,
            },
        });

        if (!poll) {
            return NextResponse.json(
                { error: "Encuesta no encontrada" },
                { status: 404 }
            );
        }

        // 4. Asegurarnos de que todas las opciones pertenecen a esta poll
        const validOptionIdsSet = new Set(poll.options.map((o) => o.id));
        const filteredOptionIds = optionIds.filter((id) =>
            validOptionIdsSet.has(id)
        );

        if (filteredOptionIds.length === 0) {
            return NextResponse.json(
                { error: "Las opciones seleccionadas no son válidas" },
                { status: 400 }
            );
        }

        const selectedCount = filteredOptionIds.length;

        // 5. Reglas según tipo de votación
        if (poll.votingType === "SINGLE") {
            if (selectedCount !== 1) {
                return NextResponse.json(
                    { error: "Solo puedes seleccionar una opción en esta categoría" },
                    { status: 400 }
                );
            }
        }

        // Para LIMITED_MULTIPLE usamos maxOptions de la BD
        if (poll.votingType === "LIMITED_MULTIPLE") {
            const maxAllowed = poll.maxOptions ?? 1;
            if (selectedCount > maxAllowed) {
                return NextResponse.json(
                    { error: `Solo puedes seleccionar hasta ${maxAllowed} opciones` },
                    { status: 400 }
                );
            }
        }

        // Para MULTIPLE (ilimitado) → permitimos hasta todas las opciones de la poll
        if (poll.votingType === "MULTIPLE") {
            const maxAllowed = poll.options.length;
            if (selectedCount > maxAllowed) {
                // En la práctica casi imposible, pero por seguridad:
                return NextResponse.json(
                    { error: "Has seleccionado más opciones de las disponibles" },
                    { status: 400 }
                );
            }
        }

        // 6. Guardar voto
        await prisma.$transaction(async (tx) => {
            const vote = await tx.vote.create({
                data: {
                    pollId,
                    voterHash: voterId,
                    userId: userId || null,
                },
            });

            await tx.voteOption.createMany({
                data: filteredOptionIds.map((optId: string) => ({
                    voteId: vote.id,
                    optionId: optId,
                })),
            });
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Ya has votado en esta categoría' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}