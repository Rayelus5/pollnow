'use server';

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { generateVerificationToken, generatePasswordResetToken } from "@/lib/tokens";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/mail";
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

// --- 5. RECUPERACIÓN DE CONTRASEÑA ---
const requestResetSchema = z.object({
    email: z.string().email("Email inválido"),
});

const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token no válido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
});

// Mensaje neutro: nunca confirmamos si el email existe (seguridad).
const NEUTRAL_RESET_MESSAGE = "Si ese email está registrado, recibirás un enlace en breve.";

export type ResetState = { error?: string; success?: string };

// 5A. Solicitar email de recuperación
export async function requestPasswordReset(
    prevState: ResetState | undefined,
    formData: FormData
): Promise<ResetState> {
    const email = formData.get('email') as string;

    const validatedFields = requestResetSchema.safeParse({ email });
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors.email?.[0] || "Email inválido" };
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        // Solo enviamos si el usuario existe Y tiene contraseña (no cuentas Google).
        // En cualquier otro caso devolvemos el mismo mensaje neutro.
        if (user?.passwordHash) {
            const resetToken = await generatePasswordResetToken(email);
            await sendPasswordResetEmail(resetToken.email, resetToken.token);
        }

        return { success: NEUTRAL_RESET_MESSAGE };
    } catch (error) {
        console.error("Password reset request error:", error);
        return { error: "No hemos podido procesar la solicitud. Inténtalo de nuevo." };
    }
}

// 5B. Establecer nueva contraseña con el token
export async function resetPassword(
    prevState: ResetState | undefined,
    formData: FormData
): Promise<ResetState> {
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    const validatedFields = resetPasswordSchema.safeParse({ token, password });
    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return { error: fieldErrors.token?.[0] || fieldErrors.password?.[0] || "Datos inválidos" };
    }

    if (password !== confirmPassword) {
        return { error: "Las contraseñas no coinciden." };
    }

    try {
        const existingToken = await prisma.passwordResetToken.findUnique({ where: { token } });

        if (!existingToken) {
            return { error: "El enlace no es válido o ya ha sido utilizado." };
        }

        if (existingToken.expires < new Date()) {
            await prisma.passwordResetToken.delete({ where: { id: existingToken.id } });
            return { error: "El enlace ha caducado. Solicita uno nuevo." };
        }

        const user = await prisma.user.findUnique({ where: { email: existingToken.email } });
        if (!user) {
            return { error: "El enlace no es válido o ya ha sido utilizado." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword },
        });

        await prisma.passwordResetToken.delete({ where: { id: existingToken.id } });

        return { success: "Contraseña actualizada. Ya puedes iniciar sesión." };
    } catch (error) {
        console.error("Password reset error:", error);
        return { error: "No hemos podido actualizar la contraseña. Inténtalo de nuevo." };
    }
}