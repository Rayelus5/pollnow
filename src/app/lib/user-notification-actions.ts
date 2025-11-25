"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Marcar TODAS las notificaciones del usuario como leídas
export async function markAllUserNotificationsRead() {
    const session = await auth();
    if (!session?.user) return;

    await prisma.notification.updateMany({
        where: {
            userId: session.user.id, // 👈 Notificaciones del usuario
        },
        data: {
            isRead: true,
        },
    });

    // Refrescamos el dashboard donde se ve NotificationsTab
    revalidatePath("/dashboard");
}

// Marcar UNA notificación concreta como leída
export async function markUserNotificationRead(notificationId: string) {
    const session = await auth();
    if (!session?.user) return;

    await prisma.notification.updateMany({
        where: {
            id: notificationId,
            userId: session.user.id,
        },
        data: {
            isRead: true,
        },
    });

    revalidatePath("/dashboard");
}
