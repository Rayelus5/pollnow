'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { redirect } from "next/navigation";

// Inicialización de Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
});

function getBaseUrl() {
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    return 'http://localhost:3000';
}

// --- 1. GESTIÓN DE SUSCRIPCIONES (ALTA Y CAMBIO) ---
export async function createCheckoutSession(priceId: string) {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
        return { error: "No user session found." };
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            stripeCustomerId: true,
            email: true,
            stripeSubscriptionId: true,
            subscriptionStatus: true
        },
    });

    if (!user) {
        return { error: "User not found." };
    }

    // A. Obtener o crear Customer ID
    let customerId = user.stripeCustomerId;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: session.user.name || undefined,
            metadata: { userId: session.user.id }
        });
        customerId = customer.id;
        await prisma.user.update({ where: { id: session.user.id }, data: { stripeCustomerId: customerId } });
    }

    const BASE_URL = getBaseUrl();

    try {
        // --- ESCENARIO 1: ACTUALIZACIÓN DE PLAN (YA ES PREMIUM) ---
        // Si ya tiene una suscripción activa, no abrimos checkout, la actualizamos directamente.
        if (user.stripeSubscriptionId && user.subscriptionStatus === 'active') {

            // 1. Recuperar la suscripción de Stripe para ver qué items tiene
            const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
            const currentItem = subscription.items.data[0];

            // Si intenta suscribirse a lo mismo que ya tiene, no hacemos nada
            if (currentItem.price.id === priceId) {
                return { error: "Ya estás suscrito a este plan." };
            }

            // 2. Actualizar la suscripción existente (Swap Plan)
            // Esto cobra la diferencia o ajusta el crédito automáticamente
            await stripe.subscriptions.update(user.stripeSubscriptionId, {
                items: [{
                    id: currentItem.id,     // ID del item que vamos a cambiar
                    price: priceId,         // Nuevo precio (Plan)
                }],
                proration_behavior: 'always_invoice', // Generar factura por la diferencia ahora mismo
            });

            // 3. Redirigir al perfil con éxito (El webhook se encargará de actualizar la DB en segundo plano)
            redirect(`${BASE_URL}/dashboard/profile?updated=true`);
            return;
        }

        // --- ESCENARIO 2: NUEVA SUSCRIPCIÓN (ES FREE) ---
        // Si no tiene suscripción activa, creamos una sesión de Checkout nueva.
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${BASE_URL}/dashboard/profile?checkout_status=success`,
            cancel_url: `${BASE_URL}/premium?checkout_status=cancelled`,
            metadata: {
                userId: session.user.id
            }
        });

        if (checkoutSession.url) {
            redirect(checkoutSession.url);
        }

    } catch (error) {
        console.error("Stripe Action Error:", error);
        if ((error as any).digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        return { error: "Error al procesar la solicitud." };
    }
}

// --- 2. PORTAL DE CLIENTE (CANCELAR / FACTURAS) ---
export async function createCustomerPortalSession() {
    const session = await auth();
    if (!session?.user?.id) return;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    if (!user?.stripeCustomerId) {
        throw new Error("No tienes una suscripción activa para gestionar.");
    }

    try {
        const BASE_URL = getBaseUrl();

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${BASE_URL}/dashboard/profile`,
        });

        if (portalSession.url) {
            redirect(portalSession.url);
        }
    } catch (error) {
        console.error("Stripe Portal Error:", error);
        if ((error as any).digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        return { error: "Error al abrir el portal." };
    }
}