import Pusher from "pusher";
import PusherJs from "pusher-js";

// ── Servidor (solo se instancia en contexto Node.js) ─────────────────────────
export const pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
});

// ── Tipos de eventos Pusher ───────────────────────────────────────────────────
export const PUSHER_EVENTS = {
    COLLABORATOR_JOINED: "collaborator-joined",
    COLLABORATOR_LEFT: "collaborator-left",
    PERMISSIONS_UPDATED: "permissions-updated",
    INVITATION_SENT: "invitation-sent",
    DATA_CHANGED: "data-changed",
} as const;

// ── Canales privados ──────────────────────────────────────────────────────────
export function eventChannel(eventId: string) {
    return `private-event-${eventId}`;
}

export function userChannel(userId: string) {
    return `private-user-${userId}`;
}

// ── Cliente (singleton, solo en browser) ─────────────────────────────────────
let _pusherClient: PusherJs | null = null;

export function getPusherClient(): PusherJs {
    if (typeof window === "undefined") {
        throw new Error("getPusherClient() solo puede llamarse en el navegador");
    }
    if (!_pusherClient) {
        _pusherClient = new PusherJs(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
            authEndpoint: "/api/pusher/auth",
        });
    }
    return _pusherClient;
}
