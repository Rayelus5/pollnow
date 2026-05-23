// src/lib/blob-cleanup.ts
//
// Limpieza de objetos en Vercel Blob al borrar eventos/usuarios. El onDelete:Cascade
// de Prisma solo borra filas en BD; los blobs (dibujos + imágenes de nominados
// re-alojadas) quedarían huérfanos. Hay que recoger sus URLs ANTES de borrar.

import { prisma } from "@/lib/prisma";
import { deleteDrawing, isBlobUrl } from "@/lib/drawing-storage";

/**
 * Recoge las URLs de Blob (dibujos + imágenes de nominados re-alojadas) de los
 * eventos indicados. Debe llamarse ANTES de borrar el evento/usuario (el cascade
 * elimina las filas y se perderían las referencias).
 */
export async function collectEventBlobUrls(
    scope: { eventId: string } | { userId: string } | { userIds: string[] }
): Promise<string[]> {
    const eventWhere =
        "eventId" in scope
            ? { eventId: scope.eventId }
            : "userId" in scope
                ? { event: { userId: scope.userId } }
                : { event: { userId: { in: scope.userIds } } };

    const [drawings, participants] = await Promise.all([
        prisma.drawingSubmission.findMany({ where: eventWhere, select: { imageUrl: true } }),
        prisma.participant.findMany({ where: eventWhere, select: { imageUrl: true } }),
    ]);

    return [
        ...drawings.map((d) => d.imageUrl),
        ...participants.map((p) => p.imageUrl ?? ""),
    ].filter((u) => isBlobUrl(u));
}

/** Borra los blobs en lotes de 100 (best-effort; nunca lanza). */
export async function deleteBlobsBatched(urls: string[]): Promise<void> {
    for (let i = 0; i < urls.length; i += 100) {
        await deleteDrawing(urls.slice(i, i + 100));
    }
}
