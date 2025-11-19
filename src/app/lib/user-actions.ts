'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const image = formData.get('image') as string;

    // Validación básica de username único (si cambia)
    if (username && username !== session.user.username) {
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) return { error: "Este nombre de usuario ya está en uso." };
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: { name, username, image }
    });

    revalidatePath('/dashboard/profile');
    return { success: "Perfil actualizado correctamente." };
}

export async function changePassword(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;

    // 1. Verificar contraseña actual
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    if (!user || !user.passwordHash) {
        return { error: "Este usuario no usa contraseña (quizás usas Google)." };
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) return { error: "La contraseña actual es incorrecta." };

    // 2. Encriptar nueva
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Guardar
    await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash: hashedPassword }
    });

    revalidatePath('/dashboard/profile');
    return { success: "Contraseña cambiada. Inicia sesión de nuevo." };
}