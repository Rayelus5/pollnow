// src/lib/user-avatar.ts
//
// Auto-alojamiento del avatar de usuario en Vercel Blob. Antes, los avatares
// de Google se "hotlinkeaban" directo a lh3.googleusercontent.com (Google
// empezó a devolver 429 por exceso de peticiones) y los subidos manualmente
// se guardaban como base64 crudo en Postgres. Mismo patrón que
// src/lib/participant-image.ts, sin necesidad de un eventId.

import { put, del } from "@vercel/blob";
import { optimizeToWebp } from "@/lib/participant-image";
import { isBlobUrl } from "@/lib/drawing-storage";

export type StoredUserAvatar = { url: string };

/** Optimiza y sube un avatar nuevo a Vercel Blob. No borra nada. */
export async function storeUserAvatar(userId: string, buffer: Buffer): Promise<StoredUserAvatar> {
    const optimized = await optimizeToWebp(buffer);
    const key = `users/${userId}/${crypto.randomUUID()}.webp`;
    const blob = await put(key, optimized, {
        access: "public",
        contentType: "image/webp",
        addRandomSuffix: false,
        cacheControlMaxAge: 60 * 60 * 24 * 365, // key con uuid único: seguro cachear "para siempre"
    });
    return { url: blob.url };
}

/**
 * Optimiza y sube un avatar, y borra el anterior (si lo había y es distinto).
 * Best-effort: si el borrado falla no interrumpe el flujo.
 */
export async function replaceUserAvatar(
    userId: string,
    oldImageUrl: string | null | undefined,
    buffer: Buffer
): Promise<StoredUserAvatar> {
    const stored = await storeUserAvatar(userId, buffer);
    if (oldImageUrl && isBlobUrl(oldImageUrl) && oldImageUrl !== stored.url) {
        try {
            await del(oldImageUrl);
        } catch (e) {
            console.error("[user-avatar] borrado del avatar anterior falló (ignorado):", e);
        }
    }
    return stored;
}
