// Backfill idempotente de `User.image`: migra a Vercel Blob los avatares que
// hoy son un "hotlink" a Google (lh3.googleusercontent.com, causa de 429 por
// exceso de peticiones) o un data-URI base64 crudo (bug histórico de
// ProfileForm.tsx, ya corregido). Continúa ante errores individuales.
//
// Uso: npx dotenv -e .env node scripts/backfill-user-avatars.mjs

import { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import sharp from "sharp";

const prisma = new PrismaClient();

const MAX_DIMENSION = 800;
const WEBP_QUALITY = 82;

async function optimizeToWebp(buffer) {
    return sharp(buffer)
        .rotate()
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
}

async function getBufferFor(image) {
    if (image.startsWith("data:")) {
        const base64 = image.split(",")[1] ?? "";
        return Buffer.from(base64, "base64");
    }
    const res = await fetch(image);
    if (!res.ok) throw new Error(`HTTP ${res.status} descargando ${image}`);
    return Buffer.from(await res.arrayBuffer());
}

async function main() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { image: { startsWith: "https://lh3.googleusercontent.com" } },
                { image: { startsWith: "data:" } },
            ],
        },
        select: { id: true, username: true, image: true },
    });

    console.log(`Encontrados ${users.length} usuarios a migrar.`);

    let migrated = 0;
    let failed = 0;

    for (const user of users) {
        try {
            const buffer = await getBufferFor(user.image);
            const optimized = await optimizeToWebp(buffer);
            const key = `users/${user.id}/${crypto.randomUUID()}.webp`;
            const blob = await put(key, optimized, {
                access: "public",
                contentType: "image/webp",
                addRandomSuffix: false,
                cacheControlMaxAge: 60 * 60 * 24 * 365,
            });

            await prisma.user.update({ where: { id: user.id }, data: { image: blob.url } });

            migrated++;
            console.log(`✓ @${user.username} (${user.id}) → ${blob.url}`);
        } catch (e) {
            failed++;
            console.error(`✗ @${user.username} (${user.id}) falló:`, e.message);
        }
    }

    console.log(`\nBackfill completado: ${migrated} migrados, ${failed} fallidos, de ${users.length} totales.`);
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error("Error en backfill:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
