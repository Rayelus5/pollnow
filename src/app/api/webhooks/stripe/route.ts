import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
    apiVersion: "2024-12-18.acacia" as any,
});

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req: Request) {
    const headersList = await headers();
    const signature = headersList.get("Stripe-Signature") as string;

    if (!signature) return new NextResponse("Missing Stripe Signature", { status: 400 });

    let buffer: Buffer;
    try {
        const rawBody = await req.arrayBuffer();
        buffer = Buffer.from(rawBody);
    } catch (error) {
        return new NextResponse("Failed to read body", { status: 500 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(buffer, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (error: any) {
        console.error("⚠️ Webhook Signature Error:", error.message);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    try {
        const session = event.data.object as Stripe.Checkout.Session;

        // --- CASO 1: PAGO COMPLETADO ---
        if (event.type === "checkout.session.completed") {
            const appUserId = session.metadata?.userId;
            const subscriptionId = session.subscription as string;
            const customerId = session.customer as string;

            if (!subscriptionId || !customerId || !appUserId) {
                return new NextResponse("Missing essential IDs", { status: 400 });
            }

            // Recuperar detalles (incluyendo cancel_at_period_end)
            const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
            const priceId = subscription.items.data[0]?.price.id;

            await prisma.user.update({
                where: { id: appUserId },
                data: {
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscriptionId,
                    stripePriceId: priceId,
                    subscriptionStatus: "active",
                    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
                    cancelAtPeriodEnd: subscription.cancel_at_period_end, // <--- NUEVO
                },
            });
        }

        // --- CASO 2: SUSCRIPCIÓN ACTUALIZADA (RENOVACIÓN O CANCELACIÓN) ---
        if (event.type === "customer.subscription.updated") {
            const subscription = event.data.object as any;
            const customerId = subscription.customer as string;

            const userToUpdate = await prisma.user.findUnique({
                where: { stripeCustomerId: customerId },
                select: { id: true }
            });

            if (userToUpdate) {
                const priceId = subscription.items.data[0]?.price.id;

                await prisma.user.update({
                    where: { id: userToUpdate.id },
                    data: {
                        stripePriceId: priceId,
                        subscriptionStatus: subscription.status,
                        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
                        cancelAtPeriodEnd: subscription.cancel_at_period_end, // <--- NUEVO
                    },
                });
            }
        }

        // --- CASO 3: SUSCRIPCIÓN ELIMINADA (FINALIZADA REALMENTE) ---
        if (event.type === "customer.subscription.deleted") {
            const customerId = session.customer as string;
            const userToUpdate = await prisma.user.findUnique({
                where: { stripeCustomerId: customerId },
                select: { id: true }
            });

            if (userToUpdate) {
                await prisma.user.update({
                    where: { id: userToUpdate.id },
                    data: {
                        subscriptionStatus: "free",
                        stripePriceId: null,
                        stripeSubscriptionId: null,
                        subscriptionEndDate: null,
                        cancelAtPeriodEnd: false, // <--- RESET
                    },
                });
            }
        }

        return new NextResponse("OK", { status: 200 });

    } catch (error: any) {
        console.error("🔥 CRITICAL WEBHOOK ERROR:", error);
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}