// src/lib/drawing-storage.ts
//
// Capa de abstracción ÚNICA para el almacenamiento de los dibujos (modo DIBUJO).
// Hoy usa Vercel Blob; migrar a Cloudflare R2 / S3 en el futuro = reescribir SOLO
// este archivo, sin tocar las rutas API ni los componentes.
//
// Requiere la env var `BLOB_READ_WRITE_TOKEN` (la añade el dueño del proyecto en
// Vercel / .env). Sin ella, `put`/`del` lanzan y la subida falla de forma controlada.

import { put, del } from "@vercel/blob";

export type StoredDrawing = {
    /** URL pública servible directamente (CDN de Vercel Blob). */
    url: string;
    /** Clave/identificador del objeto, guardado en DrawingSubmission.blobKey para poder borrarlo. */
    key: string;
};

/**
 * Sube el PNG de un dibujo y devuelve su URL pública + la key para futuras operaciones.
 * La key sigue el patrón `events/{eventId}/drawings/{submissionId}.png`.
 */
export async function putDrawing(buffer: Buffer | Uint8Array, key: string): Promise<StoredDrawing> {
    // Envolver en Blob: PutBody no acepta directamente Buffer<ArrayBufferLike>.
    const body = new Blob([buffer as BlobPart], { type: "image/png" });
    const blob = await put(key, body, {
        access: "public",
        contentType: "image/png",
        // El key ya es único (incluye el submissionId); no añadir sufijo aleatorio.
        addRandomSuffix: false,
    });
    return { url: blob.url, key };
}

/**
 * Borra un dibujo del almacenamiento. Acepta la key o la URL pública.
 * Tolerante a fallos: no lanza si el objeto ya no existe.
 */
export async function deleteDrawing(keyOrUrl: string): Promise<void> {
    try {
        await del(keyOrUrl);
    } catch (e) {
        console.error("[drawing-storage] deleteDrawing falló (ignorado):", e);
    }
}

/** Construye la key canónica de un dibujo dentro de un evento. */
export function drawingKey(eventId: string, submissionId: string): string {
    return `events/${eventId}/drawings/${submissionId}.png`;
}
