// src/lib/telegram.ts
//
// Notificaciones al admin vía bot de Telegram. Mismo espíritu "best-effort,
// nunca rompe el flujo" que ya usan `src/lib/pusher.ts` (triggerDataChanged)
// y `src/lib/mail.ts`: si Telegram falla o no está configurado, se loguea y
// se descarta, nunca se relanza el error hacia el llamador.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

let warnedMissingConfig = false;

/** Escapa texto de usuario antes de interpolarlo en un mensaje HTML de Telegram. */
export function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/**
 * Envía un mensaje al chat de admin configurado. Nunca lanza: si falta config
 * o la llamada a la Bot API falla, se loguea y no-opea.
 */
export async function sendTelegramMessage(text: string, opts?: { photoUrl?: string }): Promise<void> {
    if (!BOT_TOKEN || !CHAT_ID) {
        if (!warnedMissingConfig) {
            console.warn("[telegram] TELEGRAM_BOT_TOKEN/TELEGRAM_ADMIN_CHAT_ID no configurados; notificaciones desactivadas.");
            warnedMissingConfig = true;
        }
        return;
    }

    try {
        const usePhoto = !!opts?.photoUrl;
        const method = usePhoto ? "sendPhoto" : "sendMessage";
        const body = usePhoto
            ? { chat_id: CHAT_ID, photo: opts!.photoUrl, caption: text, parse_mode: "HTML" }
            : { chat_id: CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true };

        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) {
            console.error("[telegram] Envío falló:", res.status, await res.text().catch(() => ""));
        }
    } catch (e) {
        console.error("[telegram] Error de red enviando notificación:", e);
    }
}

// ─── Builders por tipo de evento ────────────────────────────────────────────

export async function notifyNewUser(params: {
    name: string;
    username: string;
    email: string;
    image?: string | null;
    provider: "google" | "credentials";
    ip: string;
}) {
    const providerLabel = params.provider === "google" ? "Google" : "Credenciales";
    const text = [
        `🆕 <b>Nuevo usuario registrado</b> (${providerLabel})`,
        `👤 ${escapeHtml(params.name)} · @${escapeHtml(params.username)}`,
        `✉️ ${escapeHtml(params.email)}`,
        `🌐 IP: <code>${escapeHtml(params.ip)}</code>`,
    ].join("\n");
    await sendTelegramMessage(text, { photoUrl: params.image ?? undefined });
}

export async function notifyNewEvent(params: {
    eventId: string;
    slug: string;
    title: string;
    mode: string;
    ownerUsername: string;
    ownerEmail: string;
}) {
    const text = [
        `📅 <b>Evento nuevo creado</b> (${escapeHtml(params.mode)})`,
        `${escapeHtml(params.title)}`,
        `👤 @${escapeHtml(params.ownerUsername)} · ${escapeHtml(params.ownerEmail)}`,
        `🔗 <a href="${BASE_URL}/admin/events/${params.eventId}">Ver en el panel</a>`,
    ].join("\n");
    await sendTelegramMessage(text);
}

export async function notifyPublicationRequested(params: {
    eventId: string;
    title: string;
    requestedByUsername: string;
}) {
    const text = [
        `📤 <b>Solicitud de publicación</b>`,
        `${escapeHtml(params.title)}`,
        `👤 Solicitado por @${escapeHtml(params.requestedByUsername)}`,
        `🔗 <a href="${BASE_URL}/admin/reviews/${params.eventId}">Revisar</a>`,
    ].join("\n");
    await sendTelegramMessage(text);
}

export async function notifyReportCreated(params: {
    reportId: string;
    eventId: string;
    eventTitle: string;
    reason: string;
    reporterUsername: string;
}) {
    const text = [
        `🚩 <b>Reporte de contenido</b> (${escapeHtml(params.reason)})`,
        `Evento: ${escapeHtml(params.eventTitle)}`,
        `👤 Reportado por @${escapeHtml(params.reporterUsername)}`,
        `🔗 <a href="${BASE_URL}/admin/reports">Ver reportes</a>`,
    ].join("\n");
    await sendTelegramMessage(text);
}

export async function notifyBugReport(params: {
    reportId: string;
    title: string;
    severity: string;
    pageUrl: string;
    reporterUsername: string;
}) {
    const text = [
        `🐞 <b>Bug report</b> (${escapeHtml(params.severity)})`,
        `${escapeHtml(params.title)}`,
        `📍 ${escapeHtml(params.pageUrl)}`,
        `👤 @${escapeHtml(params.reporterUsername)}`,
        `🔗 <a href="${BASE_URL}/admin/bugs/${params.reportId}">Ver reporte</a>`,
    ].join("\n");
    await sendTelegramMessage(text);
}

export async function notifyNewSupportChat(params: {
    chatId: string;
    userName: string;
    userUsername: string;
}) {
    const text = [
        `💬 <b>Ticket de soporte nuevo</b>`,
        `👤 ${escapeHtml(params.userName)} · @${escapeHtml(params.userUsername)}`,
        `🔗 <a href="${BASE_URL}/admin/chats/${params.chatId}">Abrir chat</a>`,
    ].join("\n");
    await sendTelegramMessage(text);
}

export async function notifyNewSupportMessage(params: {
    chatId: string;
    userName: string;
    preview: string;
}) {
    const text = [
        `💬 <b>Mensaje de soporte</b> de ${escapeHtml(params.userName)}`,
        `"${escapeHtml(params.preview.slice(0, 200))}"`,
        `🔗 <a href="${BASE_URL}/admin/chats/${params.chatId}">Responder</a>`,
    ].join("\n");
    await sendTelegramMessage(text);
}

export async function notifyVoteMilestone(params: {
    eventId: string;
    slug: string;
    title: string;
    threshold: number;
    count: number;
}) {
    const text = [
        `📈 <b>Hito de votación: ${params.threshold}+ votos</b>`,
        `${escapeHtml(params.title)} (total: ${params.count})`,
        `🔗 <a href="${BASE_URL}/admin/events/${params.eventId}">Ver evento</a>`,
    ].join("\n");
    await sendTelegramMessage(text);
}
