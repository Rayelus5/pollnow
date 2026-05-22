// app/api/polls/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit-redis';

export async function POST(req: Request) {
    const ip = getClientIp(req);
    const rl = await rateLimit(`polls:create:${ip}`, 10);
    if (!rl.allowed) return tooManyRequests(rl, 'Demasiadas peticiones.');

    try {
        const body = await req.json();
        const { title, description, options, endAt } = body;

        // Crear la Poll y las Opciones en una sola transacción
        const poll = await prisma.poll.create({
            data: {
                title,
                description,
                votingType: "SINGLE",
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