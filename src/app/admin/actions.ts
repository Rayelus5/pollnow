'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- PARTICIPANTES ---

export async function createParticipant(formData: FormData) {
    const name = formData.get('name') as string;
    const imageUrl = formData.get('imageUrl') as string;
    if (!name) return;
    await prisma.participant.create({ data: { name, imageUrl } });
    revalidatePath('/admin/participants');
}

export async function updateParticipant(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const imageUrl = formData.get('imageUrl') as string;

    await prisma.participant.update({
        where: { id },
        data: { name, imageUrl }
    });
    revalidatePath('/admin/participants');
}

export async function deleteParticipant(id: string) {
    // Opcional: Borrar también sus nominaciones (Options) se hace solo si tienes onDelete: Cascade en el schema
    await prisma.participant.delete({ where: { id } });
    revalidatePath('/admin/participants');
}

// --- ENCUESTAS (POLLS) ---

export async function createPoll(formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const endAt = formData.get('endAt') as string;
    const participantIds = formData.getAll('participantIds') as string[];

    if (!title || !endAt) return;

    // Calculamos el último orden para ponerlo al final
    const lastPoll = await prisma.poll.findFirst({ orderBy: { order: 'desc' } });
    const newOrder = (lastPoll?.order ?? 0) + 1;

    await prisma.poll.create({
        data: {
            title,
            description,
            endAt: new Date(endAt),
            order: newOrder,
            isPublished: true,
            options: {
                create: participantIds.map((pId) => ({ participantId: pId }))
            }
        }
    });

    revalidatePath('/admin/polls');
    revalidatePath('/');
}

export async function updatePoll(id: string, formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const endAt = formData.get('endAt') as string;
    const participantIds = formData.getAll('participantIds') as string[]; // IDs seleccionados actualmente

    // 1. Actualizar datos básicos
    await prisma.poll.update({
        where: { id },
        data: {
            title,
            description,
            endAt: new Date(endAt),
        }
    });

    // 2. Sincronizar Opciones (Nominados)
    // Esto es complejo: Hay que ver cuáles borrar y cuáles añadir.

    // a. Obtener nominados actuales
    const currentOptions = await prisma.option.findMany({ where: { pollId: id } });
    const currentParticipantIds = currentOptions.map(o => o.participantId);

    // b. Borrar los que ya no están seleccionados
    const toDelete = currentOptions.filter(o => !participantIds.includes(o.participantId));
    for (const opt of toDelete) {
        await prisma.option.delete({ where: { id: opt.id } });
    }

    // c. Crear los nuevos (que están en el form pero no en la DB)
    const toCreate = participantIds.filter(pId => !currentParticipantIds.includes(pId));
    for (const pId of toCreate) {
        await prisma.option.create({
            data: { pollId: id, participantId: pId }
        });
    }

    revalidatePath('/admin/polls');
    revalidatePath('/');
}

export async function reorderPolls(items: { id: string, order: number }[]) {
    // Transacción para actualizar todos los órdenes de golpe
    await prisma.$transaction(
        items.map((item) =>
            prisma.poll.update({
                where: { id: item.id },
                data: { order: item.order }
            })
        )
    );
    revalidatePath('/admin/polls');
    revalidatePath('/');
}

export async function deletePoll(id: string) {
    await prisma.poll.delete({ where: { id } });
    revalidatePath('/admin/polls');
    revalidatePath('/');
}