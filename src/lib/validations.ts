import { z } from "zod";

// Lista de dominios de email temporales/basura para bloquear
const DISPOSABLE_DOMAINS = [
    "yopmail.com",
    "tempmail.com",
    "guerrillamail.com",
    "10minutemail.com",
    "mailinator.com",
    "throwawaymail.com",
    "sharklasers.com"
];

// Validador de Email Seguro
export const emailSchema = z
    .string()
    .email("Introduce un email válido")
    .refine((email) => {
        const domain = email.split("@")[1];
        return !DISPOSABLE_DOMAINS.includes(domain);
    }, { message: "No se permiten correos temporales." });

// Validador de Contraseña Fuerte
// - Mínimo 8 caracteres
// - Al menos una mayúscula
// - Al menos un número
// - Al menos un símbolo especial
export const passwordSchema = z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^a-zA-Z0-9]/, "Debe contener al menos un símbolo especial (@$!%*?&)");

// Validador de Nombre de Usuario (Solo a-z, números)
export const usernameSchema = z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[a-z0-9]+$/, "Solo letras minúsculas y números (sin espacios ni acentos)");

// Esquema completo de Registro
export const registerSchema = z.object({
    name: z.string().min(2, "El nombre es requerido"),
    email: emailSchema,
    password: passwordSchema,
});