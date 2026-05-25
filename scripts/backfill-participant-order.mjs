// Backfill idempotente del campo `order` de Participant.
// Por cada evento, asigna order = 0..n-1 según el orden estable actual
// (order asc, createdAt asc, id asc). Seguro de ejecutar varias veces.
//
// Uso: npx dotenv -e .env node scripts/backfill-participant-order.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const events = await prisma.event.findMany({ select: { id: true } });
    let total = 0;

    for (const ev of events) {
        const parts = await prisma.participant.findMany({
            where: { eventId: ev.id },
            orderBy: [{ order: "asc" }, { createdAt: "asc" }, { id: "asc" }],
            select: { id: true },
        });

        for (let i = 0; i < parts.length; i++) {
            await prisma.participant.update({
                where: { id: parts[i].id },
                data: { order: i },
            });
        }
        total += parts.length;
    }

    console.log(`Backfill completado: ${events.length} eventos, ${total} nominados ordenados.`);
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error("Error en backfill:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
