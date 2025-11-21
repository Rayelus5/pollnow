'use server';

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { signOut } from "@/auth";

// --- 1. ESQUEMA DE VALIDACIÓN ESTRICTO ---
const strictNameRegex = /^[a-z]+$/;

const registerSchema = z.object({
    name: z.string()
        .min(3, "El nombre debe tener al menos 3 letras")
        .max(15, "El nombre no puede superar los 15 caracteres")
        .regex(strictNameRegex, "Solo se permiten letras minúsculas (a-z) sin espacios ni símbolos"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

// --- 2. ACCIÓN DE REGISTRO ---
export async function registerUser(prevState: string | undefined, formData: FormData) {
    // A. Sanitizar datos (Forzamos minúsculas)
    const rawName = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const cleanName = rawName ? rawName.toLowerCase().trim() : "";

    // B. Validar con Zod
    const validatedFields = registerSchema.safeParse({
        name: cleanName,
        email,
        password,
    });

    if (!validatedFields.success) {
        // Devolver el primer error encontrado
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return fieldErrors.name?.[0] || fieldErrors.email?.[0] || fieldErrors.password?.[0] || "Datos inválidos";
    }

    const data = validatedFields.data;

    try {
        // C. Verificar si el email ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            return "Este email ya está registrado.";
        }

        // D. Encriptar contraseña
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // E. Generar username único
        const randomSuffix = Math.floor(Math.random() * 1000);
        const username = `${data.name}${randomSuffix}`;

        // F. Crear el usuario en Base de Datos (emailVerified estará null por defecto)
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

        // G. Generar Token de Verificación
        const verificationToken = await generateVerificationToken(data.email);

        // H. Enviar Email (Usando Resend)
        await sendVerificationEmail(verificationToken.email, verificationToken.token);

        // I. Retornar ÉXITO (El formulario leerá este objeto para cambiar la UI)
        return { success: "Cuenta creada. Por favor, revisa tu correo para verificarla." };

    } catch (error: any) {
        console.error("Register error:", error);
        return "Error interno al crear usuario.";
    }
}

// --- 3. ACCIÓN DE LOGOUT ---
export async function logoutUser() {
    await signOut({ redirectTo: "/" });
}