// app/api/admin/users/batch/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const { allowed, retryAfter } = rateLimit(`admin:users:batch:${session.user.id}`, 30);
    if (!allowed) {
        return NextResponse.json(
            { error: "Demasiadas peticiones." },
            { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
    }

    try {
        const body = await req.json();
        const { action, ids, role, ban, plan } = body as {
            action: string;
            ids: string[];
            role?: string;
            ban?: boolean;
            plan?: string;
        };

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No se recibieron ids." }, { status: 400 });
        }

        if (action === "delete") {
            await prisma.user.deleteMany({ where: { id: { in: ids } } });
            return NextResponse.json({ success: true });
        }

        if (action === "ban") {
            if (typeof ban !== "boolean") {
                return NextResponse.json({ error: "Falta parámetro ban." }, { status: 400 });
            }
            await prisma.user.updateMany({ where: { id: { in: ids } }, data: { ipBan: ban } });
            return NextResponse.json({ success: true });
        }

        if (action === "setRole") {
            if (!role) return NextResponse.json({ error: "Falta role." }, { status: 400 });
            await prisma.user.updateMany({ where: { id: { in: ids } }, data: { role } });
            return NextResponse.json({ success: true });
        }

        if (action === "setPlan") {
            // plan puede ser "free" | "premium" | "plus" | "unlimited"
            // Ajusta price IDs a tus constantes PLANS
            const PRICE_MAP: Record<string, string | null> = {
                free: null,
                premium: process.env.PRICE_PREMIUM_ID ?? null,
                plus: process.env.PRICE_PLUS_ID ?? null,
                unlimited: process.env.PRICE_UNLIMITED_ID ?? null,
            };

            if (!plan || !(plan in PRICE_MAP)) {
                return NextResponse.json({ error: "Plan no válido." }, { status: 400 });
            }

            const stripePriceId = PRICE_MAP[plan];
            const subscriptionStatus = plan === "free" ? "free" : "active";

            await prisma.user.updateMany({
                where: { id: { in: ids } },
                data: { stripePriceId, subscriptionStatus },
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Acción no soportada." }, { status: 400 });
    } catch (err) {
        console.error("Error batch admin users:", err);
        return NextResponse.json({ error: "Error interno." }, { status: 500 });
    }
}