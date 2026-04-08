"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

// Shared Shepherd styles (same as EventTabs)
const DEFAULT_STEP_OPTIONS = {
    cancelIcon: { enabled: true },
    classes:
        "bg-neutral-900 border-2 border-white/10 text-sm text-gray-100 rounded-xl shadow-xl",
    scrollTo: { behavior: "smooth" as const, block: "center" as const },
};

const TOUR_OPTIONS = {
    defaultStepOptions: DEFAULT_STEP_OPTIONS,
    useModalOverlay: true,
};

/** Wait for a DOM element to appear (polls every 150ms, max 8s) */
function waitFor(selector: string, timeout = 8000): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector(selector)) return resolve();
        const t = setInterval(() => {
            if (document.querySelector(selector)) {
                clearInterval(t);
                clearTimeout(timer);
                resolve();
            }
        }, 150);
        const timer = setTimeout(() => {
            clearInterval(t);
            reject(new Error(`Timeout waiting for ${selector}`));
        }, timeout);
    });
}

// ─── Web tour (overview of the dashboard) ─────────────────────────────────────

function buildWebTour(router: ReturnType<typeof useRouter>): Shepherd.Tour {
    const tour = new Shepherd.Tour(TOUR_OPTIONS);

    tour.addStep({
        id: "web-welcome",
        attachTo: { element: ".tour-dashboard-header", on: "bottom" as const },
        title: "¡Bienvenido a POLLNOW! 👋",
        text: "Vamos a darte un tour rápido por tu panel de control y las funciones principales de la plataforma.",
        buttons: [
            { text: "Saltarme el tour", classes: "shepherd-button-secondary", action() { tour.cancel(); } },
            { text: "¡Vamos!", classes: "shepherd-button-primary", action() { tour.next(); } },
        ],
    });

    tour.addStep({
        id: "web-tabs",
        attachTo: { element: ".tour-dashboard-tabs", on: "bottom" as const },
        title: "Navegación del panel 🗂",
        text: "Desde estas pestañas accedes a tus Eventos, Notificaciones, Soporte y tu Perfil de usuario.",
        buttons: [
            { text: "Atrás", classes: "shepherd-button-secondary", action() { tour.back(); } },
            { text: "Siguiente", classes: "shepherd-button-primary", action() { tour.next(); } },
        ],
    });

    tour.addStep({
        id: "web-events",
        attachTo: { element: ".tour-events-section", on: "top" as const },
        title: "Tus Eventos 🎉",
        text: "Aquí aparecen todos los eventos que has creado. Cada tarjeta te lleva al panel de gestión de ese evento donde puedes configurarlo, añadir nominados, categorías y ver estadísticas.",
        buttons: [
            { text: "Atrás", classes: "shepherd-button-secondary", action() { tour.back(); } },
            { text: "Siguiente", classes: "shepherd-button-primary", action() { tour.next(); } },
        ],
    });

    tour.addStep({
        id: "web-create",
        attachTo: { element: ".tour-create-btn", on: "bottom" as const },
        title: "Crear un evento ✨",
        text: "Con este botón creas una nueva gala. Define el nombre, descripción y etiquetas. Podrás configurar todo lo demás una vez dentro del evento.",
        buttons: [
            { text: "Atrás", classes: "shepherd-button-secondary", action() { tour.back(); } },
            { text: "Siguiente", classes: "shepherd-button-primary", action() { tour.next(); } },
        ],
    });

    tour.addStep({
        id: "web-notifications",
        attachTo: { element: ".tour-dashboard-tabs", on: "bottom" as const },
        title: "Notificaciones 🔔",
        text: "POLLNOW te avisa cuando tu evento es aprobado, cuando alguien te invita a colaborar o cuando hay actividad importante. Las ves en la pestaña Notificaciones.",
        beforeShowPromise: () => new Promise<void>((resolve) => {
            const btn = document.querySelector<HTMLButtonElement>("[data-tour-tab='notifications']");
            if (btn) btn.click();
            setTimeout(resolve, 250);
        }),
        buttons: [
            {
                text: "Atrás", classes: "shepherd-button-secondary", action() {
                    const btn = document.querySelector<HTMLButtonElement>("[data-tour-tab='events']");
                    if (btn) btn.click();
                    setTimeout(() => tour.back(), 200);
                }
            },
            { text: "Siguiente", classes: "shepherd-button-primary", action() { tour.next(); } },
        ],
    });

    tour.addStep({
        id: "web-profile",
        attachTo: { element: ".tour-dashboard-tabs", on: "bottom" as const },
        title: "Tu perfil y suscripción 👤",
        text: "En «Mi Cuenta» puedes cambiar tu nombre, email, contraseña y gestionar tu suscripción Premium. También puedes ver los límites de tu plan actual.",
        beforeShowPromise: () => new Promise<void>((resolve) => {
            const btn = document.querySelector<HTMLButtonElement>("[data-tour-tab='profile']");
            if (btn) btn.click();
            setTimeout(resolve, 250);
        }),
        buttons: [
            {
                text: "Atrás", classes: "shepherd-button-secondary", action() {
                    const btn = document.querySelector<HTMLButtonElement>("[data-tour-tab='notifications']");
                    if (btn) btn.click();
                    setTimeout(() => tour.back(), 200);
                }
            },
            { text: "Siguiente", classes: "shepherd-button-primary", action() { tour.next(); } },
        ],
    });

    tour.addStep({
        id: "web-end",
        title: "¡Ya conoces el panel! 🚀",
        text: "Eso es todo. Ahora ya sabes moverte por POLLNOW. ¿Quieres aprender a crear tu primer evento desde cero?",
        buttons: [
            {
                text: "Cerrar", classes: "shepherd-button-secondary", action() {
                    const btn = document.querySelector<HTMLButtonElement>("[data-tour-tab='events']");
                    if (btn) btn.click();
                    tour.cancel();
                }
            },
            {
                text: "📖 Tutorial de evento", classes: "shepherd-button-primary", action() {
                    tour.cancel();
                    router.push("/help/create-event");
                }
            },
        ],
        beforeShowPromise: () => new Promise<void>((resolve) => {
            const btn = document.querySelector<HTMLButtonElement>("[data-tour-tab='events']");
            if (btn) btn.click();
            setTimeout(resolve, 250);
        }),
    });

    return tour;
}

