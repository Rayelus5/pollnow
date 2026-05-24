'use server';

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { applyWelcomeBonus } from "@/lib/promotion-utils";

// --- SCHEMAS ---
const strictNameRegex = /^[a-z]+$/;

const registerSchema = z.object({
    name: z.string()
        .min(3, "Mínimo 3 letras")
        .max(15, "Máximo 15 caracteres")
        .regex(strictNameRegex, "Solo minúsculas (a-z), sin espacios"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
});

const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Introduce tu contraseña"),
});

// --- ESTADOS DE FORMULARIO ---
// Devolvemos los valores válidos para que el form los conserve vía `defaultValue`
// (React resetea los inputs no controlados a su defaultValue tras la acción).
export type LoginState = { error?: string; values?: { email?: string } };
export type RegisterState =
    | { error?: string; values?: { name?: string; email?: string } }
    | { success: string };

// --- 1. REGISTRO DE USUARIO ---
export async function registerUser(
    prevState: RegisterState | undefined,
    formData: FormData
): Promise<RegisterState> {
    const rawName = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const cleanName = rawName ? rawName.toLowerCase().trim() : "";

    const validatedFields = registerSchema.safeParse({
        name: cleanName,
        email,
        password,
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            error: fieldErrors.name?.[0] || fieldErrors.email?.[0] || fieldErrors.password?.[0] || "Datos inválidos",
            // Conservar solo los campos que NO han dado error
            values: {
                name: fieldErrors.name ? undefined : cleanName,
                email: fieldErrors.email ? undefined : email,
            },
        };
    }

    const data = validatedFields.data;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        // DETECCIÓN DE CUENTA GOOGLE EN REGISTRO
        if (existingUser && !existingUser.passwordHash) {
            return {
                error: "Esta cuenta usa Google. Por favor inicia sesión con Google.",
                values: { name: data.name, email: data.email },
            };
        }

        if (existingUser) {
            // El email es el campo problemático → se limpia, el nombre se conserva
            return { error: "Este email ya está registrado.", values: { name: data.name } };
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const randomSuffix = Math.floor(Math.random() * 1000);
        const username = `${data.name}${randomSuffix}`;

        const newUser = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                username,
                passwordHash: hashedPassword,
                subscriptionStatus: 'free',
                image: `https://api.dicebear.com/9.x/glass/svg?seed=${username}`
            },
        });

        // Aplicar bono de bienvenida si está activo
        const promo = await prisma.promotionConfig.findUnique({ where: { id: "singleton" } });
        if (promo?.isActive) {
            await applyWelcomeBonus(newUser.id, promo.planSlug, promo.durationDays);
        }

        const verificationToken = await generateVerificationToken(data.email);
        await sendVerificationEmail(verificationToken.email, verificationToken.token);

        return { success: "Cuenta creada. Revisa tu correo para verificarla." };

    } catch (error: any) {
        console.error("Register error:", error);
        return { error: "Error interno al crear usuario.", values: { name: data.name, email: data.email } };
    }
}

// --- 2. LOGIN CON CREDENCIALES ---
export async function authenticateCredentials(
    prevState: LoginState | undefined,
    formData: FormData
): Promise<LoginState | undefined> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Validación básica
    const validatedFields = loginSchema.safeParse({ email, password });
    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            error: fieldErrors.email?.[0] || fieldErrors.password?.[0] || "Formato de datos inválido.",
            // Conservar el email solo si su formato es válido
            values: fieldErrors.email ? undefined : { email },
        };
    }

    // cerrar sesión primero antes de iniciar sesión (solo cerrar sesión si ya tiene sesión iniciada)
    // await signOut();


    try {
        // VERIFICACIÓN PREVIA: ¿Es cuenta de Google?
        const user = await prisma.user.findUnique({ where: { email } });

        if (user && !user.passwordHash) {
            return { error: "Esta cuenta está vinculada a Google. Usa el botón de Google.", values: { email } };
        }

        if (user && !user.emailVerified) {
            return { error: "Debes verificar tu correo antes de entrar.", values: { email } };
        }

        // Intento de Login
        await signIn('credentials', {
            email,
            password,
            redirectTo: "/polls"
        });

    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    // Credenciales incorrectas → conservar email, limpiar contraseña
                    return { error: 'Credenciales incorrectas.', values: { email } };
                default:
                    return { error: 'Algo salió mal al iniciar sesión.', values: { email } };
            }
        }
        // Next.js usa errores para redirigir, hay que relanzarlos
        throw error;
    }
}

// --- 3. LOGIN CON GOOGLE ---
export async function authenticateGoogle() {
    try {
        // cerrar sesión primero antes de iniciar sesión (solo cerrar sesión si ya tiene sesión iniciada)
        // await signOut();

        await signIn('google', { redirectTo: "/polls" });
    } catch (error) {
        if (error instanceof AuthError) {
            return 'Error al conectar con Google.';
        }
        throw error;
    }
}

// --- 4. LOGOUT ---
export async function logoutUser() {
    await signOut({ redirectTo: "/" });
}