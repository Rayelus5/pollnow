import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendAdminBroadcastBatch } from "@/lib/mail";
import { BROADCAST_TEMPLATES, TemplateId } from "@/lib/email-broadcast";

export async function POST(req: Request) {
    const session = await auth();
    // @ts-ignore
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Acceso restringido a administradores." }, { status: 403 });
    }

    const { allowed, retryAfter } = rateLimit(`admin:send-email:${session.user.id}`, 5);
    if (!allowed) {
        return NextResponse.json(
            { error: "Demasiados envíos. Espera unos minutos." },
            { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
    }

    const body = await req.json();
    const { recipients, customEmails, subject, messageBody, templateId, ctaLabel, ctaUrl } = body as {
        recipients: "all" | "premium" | "free" | "custom";
        customEmails?: string[];
        subject: string;
        messageBody: string;
        templateId: TemplateId;
        ctaLabel?: string;
        ctaUrl?: string;
    };

    if (!subject?.trim()) {
        return NextResponse.json({ error: "El asunto no puede estar vacío." }, { status: 400 });
    }
    if (!messageBody?.trim()) {
        return NextResponse.json({ error: "El cuerpo del mensaje no puede estar vacío." }, { status: 400 });
    }
    if (!BROADCAST_TEMPLATES[templateId]) {
        return NextResponse.json({ error: "Plantilla inválida." }, { status: 400 });
    }

    // Fetch recipient emails
    let emails: string[] = [];

    if (recipients === "custom") {
        if (!customEmails?.length) {
            return NextResponse.json({ error: "No se han especificado destinatarios." }, { status: 400 });
        }
        emails = customEmails;
    } else {
        const where: Record<string, unknown> =
            recipients === "premium"
                ? { subscriptionStatus: { not: "free" } }
                : recipients === "free"
                ? { subscriptionStatus: "free" }
                : {};

        const users = await prisma.user.findMany({
            where: { ...where },
            select: { email: true },
        });
        emails = users.map(u => u.email!).filter(Boolean);
    }

    if (emails.length === 0) {
        return NextResponse.json({ error: "No hay destinatarios para este filtro." }, { status: 400 });
    }

    const template = BROADCAST_TEMPLATES[templateId];
    const result = await sendAdminBroadcastBatch(
        emails,
        subject.trim(),
        messageBody.trim(),
        template,
        ctaLabel?.trim() || undefined,
        ctaUrl?.trim() || undefined,
    );

    // Audit log
    await prisma.moderationLog.create({
        data: {
            adminId: session.user.id!,
            actionType: "BROADCAST_EMAIL",
            targetType: "EMAIL",
            targetId: recipients,
            details: `Asunto: "${subject}" | Plantilla: ${templateId} | Enviados: ${result.sent} | Fallidos: ${result.failed}`,
        },
    });

    return NextResponse.json({ ...result, total: emails.length });
}
