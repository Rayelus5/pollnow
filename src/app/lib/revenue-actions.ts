"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { MAX_BALANCE, MIN_WITHDRAWAL, WITHDRAWAL_PROCESSING_DAYS } from "@/lib/revenue-config";
import {
    sendRevenuePaymentReceived,
    sendWithdrawalRequestedUser,
    sendWithdrawalRequestedAdmin,
    sendWithdrawalApproved,
    sendWithdrawalRejected,
} from "@/lib/mail";

type Result = { error?: string; success?: boolean };

async function requireAdmin() {
    const session = await auth();
    const role = session?.user?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "MODERATOR")) return null;
    return session;
}

// ─── Usuario: solicitar retiro ──────────────────────────────────────────────────

const withdrawalSchema = z.object({
    recipientPhone: z.string().trim().min(5, "Número de Bizum inválido").max(20),
    recipientName: z.string().trim().min(2, "Indica el nombre completo del destinatario").max(120),
});

export async function requestWithdrawal(input: { recipientPhone: string; recipientName: string }): Promise<Result> {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    const parsed = withdrawalSchema.safeParse(input);
    if (!parsed.success) {
        const fe = parsed.error.flatten().fieldErrors;
        return { error: fe.recipientPhone?.[0] || fe.recipientName?.[0] || "Datos inválidos" };
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, currentBalance: true },
    });
    if (!user) return { error: "Usuario no encontrado" };

    // Guards de seguridad (servidor)
    if (user.currentBalance < MIN_WITHDRAWAL) {
        return { error: `El mínimo de retiro es ${MIN_WITHDRAWAL}€.` };
    }
    const existingPending = await prisma.withdrawalRequest.findFirst({
        where: { userId: user.id, status: "PENDING" },
        select: { id: true },
    });
    if (existingPending) return { error: "Ya tienes una solicitud de retiro en proceso." };

    const amount = user.currentBalance;

    await prisma.withdrawalRequest.create({
        data: {
            userId: user.id,
            amount,
            method: "BIZUM",
            recipientPhone: parsed.data.recipientPhone,
            recipientName: parsed.data.recipientName,
        },
    });
    // El saldo NO se toca aquí: se descuenta cuando el admin aprueba.

    // Emails (best-effort)
    try {
        await sendWithdrawalRequestedUser({ to: user.email, amount, processingDays: WITHDRAWAL_PROCESSING_DAYS });
        await sendWithdrawalRequestedAdmin({
            userName: user.name,
            userEmail: user.email,
            amount,
            recipientPhone: parsed.data.recipientPhone,
            recipientName: parsed.data.recipientName,
        });
    } catch (e) {
        console.error("[withdrawal] email failed", e);
    }

    revalidatePath("/dashboard");
    return { success: true };
}

// ─── Admin: buscar usuarios / eventos para el formulario de envío ─────────────────

export async function searchUsersForPayment(query: string) {
    const session = await requireAdmin();
    if (!session) return [];
    const q = query.trim();
    if (q.length < 2) return [];

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { username: { contains: q, mode: "insensitive" } },
            ],
        },
        select: { id: true, name: true, email: true, currentBalance: true },
        take: 8,
    });
    return users.map((u) => ({ ...u, marginAvailable: Math.max(0, MAX_BALANCE - u.currentBalance) }));
}

export async function getUserPublishedEvents(userId: string) {
    const session = await requireAdmin();
    if (!session) return [];
    const events = await prisma.event.findMany({
        where: { userId, status: "APPROVED" },
        select: { id: true, title: true },
        orderBy: { createdAt: "desc" },
    });
    return events;
}

// ─── Admin: crear envío de dinero ─────────────────────────────────────────────────

const paymentSchema = z.object({
    userId: z.string().min(1),
    eventId: z.string().min(1),
    amount: z.number().positive("La cantidad debe ser mayor que 0"),
    adminNote: z.string().trim().max(1000).optional(),
});

