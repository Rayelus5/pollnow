"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { rateLimit } from "@/lib/rate-limit-redis";
import { sendBugReportToAdmin, sendBugReplyToUser } from "@/lib/mail";
import { BugSeverity, BugStatus } from "@prisma/client";

const EXT_BY_TYPE: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};

const reportSchema = z.object({
    title: z.string().trim().min(1, "El título es obligatorio").max(100, "Máximo 100 caracteres"),
    severity: z.nativeEnum(BugSeverity, { message: "Severidad inválida" }),
    pageUrl: z.string().trim().min(1, "Indica la página donde ocurre").max(500),
    description: z.string().trim().min(30, "Mínimo 30 caracteres").max(2000, "Máximo 2000 caracteres"),
});

export type BugReportState = {
    error?: string;
    success?: boolean;
    values?: { title?: string; severity?: string; pageUrl?: string; description?: string };
};

// ─── Enviar reporte (usuario autenticado) ──────────────────────────────────────
export async function submitBugReport(
    _prevState: BugReportState | undefined,
    formData: FormData
): Promise<BugReportState> {
    const session = await auth();
    if (!session?.user?.id) return { error: "Debes iniciar sesión para reportar." };

    // Rate limit: 3 reportes por usuario / 24h
    const rl = await rateLimit(`bug-report:${session.user.id}`, 3, "24 h");
    if (!rl.allowed) {
        return { error: "Has alcanzado el límite de 3 reportes en 24 horas. Inténtalo más tarde." };
    }

    const raw = {
        title: (formData.get("title") as string) ?? "",
        severity: (formData.get("severity") as string) ?? "",
        pageUrl: (formData.get("pageUrl") as string) ?? "",
        description: (formData.get("description") as string) ?? "",
    };

    const parsed = reportSchema.safeParse(raw);
    if (!parsed.success) {
        const fe = parsed.error.flatten().fieldErrors;
        return {
            error: fe.title?.[0] || fe.severity?.[0] || fe.pageUrl?.[0] || fe.description?.[0] || "Datos inválidos",
            values: raw,
        };
    }
    const data = parsed.data;

    // Captura opcional
    let screenshotUrl: string | null = null;
    const file = formData.get("screenshot");
    if (file instanceof File && file.size > 0) {
        const contentType = file.type.toLowerCase();
        const ext = EXT_BY_TYPE[contentType];
        if (!ext) return { error: "La captura debe ser JPG, PNG o WEBP.", values: raw };
        if (file.size > 5 * 1024 * 1024) return { error: "La captura no puede superar los 5MB.", values: raw };
        try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const key = `bug-reports/${session.user.id}/${crypto.randomUUID()}.${ext}`;
            const blob = await put(key, new Blob([buffer as BlobPart], { type: contentType }), {
                access: "public",
                contentType,
                addRandomSuffix: false,
            });
            screenshotUrl = blob.url;
        } catch (e) {
            console.error("[bug-report] screenshot upload failed", e);
            return { error: "No se pudo subir la captura. Inténtalo de nuevo.", values: raw };
        }
    }

    try {
        const report = await prisma.bugReport.create({
            data: {
                userId: session.user.id,
                title: data.title,
                severity: data.severity,
                pageUrl: data.pageUrl,
                description: data.description,
                screenshotUrl,
            },
            include: { user: { select: { name: true, email: true, id: true } } },
        });

        // Email al admin (best-effort: no rompe el flujo si Resend falla)
        try {
            await sendBugReportToAdmin({
                reportId: report.id,
                title: report.title,
                severity: report.severity,
                pageUrl: report.pageUrl,
                description: report.description,
                screenshotUrl: report.screenshotUrl,
                reporterName: report.user.name,
                reporterEmail: report.user.email,
                reporterId: report.user.id,
            });
        } catch (e) {
            console.error("[bug-report] admin email failed", e);
        }

        return { success: true };
    } catch (e) {
        console.error("[bug-report] create failed", e);
        return { error: "No se pudo registrar el reporte. Inténtalo de nuevo.", values: raw };
    }
}

// ─── Acciones de admin ──────────────────────────────────────────────────────────

async function requireAdmin() {
    const session = await auth();
    const role = session?.user?.role;
    if (!session?.user?.id || (role !== "ADMIN" && role !== "MODERATOR")) {
        return null;
    }
    return session;
}

export async function updateBugReport(
    id: string,
    data: { status?: BugStatus; adminNotes?: string }
): Promise<{ error?: string; success?: boolean }> {
    const session = await requireAdmin();
    if (!session) return { error: "Sin permisos" };

    await prisma.bugReport.update({
        where: { id },
        data: {
            ...(data.status ? { status: data.status } : {}),
            ...(data.adminNotes !== undefined ? { adminNotes: data.adminNotes } : {}),
        },
    });

    revalidatePath(`/admin/bugs/${id}`);
    revalidatePath("/admin/bugs");
    return { success: true };
}

export async function markBugRewarded(id: string): Promise<{ error?: string; success?: boolean }> {
    const session = await requireAdmin();
    if (!session) return { error: "Sin permisos" };

    const report = await prisma.bugReport.findUnique({ where: { id }, select: { status: true } });
    if (!report) return { error: "Reporte no encontrado" };
    if (report.status !== "ACCEPTED") return { error: "Solo se puede recompensar un reporte ACEPTADO." };

    await prisma.bugReport.update({ where: { id }, data: { status: "REWARDED" } });
    revalidatePath(`/admin/bugs/${id}`);
    revalidatePath("/admin/bugs");
    return { success: true };
}

export async function sendBugUserEmail(
    id: string,
    subject: string,
    message: string
): Promise<{ error?: string; success?: boolean }> {
    const session = await requireAdmin();
    if (!session) return { error: "Sin permisos" };

    const cleanSubject = subject.trim() || "Re: Tu reporte de bug en Pollnow";
    if (message.trim().length < 5) return { error: "El mensaje es demasiado corto." };

    const report = await prisma.bugReport.findUnique({
        where: { id },
        include: { user: { select: { email: true } } },
    });
    if (!report) return { error: "Reporte no encontrado" };

    try {
        await sendBugReplyToUser({ to: report.user.email, subject: cleanSubject, message });
    } catch (e) {
        console.error("[bug-report] user email failed", e);
        return { error: "No se pudo enviar el email." };
    }
    return { success: true };
}
