'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

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
    let redirectUrl: string | null = null; // Variable para guardar la URL y redirigir AL FINAL

    try {
        // --- ESCENARIO 1: ACTUALIZACIÓN DE PLAN (YA ES PREMIUM) ---
        // Si ya tiene suscripción, lo enviamos al Portal para que gestione el cambio allí.
        // Esto cumple con el requisito de "Pasar por la pasarela" para confirmar cambios.
        if (user.stripeSubscriptionId && user.subscriptionStatus === 'active') {

            // creamos una sesión de portal que permite actualizar suscripciones
            const portalSession = await stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: `${BASE_URL}/dashboard/profile`,
                // si Stripe lo tiene habilitado, esto le lleva directo a "Update Plan"

                // flow_data: {
                //   type: 'subscription_update',
                //   subscription_update: { subscription: user.stripeSubscriptionId }
                // }
            });

            redirectUrl = portalSession.url;
        }
        // --- ESCENARIO 2: NUEVA SUSCRIPCIÓN (ES FREE) ---
        else {
            const checkoutSession = await stripe.checkout.sessions.create({
                customer: customerId,
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [{ price: priceId, quantity: 1 }],
                // Muestra el campo "Añadir código promocional" en la pasarela.
                // Los códigos se crean en el Dashboard (Catálogo de productos → Cupones).
                allow_promotion_codes: true,
                // Permite que Stripe actualice nombre/dirección del cliente desde el checkout.
                customer_update: { name: 'auto', address: 'auto' },
                billing_address_collection: 'auto',
                success_url: `${BASE_URL}/dashboard/profile?checkout_status=success`,
                cancel_url: `${BASE_URL}/premium?checkout_status=cancelled`,
                metadata: {
                    userId: session.user.id
                }
            });

            if (checkoutSession.url) {
                redirectUrl = checkoutSession.url;
            }
        }

    } catch (error) {
        console.error("Stripe Action Error:", error);
        return { error: "Error al conectar con la pasarela de pago." };
    }

    if (redirectUrl) {
        return redirectUrl;
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

    let redirectUrl: string | null = null;

    try {
        const BASE_URL = getBaseUrl();

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${BASE_URL}/dashboard/profile`,
        });

        redirectUrl = portalSession.url;
    } catch (error) {
        console.error("Stripe Portal Error:", error);
        return { error: "Error al abrir el portal." };
    }

    if (redirectUrl) {
        return redirectUrl;
    }
}