// ─── Create-event guided tour ──────────────────────────────────────────────────

function buildCreateTour(): Shepherd.Tour {
    const tour = new Shepherd.Tour(TOUR_OPTIONS);


    tour.addStep({
        id: "create-welcome",
        attachTo: { element: ".tour-events-section", on: "top" as const },
        title: "Tutorial: crea tu primer evento 🎮",
        text: "Vamos a crear juntos un evento paso a paso. Sigue las instrucciones y haz clic cuando te lo indiquemos. ¡Es muy fácil!",
        buttons: [
            { text: "Cancelar", classes: "shepherd-button-secondary", action() { tour.cancel(); } },
            { text: "¡Empezamos!", classes: "shepherd-button-primary", action() { tour.next(); } },
        ],
    });

    tour.addStep({
        id: "create-point-btn",
        attachTo: { element: ".tour-create-btn", on: "bottom" as const },
        title: "Paso 1: nuevo evento 📝",
        text: 'Haz clic en <strong>«Nuevo Evento»</strong> para abrir el formulario de creación.',
        advanceOn: { selector: ".tour-create-btn", event: "click" },
        buttons: [
            { text: "Atrás", classes: "shepherd-button-secondary", action() { tour.back(); } },
        ],
    });

    tour.addStep({
        id: "create-modal-name",
        attachTo: { element: ".tour-modal-title", on: "bottom" as const },
        title: "Paso 2: ponle nombre a tu evento",
        text: 'Escribe el nombre de tu gala. Por ejemplo: <em>«Premios Videojuegos»</em>. Tiene que tener al menos 3 caracteres.',
        beforeShowPromise: () => waitFor(".tour-modal-title"),
        buttons: [
            { text: "Siguiente", classes: "shepherd-button-primary", action() { tour.next(); } },
        ],
    });

    tour.addStep({
        id: "create-modal-description",
        attachTo: { element: ".tour-modal-description", on: "top" as const },
        title: "Paso 3: describe tu gala",
        text: 'Opcional pero recomendado. Escribe de qué trata el evento para que los votantes entiendan el contexto.',
        beforeShowPromise: () => waitFor(".tour-modal-description"),
        buttons: [
            { text: "Atrás", classes: "shepherd-button-secondary", action() { tour.back(); } },
            { text: "Siguiente", classes: "shepherd-button-primary", action() { tour.next(); } },
        ],
    });

    tour.addStep({
        id: "create-modal-submit",
        attachTo: { element: ".tour-modal-submit", on: "top" as const },
        title: "Paso 4: ¡crea el evento! 🚀",
        text: 'Rellena el nombre y haz clic en <strong>«Crear Evento»</strong>. Una vez dentro del evento, pulsa el botón <strong>«Guía interactiva»</strong> para continuar el tour.',
        beforeShowPromise: () => waitFor(".tour-modal-submit"),
        buttons: [
            { text: "Atrás", classes: "shepherd-button-secondary", action() { tour.back(); } },
            { text: "¡Entendido!", classes: "shepherd-button-primary", action() { tour.complete(); } },
        ],
    });

    return tour;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardGuidedTour() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tourParam = searchParams.get("tour");

    useEffect(() => {
        if (!tourParam) return;
        if (typeof window === "undefined") return;

        let tour: Shepherd.Tour | null = null;

        const init = async () => {
            // Small delay to ensure DOM is ready
            await new Promise<void>(r => setTimeout(r, 400));

            if (tourParam === "web") {
                tour = buildWebTour(router);
            } else if (tourParam === "create") {
                tour = buildCreateTour();
            }

            if (tour) {
                tour.start();
                // Clean the URL param after starting
                const params = new URLSearchParams(window.location.search);
                params.delete("tour");
                const newUrl = params.toString()
                    ? `${window.location.pathname}?${params.toString()}`
                    : window.location.pathname;
                window.history.replaceState({}, "", newUrl);
            }
        };

        init();
        return () => { tour?.cancel(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tourParam]);

    // Direct trigger when the user is already on /dashboard (no URL navigation)
    useEffect(() => {
        const handler = async (e: Event) => {
            const type = (e as CustomEvent<string>).detail;

            // For the create tour, ensure the events tab is visible first
            if (type === "create") {
                const eventsBtn = document.querySelector<HTMLButtonElement>("[data-tour-tab='events']");
                if (eventsBtn) {
                    eventsBtn.click();
                    await new Promise<void>(r => setTimeout(r, 300));
                }
            }

            await new Promise<void>(r => setTimeout(r, 200));

            let tour: Shepherd.Tour | null = null;
            if (type === "web") tour = buildWebTour(router);
            else if (type === "create") tour = buildCreateTour();
            if (tour) tour.start();
        };

        window.addEventListener("pollnow:tour", handler);
        return () => window.removeEventListener("pollnow:tour", handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    return null;
}
