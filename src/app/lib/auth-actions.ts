'use server';

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

// --- VALIDACIÓN ESTRICTA ---
// Regex: Solo letras minúsculas (a-z), sin números, sin espacios, sin acentos.
const strictNameRegex = /^[a-z]+$/;

const registerSchema = z.object({
    name: z.string()
        .min(3, "El nombre debe tener al menos 3 letras")
        .max(15, "El nombre no puede superar los 15 caracteres")
        .regex(strictNameRegex, "Solo se permiten letras minúsculas (a-z) sin espacios ni símbolos"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export async function registerUser(prevState: string | undefined, formData: FormData) {
    // 1. Obtener y sanitizar datos (Forzamos minúsculas en el nombre)
    const rawName = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const cleanName = rawName ? rawName.toLowerCase().trim() : "";

    // 2. Validar datos con Zod
    const validatedFields = registerSchema.safeParse({
        name: cleanName,
        email,
        password,
    });

    // --- CORRECCIÓN DEL CRASH 'reading 0' ---
    if (!validatedFields.success) {
        // Usamos flatten() para obtener los errores de forma segura
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        // Devolvemos el primer error que encontremos (de name, email o password)
        return fieldErrors.name?.[0] || fieldErrors.email?.[0] || fieldErrors.password?.[0] || "Datos inválidos";
    }

    const data = validatedFields.data;

    try {
        // 3. Verificar si ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            return "Este email ya está registrado.";
        }

        // 4. Encriptar contraseña
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // 5. Generar username único basado en el nombre limpio
        const randomSuffix = Math.floor(Math.random() * 1000);
        const username = `${data.name}${randomSuffix}`;

        // 6. Crear usuario
        await prisma.user.create({
            data: {
                name: data.name, // Guardamos el nombre estricto (ej: "jesus")
                email: data.email,
                username,
                passwordHash: hashedPassword,
                subscriptionStatus: 'free',
                image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
            },
        });

        // 7. AUTO-LOGIN
        try {
            await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirectTo: "/dashboard"
            });
        } catch (err) {
            if (err instanceof AuthError) throw err;
            throw err;
        }

    } catch (error: any) {
        if (error.message?.includes("NEXT_REDIRECT")) throw error;
        console.error("Register error:", error);
        return "Error interno al crear usuario.";
    }
}