import { NextRequest, NextResponse } from "next/server";
import { list, del, type ListBlobResult } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Red de seguridad: barre los objetos bajo `events/` y borra los que pertenecen a
// eventos que ya no existen en BD (huérfanos por fallos del borrado inline o por
// pruebas antiguas). El borrado normal ya se hace inline al eliminar evento/usuario.
//
// Acotado por ejecución para no exceder el tiempo de la función serverless. Como
// los huérfanos se borran al encontrarlos, sucesivas ejecuciones convergen.
const MAX_BLOBS_PER_RUN = 3000;

export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let cursor: string | undefined = undefined;
    let processed = 0;
    const orphanUrls: string[] = [];
    const eventExists = new Map<string, boolean>(); // cache eventId → existe

    do {
        const page: ListBlobResult = await list({ prefix: "events/", cursor, limit: 1000 });
        for (const b of page.blobs) {
            processed++;
            const m = b.pathname.match(/^events\/([^/]+)\//);
            if (!m) continue;
            const eventId = m[1];
            let exists = eventExists.get(eventId);
            if (exists === undefined) {
                exists = (await prisma.event.count({ where: { id: eventId } })) > 0;
                eventExists.set(eventId, exists);
            }
            if (!exists) orphanUrls.push(b.url);
        }
        cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor && processed < MAX_BLOBS_PER_RUN);

    let deleted = 0;
    for (let i = 0; i < orphanUrls.length; i += 100) {
        const batch = orphanUrls.slice(i, i + 100);
        try {
            await del(batch);
            deleted += batch.length;
        } catch (e) {
            console.error("[blob-gc] del falló:", e);
        }
    }

    return NextResponse.json({ processed, orphans: orphanUrls.length, deleted, at: new Date().toISOString() });
}
