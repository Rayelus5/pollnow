// app/api/admin/events/batch/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const { allowed, retryAfter } = rateLimit(`admin:events:batch:${session.user.id}`, 30);
    if (!allowed) {
        return NextResponse.json(
            { error: "Demasiadas peticiones." },
            { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
    }

    try {
        const body = await req.json();
        const { action, ids, status } = body as {
            action: string;
            ids: string[];
            status?: string;
        };

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No se recibieron ids." }, { status: 400 });
        }

        if (action === "delete") {
            await prisma.$transaction([
                prisma.report.deleteMany({ where: { eventId: { in: ids } } }),
                prisma.moderationLog.deleteMany({ where: { eventId: { in: ids } } }),
                prisma.event.deleteMany({ where: { id: { in: ids } } }),
            ]);
            return NextResponse.json({ success: true });
        }

        if (action === "updateStatus") {
            if (!status) {
                return NextResponse.json({ error: "Falta el nuevo status." }, { status: 400 });
            }
            await prisma.event.updateMany({
                where: { id: { in: ids } },
                data: { status },
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Acción no soportada." }, { status: 400 });
    } catch (err) {
        console.error("Error batch admin events:", err);
        return NextResponse.json({ error: "Error interno." }, { status: 500 });
    }
}