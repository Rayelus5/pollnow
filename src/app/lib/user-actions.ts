'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// lib/user-actions.ts (reemplaza la función updateProfile por esta versión)
export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    // Recuperamos el usuario actual desde DB (fuente de verdad, evita inconsistencias con session)
    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!currentUser) return { error: "Usuario no encontrado." };

    // Valores crudos provenientes del form (pueden no existir si el cliente no los envió)
    const rawName = (formData.get("name") as string | null)?.trim() ?? null;
    const rawUsername = (formData.get("username") as string | null)?.trim() ?? null;
    const rawImage = (formData.get("image") as string | null) ?? null;

    // Resolvemos: si el form NO envía el campo, usamos el valor actual en DB
    // Esto permite enviar *solo* los campos que cambian desde el cliente.
    const name = rawName !== null ? rawName : (currentUser.name ?? "");
    const username = rawUsername !== null ? rawUsername.toLowerCase() : (currentUser.username ?? "");
    const image = rawImage !== null ? rawImage : currentUser.image;

    // === VALIDACIONES USERNAME (@) ===
    if (!username) {
        return { error: "El nombre de usuario (@) es obligatorio." };
    }

    if (username.length > 25) {
        return { error: "El nombre de usuario (@) no puede tener más de 25 caracteres." };
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
        return {
            error: "El nombre de usuario (@) solo puede contener letras minúsculas (a-z) y guiones bajos (_).",
        };
    }

    // === VALIDACIONES NAME (nombre en pantalla) ===
    if (!name) {
        return { error: "El nombre en pantalla es obligatorio." };
    }

    if (name.length > 25) {
        return { error: "El nombre en pantalla no puede tener más de 25 caracteres." };
    }

    if (!/^[\p{L}\s]+$/u.test(name)) {
        return {
            error: "El nombre en pantalla solo puede contener letras y espacios (sin símbolos ni números).",
        };
    }

    // === USERNAME ÚNICO (si cambia respecto a la DB) ===
    if (username !== currentUser.username) {
        const existing = await prisma.user.findUnique({ where: { username } });
        // If found and it's NOT the current user -> error
        if (existing && existing.id !== currentUser.id) {
            return { error: "Este nombre de usuario (@) ya está en uso." };
        }
    }

    // Finalmente actualizamos con los valores resueltos.
    await prisma.user.update({
        where: { id: currentUser.id },
        data: {
            name,
            username,
            image: image ?? null,
        },
    });

    revalidatePath("/dashboard/profile");
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