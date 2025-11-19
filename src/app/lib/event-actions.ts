'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// --- EVENTO PRINCIPAL ---

export async function updateEvent(eventId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user) return;

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const galaDateStr = formData.get('galaDate') as string; // Recibimos el string crudo
    const isPublic = formData.get('isPublic') === 'on';

    // Lógica de validación de fecha
    let galaDate: Date | null = null;
    if (galaDateStr && galaDateStr !== "") {
        const parsedDate = new Date(galaDateStr);
        // Verificamos si es una fecha válida (getTime() devuelve NaN si es inválida)
        if (!isNaN(parsedDate.getTime())) {
            galaDate = parsedDate;
        }
    }

    await prisma.event.update({
        where: { id: eventId, userId: session.user.id },
        data: {
            title,
            description,
            galaDate, // Ahora pasamos Date válido o null
            isPublic
        }
    });

    revalidatePath(`/dashboard/event/${eventId}`);
}

// --- PARTICIPANTES ---

export async function createEventParticipant(eventId: string, formData: FormData) {
    const name = formData.get('name') as string;
    const imageUrl = formData.get('imageUrl') as string;
    if (!name) return;

    await prisma.participant.create({
        data: { name, imageUrl, eventId }
    });
    revalidatePath(`/dashboard/event/${eventId}`);
}

export async function updateEventParticipant(participantId: string, eventId: string, formData: FormData) {
    const name = formData.get('name') as string;
    const imageUrl = formData.get('imageUrl') as string;

    await prisma.participant.update({
        where: { id: participantId },
        data: { name, imageUrl }
    });
    revalidatePath(`/dashboard/event/${eventId}`);
}

export async function deleteEventParticipant(participantId: string, eventId: string) {
    await prisma.participant.delete({ where: { id: participantId } });
    revalidatePath(`/dashboard/event/${eventId}`);
}

// --- ENCUESTAS (POLLS) ---

export async function createEventPoll(eventId: string, formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const endAt = formData.get('endAt') as string;
    const participantIds = formData.getAll('participantIds') as string[];

    if (!title || !endAt) return;

    // Calcular orden (último + 1)
    const lastPoll = await prisma.poll.findFirst({
        where: { eventId },
        orderBy: { order: 'desc' }
    });
    const newOrder = (lastPoll?.order ?? 0) + 1;

    await prisma.poll.create({
        data: {
            title,
            description,
            endAt: new Date(endAt),
            eventId,
            order: newOrder,
            isPublished: true, // Por defecto publicadas en el panel
            options: {
                create: participantIds.map((pId) => ({ participantId: pId }))
            }
        }
    });

    revalidatePath(`/dashboard/event/${eventId}`);
}

export async function updateEventPoll(pollId: string, eventId: string, formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const endAt = formData.get('endAt') as string;
    const participantIds = formData.getAll('participantIds') as string[];

    await prisma.poll.update({
        where: { id: pollId },
        data: { title, description, endAt: new Date(endAt) }
    });

    // Sincronizar Participantes (Borrar desmarcados, Añadir nuevos)
    const currentOptions = await prisma.option.findMany({ where: { pollId } });

    // 1. Borrar
    const toDelete = currentOptions.filter(o => !participantIds.includes(o.participantId));
    for (const opt of toDelete) {
        await prisma.option.delete({ where: { id: opt.id } });
    }

    // 2. Crear
    const currentIds = currentOptions.map(o => o.participantId);
    const toCreate = participantIds.filter(pId => !currentIds.includes(pId));
    for (const pId of toCreate) {
        await prisma.option.create({ data: { pollId, participantId: pId } });
    }

    revalidatePath(`/dashboard/event/${eventId}`);
}

export async function deleteEventPoll(pollId: string, eventId: string) {
    await prisma.poll.delete({ where: { id: pollId } });
    revalidatePath(`/dashboard/event/${eventId}`);
}

export async function reorderEventPolls(items: { id: string, order: number }[], eventId: string) {
    await prisma.$transaction(
        items.map((item) =>
            prisma.poll.update({
                where: { id: item.id },
                data: { order: item.order }
            })
        )
    );
    revalidatePath(`/dashboard/event/${eventId}`);
}


// --- NUEVA FUNCIÓN: ELIMINAR EVENTO ---

export async function deleteEvent(eventId: string) {
    const session = await auth();
    if (!session?.user) return;

    // Borramos el evento (y por la cascada, se borrarán sus polls y participantes)
    await prisma.event.delete({
        where: { id: eventId, userId: session.user.id }
    });

    // Redirigimos al dashboard general
    revalidatePath('/dashboard');
    redirect('/dashboard');
}