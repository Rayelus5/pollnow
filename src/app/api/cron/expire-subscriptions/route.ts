import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Usuarios con suscripción manual (sin Stripe) cuya fecha de fin ya pasó
    const result = await prisma.user.updateMany({
        where: {
            subscriptionStatus: "active",
            stripeSubscriptionId: null,
            subscriptionEndDate: { lt: now },
        },
        data: {
            subscriptionStatus: "free",
            stripePriceId: null,
            subscriptionEndDate: null,
        },
    });

    return NextResponse.json({ expired: result.count, at: now.toISOString() });
}
