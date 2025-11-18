// app/api/polls/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Definimos el tipo como una Promesa
type Props = {
    params: Promise<{ id: string }>
}

export async function GET(
    request: Request,
    { params }: Props
) {
    try {
        // 1. AWAIT params (Cambio clave para Next.js 15)
        const { id } = await params;

        const poll = await prisma.poll.findUnique({
            where: { id }, // Ahora id ya es un string válido
            include: {
                options: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!poll) {
            return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
        }

        return NextResponse.json(poll);
    } catch (error) {
        console.error("❌ ERROR EN API:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}