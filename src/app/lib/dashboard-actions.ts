'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlanFromUser } from "@/lib/plans"; // <--- Importamos lógica
import { redirect } from "next/navigation";

export async function createEvent(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    // 1. OBTENER USUARIO COMPLETO (Para ver suscripción)
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { _count: { select: { events: true } } } // Contamos sus eventos actuales
    });

    if (!user) return { error: "Usuario no encontrado" };

    // 2. VERIFICAR LÍMITES
    const plan = getPlanFromUser(user);
    const currentEvents = user._count.events;

    if (currentEvents >= plan.quota) {
        return {
            error: `Has alcanzado el límite de tu plan ${plan.name} (${currentEvents}/${plan.quota}). Actualiza a Premium para crear más.`
        };
    }

    // 3. CREAR EVENTO (Si pasa el filtro)
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const slug = title.toLowerCase().replace(/ /g, '-') + '-' + Math.floor(Math.random() * 10000);

    try {
        const newEvent = await prisma.event.create({
            data: {
                title,
                description,
                slug,
                userId: session.user.id,
                isPublic: false,
            }
        });

        return { success: true, eventId: newEvent.id };
    } catch (error) {
        console.error(error);
        return { error: "Error al crear evento" };
    }
}