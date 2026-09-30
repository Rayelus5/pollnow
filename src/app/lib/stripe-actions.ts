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

/**
 * Devuelve un `customerId` de Stripe válido para el usuario. Si el guardado en
 * BD ya no existe en Stripe (reset de datos de test, cuenta/API key distinta,
 * borrado manual en el dashboard...), Stripe responde `resource_missing` al
 * usarlo — en vez de dejar que ese error rompa el checkout, se detecta aquí y
 * se crea un customer nuevo, actualizando la BD para no repetir el problema.
 */
async function getOrCreateValidCustomerId(
    userId: string,
    storedCustomerId: string | null,
    email: string,
    name?: string | null
): Promise<string> {
    if (storedCustomerId) {
        try {
            const customer = await stripe.customers.retrieve(storedCustomerId);
            if (!customer.deleted) return storedCustomerId;
        } catch (e) {
            console.warn(`[stripe] Customer ${storedCustomerId} no encontrado en Stripe, creando uno nuevo:`, e instanceof Error ? e.message : e);
        }
    }

    const customer = await stripe.customers.create({
        email,
        name: name || undefined,
        metadata: { userId },
    });
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });
    return customer.id;
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

    const BASE_URL = getBaseUrl();
    let redirectUrl: string | null = null; // Variable para guardar la URL y redirigir AL FINAL

    try {
        // A. Obtener o crear Customer ID (autocura si el guardado en BD ya no existe en Stripe)
        const customerId = await getOrCreateValidCustomerId(
            session.user.id,
            user.stripeCustomerId,
            user.email,
            session.user.name
        );

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
        // Si el customer guardado ya no existe en Stripe (reset de test, borrado
        // manual...), no hay nada que gestionar en el portal — mejor avisar claro
        // que dejar que Stripe devuelva un `resource_missing` genérico.
        let customerMissing = false;
        try {
            const customer = await stripe.customers.retrieve(user.stripeCustomerId);
            customerMissing = customer.deleted === true;
        } catch {
            customerMissing = true;
        }
        if (customerMissing) {
            return { error: "Tu suscripción ya no existe en Stripe. Contacta con soporte si crees que es un error." };
        }

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