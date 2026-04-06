// app/api/polls/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
    const ip = getClientIp(req);
    const { allowed, retryAfter } = rateLimit(`polls:create:${ip}`, 10);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Demasiadas peticiones.' },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } }
        );
    }

    try {
        const body = await req.json();
        const { title, description, options, endAt } = body;

        // Crear la Poll y las Opciones en una sola transacción
        const poll = await prisma.poll.create({
            data: {
                title,
                description,
                votingType: "SINGLE", // Simplificado para el MVP
                startAt: new Date(),
                endAt: new Date(endAt),
                isPublished: true,
                options: {
                    create: options.map((opt: any, index: number) => ({
                        name: opt.name,
                        imageUrl: opt.imageUrl || null,
                        order: index
                    }))
                }
            }
        });

        return NextResponse.json(poll);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error creating poll' }, { status: 500 });
    }
}