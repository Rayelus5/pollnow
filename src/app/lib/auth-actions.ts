'use server';

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations"; // <--- Usamos el nuevo validador centralizado
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function registerUser(prevState: string | undefined, formData: FormData) {
    // 1. Obtener datos
    const rawName = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // 2. Validación Fuerte (Zod + Anti-Spam + Password Policy)
    const validatedFields = registerSchema.safeParse({
        name: rawName,
        email,
        password,
    });

    if (!validatedFields.success) {
        // Devolvemos el primer error encontrado
        const errors = validatedFields.error.flatten().fieldErrors;
        return errors.email?.[0] || errors.password?.[0] || errors.name?.[0] || "Datos inválidos";
    }

    const data = validatedFields.data;

    try {
        // 3. Verificar existencia
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            return "Este email ya está registrado.";
        }

        // 4. Encriptar
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // 5. Generar username
        // Usamos una estrategia simple: nombre + 4 digitos
        const cleanName = data.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const randomSuffix = Math.floor(Math.random() * 10000);
        const username = `${cleanName}${randomSuffix}`;

        // 6. Crear Usuario
        await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                username,
                passwordHash: hashedPassword,
                subscriptionStatus: 'free',
                image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
            },
        });

        // TODO: Aquí podríamos llamar a `sendVerificationEmail` si quisiéramos activar la verificación obligatoria.
        // Por ahora, hacemos auto-login para no añadir fricción en el MVP, pero ya tenemos la validación de dominios basura.

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