export async function createRevenuePayment(input: {
    userId: string;
    eventId: string;
    amount: number;
    adminNote?: string;
}): Promise<Result> {
    const session = await requireAdmin();
    if (!session) return { error: "Sin permisos" };

    const parsed = paymentSchema.safeParse(input);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const { userId, eventId, adminNote } = parsed.data;
    // Redondeo a 2 decimales para evitar errores de coma flotante
    const amount = Math.round(parsed.data.amount * 100) / 100;
    if (amount < 0.01) return { error: "La cantidad mínima es 0,01€." };

    const [user, event] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, currentBalance: true } }),
        prisma.event.findUnique({ where: { id: eventId }, select: { id: true, title: true, userId: true, status: true } }),
    ]);
    if (!user) return { error: "Usuario no encontrado" };
    if (!event) return { error: "Evento no encontrado" };
    if (event.userId !== userId) return { error: "El evento no pertenece a ese usuario." };
    if (event.status !== "APPROVED") return { error: "El evento no está publicado." };

    // Guard de saldo máximo (servidor)
    if (user.currentBalance + amount > MAX_BALANCE + 1e-9) {
        return { error: `El saldo no puede superar ${MAX_BALANCE}€ (disponible: ${(MAX_BALANCE - user.currentBalance).toFixed(2)}€).` };
    }

    // Transacción: crear pago + actualizar saldos de forma atómica
    await prisma.$transaction([
        prisma.revenuePayment.create({
            data: { userId, eventId, amount, adminNote: adminNote || null },
        }),
        prisma.user.update({
            where: { id: userId },
            data: {
                currentBalance: { increment: amount },
                totalEarned: { increment: amount },
            },
        }),
    ]);

    try {
        await sendRevenuePaymentReceived({
            to: user.email,
            amount,
            eventTitle: event.title,
            eventId: event.id,
            currentBalance: user.currentBalance + amount,
            adminNote: adminNote || null,
        });
    } catch (e) {
        console.error("[revenue] payment email failed", e);
    }

    revalidatePath("/admin/ingresos/envios");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
}

// ─── Admin: aprobar / rechazar retiros ────────────────────────────────────────────

export async function approveWithdrawal(id: string): Promise<Result> {
    const session = await requireAdmin();
    if (!session) return { error: "Sin permisos" };

    const w = await prisma.withdrawalRequest.findUnique({
        where: { id },
        include: { user: { select: { id: true, email: true, currentBalance: true, totalEarned: true } } },
    });
    if (!w) return { error: "Solicitud no encontrada" };
    if (w.status !== "PENDING") return { error: "Esta solicitud ya ha sido procesada." };
    if (w.user.currentBalance + 1e-9 < w.amount) {
        return { error: "El saldo del usuario es menor que la cantidad solicitada." };
    }

    await prisma.$transaction([
        prisma.withdrawalRequest.update({
            where: { id },
            data: { status: "APPROVED", processedAt: new Date() },
        }),
        prisma.user.update({
            where: { id: w.user.id },
            data: { currentBalance: { decrement: w.amount } },
        }),
    ]);

    try {
        await sendWithdrawalApproved({ to: w.user.email, amount: w.amount, totalEarned: w.user.totalEarned });
    } catch (e) {
        console.error("[withdrawal] approved email failed", e);
    }

    revalidatePath("/admin/ingresos/retiros");
    revalidatePath(`/admin/users/${w.user.id}`);
    return { success: true };
}

export async function rejectWithdrawal(id: string, reason: string): Promise<Result> {
    const session = await requireAdmin();
    if (!session) return { error: "Sin permisos" };

    const cleanReason = reason.trim();
    if (cleanReason.length < 10) return { error: "El motivo debe tener al menos 10 caracteres." };

    const w = await prisma.withdrawalRequest.findUnique({
        where: { id },
        include: { user: { select: { id: true, email: true } } },
    });
    if (!w) return { error: "Solicitud no encontrada" };
    if (w.status !== "PENDING") return { error: "Esta solicitud ya ha sido procesada." };

    // El saldo NO se toca: permanece disponible para el usuario.
    await prisma.withdrawalRequest.update({
        where: { id },
        data: { status: "REJECTED", processedAt: new Date(), rejectionReason: cleanReason },
    });

    try {
        await sendWithdrawalRejected({ to: w.user.email, amount: w.amount, reason: cleanReason });
    } catch (e) {
        console.error("[withdrawal] rejected email failed", e);
    }

    revalidatePath("/admin/ingresos/retiros");
    revalidatePath(`/admin/users/${w.user.id}`);
    return { success: true };
}
