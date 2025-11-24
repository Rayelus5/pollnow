'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Helper de seguridad
async function checkAdmin() {
    const session = await auth();
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
        throw new Error("Unauthorized");
    }
    return session;
}

// --- MODERACIÓN DE EVENTOS ---

export async function approveEvent(eventId: string) {
    const session = await checkAdmin();

    const event = await prisma.event.update({
        where: { id: eventId },
        data: { 
            status: 'APPROVED', 
            isPublic: true, // Publicamos automáticamente al aprobar
            reviewReason: null // Limpiamos motivos anteriores
        },
        include: { user: true }
    });

    // Crear notificación para el usuario
    await prisma.notification.create({
        data: {
            userId: event.userId,
            adminUserId: session.user.id,
            message: `¡Buenas noticias! Tu evento "${event.title}" ha sido aprobado y ya es público.`,
            link: `/dashboard/event/${event.id}`,
            isRead: false
        }
    });

    revalidatePath('/admin/reviews');
    revalidatePath('/polls'); // Actualizar buscador público
}

export async function rejectEvent(eventId: string, reason: string) {
    const session = await checkAdmin();

    const event = await prisma.event.update({
        where: { id: eventId },
        data: { 
            status: 'DENIED', 
            isPublic: false,
            reviewReason: reason
        }
    });

    // Crear notificación
    await prisma.notification.create({
        data: {
            userId: event.userId,
            adminUserId: session.user.id,
            message: `Tu solicitud para publicar "${event.title}" ha sido rechazada. Motivo: ${reason}`,
            link: `/dashboard/event/${event.id}`, // En el dashboard verá el motivo
            isRead: false
        }
    });

    revalidatePath('/admin/reviews');
}

// --- GESTIÓN DE USUARIOS ---

export async function toggleUserBan(userId: string) {
    await checkAdmin();
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await prisma.user.update({
        where: { id: userId },
        data: { ipBan: !user.ipBan } // Toggle ban
    });
    
    revalidatePath('/admin/users');
}