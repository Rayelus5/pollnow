import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { NextResponse } from "next/server";

// 1. Inicializamos con la versión más reciente de la API
// Usamos 'as any' en apiVersion para evitar conflictos de tipado con versiones beta/nuevas
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
    apiVersion: "2024-12-18.acacia" as any,
});

// 2. Deshabilitar el parseo automático del body para que podamos leerlo como Buffer/Raw
export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req: Request) {
    // 1. OBTENER LA FIRMA
    // En Next.js 15+, headers() es asíncrono. Añadimos 'await'.
    const headersList = await headers();
    const signature = headersList.get("Stripe-Signature") as string;

    if (!signature) {
        console.error("❌ Webhook Error: Missing Stripe Signature header.");
        return new NextResponse("Missing Stripe Signature", { status: 400 });
    }

    // 2. LEER EL BODY COMO BUFFER (CRÍTICO PARA WEBHOOKS)
    let buffer: Buffer;
    try {
        const rawBody = await req.arrayBuffer();
        buffer = Buffer.from(rawBody);
    } catch (error) {
        console.error("❌ Error reading request body as buffer:", error);
        return new NextResponse("Failed to read body", { status: 500 });
    }

    let event: Stripe.Event;

    // 3. CONSTRUIR EL EVENTO PARA VALIDAR LA FIRMA
    try {
        event = stripe.webhooks.constructEvent(
            buffer, // Pasamos el buffer
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error("⚠️ Webhook Signature Error:", error.message);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    // 4. PROCESAR EL EVENTO
    try {
        const session = event.data.object as Stripe.Checkout.Session;

        // --- CASO 1: PAGO COMPLETADO ---
        if (event.type === "checkout.session.completed") {

            // El metadata contiene el userId de la base de datos de tu aplicación
            const appUserId = session.metadata?.userId;
            const subscriptionId = session.subscription as string;
            const customerId = session.customer as string;

            if (!subscriptionId || !customerId || !appUserId) {
                console.error("❌ Error: Faltan IDs esenciales en checkout.session.completed.", { subscriptionId, customerId, appUserId });
                return new NextResponse("Missing essential IDs", { status: 400 });
            }

            console.log(`🔄 Procesando suscripción: ${subscriptionId} (App User ID: ${appUserId})`);

            // Recuperar detalles de la suscripción de Stripe
            // Usamos 'as any' para evitar conflictos de tipado con Response<Subscription>
            const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

            const priceId = subscription.items.data[0]?.price.id;

            if (!priceId) {
                console.error("❌ Error: La suscripción no tiene items/precios.");
                return new NextResponse("Invalid subscription data", { status: 400 });
            }

            // Actualizar Base de Datos
            console.log(`💾 Guardando en DB... Precio: ${priceId}`);

            const updatedUser = await prisma.user.update({
                where: { id: appUserId },
                data: {
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscriptionId,
                    stripePriceId: priceId,
                    subscriptionStatus: "active",
                    // Stripe usa segundos (unix timestamp), JS usa milisegundos
                    subscriptionEndDate: new Date(subscription.current_period_end * 1000),
                },
            });

            console.log(`✅ ÉXITO: Usuario ${updatedUser.email} actualizado a Premium.`);
        }

        // --- CASO 2: SUSCRIPCIÓN ACTUALIZADA ---
        // (Puede ocurrir por cambio de plan, renovación, etc.)
        if (event.type === "customer.subscription.updated") {
            // Forzamos el tipo 'any' para acceder a propiedades sin conflictos de TS
            const subscription = event.data.object as any;
            const customerId = subscription.customer as string;

            // Buscamos al usuario por el Customer ID de Stripe
            const userToUpdate = await prisma.user.findUnique({
                where: { stripeCustomerId: customerId },
                select: { id: true, email: true }
            });

            if (userToUpdate) {
                const priceId = subscription.items.data[0]?.price.id;

                if (!priceId) {
                    console.error(`❌ Error: La suscripción actualizada para ${userToUpdate.email} no tiene items/precios.`);
                    return new NextResponse("Invalid updated subscription data", { status: 400 });
                }

                await prisma.user.update({
                    where: { id: userToUpdate.id },
                    data: {
                        stripePriceId: priceId,
                        subscriptionStatus: subscription.status,
                        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
                    },
                });
                console.log(`✅ ÉXITO: Suscripción de ${userToUpdate.email} actualizada. Nuevo estado: ${subscription.status}`);
            }
        }


        // --- CASO 3: SUSCRIPCIÓN CANCELADA ---
        if (event.type === "customer.subscription.deleted") {
            const subscription = event.data.object as any;
            const customerId = subscription.customer as string;

            // Buscamos al usuario por el Customer ID de Stripe
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
                    },
                });
                console.log(`✅ ÉXITO: Usuario ${userToUpdate.id} ha sido marcado como Free.`);
            } else {
                console.error(`❌ Error: No se encontró usuario en DB con stripeCustomerId: ${customerId}`);
            }
        }

        return new NextResponse("OK", { status: 200 });

    } catch (error: any) {
        console.error("🔥 CRITICAL WEBHOOK ERROR:", error);
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}