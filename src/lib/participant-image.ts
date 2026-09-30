// src/lib/participant-image.ts
//
// Capa de abstracción ÚNICA para optimizar y almacenar las imágenes de
// nominados/participantes. Toda imagen (subida manual, generada por IA o
// re-alojada desde "Buscar en internet") pasa por aquí antes de llegar a
// Vercel Blob: se redimensiona y se convierte a WebP para evitar el peso
// (y el "Fast Origin Transfer") de guardar base64 sin comprimir en la BD.
//
// Migrar de storage en el futuro (Cloudflare R2 / S3) = reescribir SOLO
// este archivo, sin tocar las rutas API ni los componentes.

import sharp from "sharp";
import { put, del } from "@vercel/blob";
import { isBlobUrl } from "@/lib/drawing-storage";

const MAX_DIMENSION = 800;
const WEBP_QUALITY = 82;
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Redimensiona (máx. 800px de lado) y re-codifica a WebP calidad 82. */
export async function optimizeToWebp(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
        .rotate() // aplica la orientación EXIF antes de stripear metadata
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
}

/** Key canónica de una imagen de nominado dentro de un evento. */
export function participantImageKey(eventId: string, id: string = crypto.randomUUID()): string {
    return `events/${eventId}/participants/${id}.webp`;
}

export type StoredParticipantImage = {
    url: string;
    originalSize: number;
    optimizedSize: number;
};

/** Optimiza y sube una imagen nueva a Vercel Blob. No borra nada. */
export async function storeParticipantImage(eventId: string, buffer: Buffer): Promise<StoredParticipantImage> {
    const optimized = await optimizeToWebp(buffer);
    const key = participantImageKey(eventId);
    const blob = await put(key, optimized, {
        access: "public",
        contentType: "image/webp",
        addRandomSuffix: false,
        // La key incluye un uuid nuevo por imagen: nunca se reescribe, así que
        // cachear "para siempre" es seguro.
        cacheControlMaxAge: ONE_YEAR_SECONDS,
    });
    return { url: blob.url, originalSize: buffer.byteLength, optimizedSize: optimized.byteLength };
}

/**
 * Optimiza y sube una imagen, y borra el blob anterior (si lo había y es
 * distinto del nuevo). Best-effort: si el borrado falla no interrumpe el flujo.
 */
export async function replaceParticipantImage(
    eventId: string,
    oldImageUrl: string | null | undefined,
    buffer: Buffer
): Promise<StoredParticipantImage> {
    const stored = await storeParticipantImage(eventId, buffer);
    if (oldImageUrl && isBlobUrl(oldImageUrl) && oldImageUrl !== stored.url) {
        try {
            await del(oldImageUrl);
        } catch (e) {
            console.error("[participant-image] no se pudo borrar el blob anterior (ignorado):", e);
        }
    }
    return stored;
}

/** True si la imagen ya está optimizada (Blob + WebP) y no necesita reprocesarse. */
export function isAlreadyOptimized(imageUrl: string | null | undefined): boolean {
    return !!imageUrl && isBlobUrl(imageUrl) && imageUrl.split("?")[0].endsWith(".webp");
}
