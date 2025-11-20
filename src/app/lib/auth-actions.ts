'use server';

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

// Regex: Solo letras, números y espacios. Sin símbolos raros.
const nameRegex = /^[a-zA-Z0-9\s]+$/;

const registerSchema = z.object({
    name: z.string()
        .min(2, "El nombre es muy corto")
        .regex(nameRegex, "El nombre solo puede contener letras y números"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export async function registerUser(prevState: string | undefined, formData: FormData) {
    // 1. Validar datos
    const validatedFields = registerSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
    });

    if (!validatedFields.success) {
        return validatedFields.error.errors[0].message;
    }

    const { name, email, password } = validatedFields.data;

    try {
        // 2. Verificar si ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return "Este email ya está registrado.";
        }

        // 3. Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Generar username único
        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
        const randomSuffix = Math.floor(Math.random() * 10000);
        const username = `${baseUsername}${randomSuffix}`;

        // 5. Crear usuario
        await prisma.user.create({
            data: {
                name,
                email,
                username,
                passwordHash: hashedPassword,
                subscriptionStatus: 'free',
                image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
            },
        });

        // 6. AUTO-LOGIN (Mejor experiencia que redirigir al login)
        try {
            await signIn('credentials', {
                email,
                password,
                redirectTo: "/dashboard" // Ruta relativa funciona en prod
            });
        } catch (err) {
            if (err instanceof AuthError) throw err; // Relanzar para que NextAuth maneje el redirect
            throw err; // Relanzar NEXT_REDIRECT
        }

    } catch (error: any) {
        if (error.message?.includes("NEXT_REDIRECT")) throw error;
        console.error("Register error:", error);
        return "Error interno al crear usuario.";
    }
}