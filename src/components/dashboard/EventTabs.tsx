"use client";

import { useState, useMemo } from "react";
import { clsx } from "clsx";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

type EventTabsProps = {
  stats: React.ReactNode;
  settings: React.ReactNode;
  participants: React.ReactNode;
  polls: React.ReactNode;
};

type TabId = "stats" | "settings" | "participants" | "polls";

export default function EventTabs({
  stats,
  settings,
  participants,
  polls,
}: EventTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("settings");

  const tabs = [
    { id: "settings", label: "Configuración" as const },
    { id: "participants", label: "Nominados" as const },
    { id: "polls", label: "Categorías" as const },
    { id: "stats", label: "Estadísticas" as const },
  ] as const;

  const tourOptions = useMemo(
    () => ({
      defaultStepOptions: {
        cancelIcon: {
          enabled: true,
        },
        classes:
          "bg-neutral-900 border-2 border-white/10 text-sm text-gray-100 rounded-xl shadow-xl",
        scrollTo: { behavior: "smooth", block: "center" as const },
      },
      useModalOverlay: true,
    }),
    []
  );

  const handleStartTour = () => {
    if (typeof window === "undefined" || !Shepherd) return;

    const tour = new Shepherd.Tour(tourOptions);

    // 1) WELCOME
    tour.addStep({
      id: "welcome",
      attachTo: {
        element: ".tour-event-header",
        on: "bottom" as const,
      },
      title: "Bienvenido a tu evento ✨",
      text: [
        "Aquí gestionas todo: ajustes, nominados, categorías y estadísticas.",
      ],
      buttons: [
        {
          text: "Saltar",
          classes: "shepherd-button-secondary",
          action() {
            tour.cancel();
          },
        },
        {
          text: "Siguiente",
          classes: "shepherd-button-primary",
          action() {
            tour.next();
          },
        },
      ],
    });

    // 2) TABS
    tour.addStep({
      id: "tabs",
      attachTo: {
        element: ".tour-event-tabs",
        on: "bottom" as const,
      },
      title: "Pestañas del evento",
      text: [
        "Usa estas pestañas para navegar entre configuración, nominados, categorías y estadísticas.",
      ],
      buttons: [
        {
          text: "Atrás",
          classes: "shepherd-button-secondary",
          action() {
            tour.back();
          },
        },
        {
          text: "Siguiente",
          classes: "shepherd-button-primary",
          action() {
            tour.next();
          },
        },
      ],
    });

    // 3) SETTINGS
    tour.addStep({
      id: "settings",
      beforeShowPromise: () =>
        new Promise<void>((resolve) => {
          setActiveTab("settings");
          setTimeout(() => resolve(), 350);
        }),
      attachTo: {
        element: ".tour-event-settings-card",
        on: "right" as const,
      },
      title: "Configura tu gala",
      text: [
        "Aquí defines el nombre del evento, descripción, fecha de la gala y si será público o privado.",
      ],
      buttons: [
        {
          text: "Atrás",
          classes: "shepherd-button-secondary",
          action() {
            tour.back();
          },
        },
        {
          text: "Siguiente",
          classes: "shepherd-button-primary",
          action() {
            tour.next();
          },
        },
      ],
    });

    // 4) PARTICIPANTS
    tour.addStep({
      id: "participants",
      beforeShowPromise: () =>
        new Promise<void>((resolve) => {
          setActiveTab("participants");
          setTimeout(() => resolve(), 350);
        }),
      attachTo: {
        element: ".tour-participants-section",
        on: "top" as const,
      },
      title: "Añade nominados",
      text: [
        "En esta sección gestionas todos los participantes de tu gala. Puedes crear, editar, subir fotos o generarlas con IA.",
      ],
      buttons: [
        {
          text: "Atrás",
          classes: "shepherd-button-secondary",
          action() {
            tour.back();
          },
        },
        {
          text: "Siguiente",
          classes: "shepherd-button-primary",
          action() {
            tour.next();
          },
        },
      ],
    });

    // 5) POLLS
    tour.addStep({
      id: "polls",
      beforeShowPromise: () =>
        new Promise<void>((resolve) => {
          setActiveTab("polls");
          setTimeout(() => resolve(), 350);
        }),
      attachTo: {
        element: ".tour-polls-section",
        on: "top" as const,
      },
      title: "Crea tus categorías",
      text: [
        "Aquí creas las categorías de votación (Mejor Actor, Mejor Juego, etc.), eliges el tipo de voto y qué nominados participan.",
      ],
      buttons: [
        {
          text: "Atrás",
          classes: "shepherd-button-secondary",
          action() {
            tour.back();
          },
        },
        {
          text: "Siguiente",
          classes: "shepherd-button-primary",
          action() {
            tour.next();
          },
        },
      ],
    });

    // 6) STATS
    tour.addStep({
      id: "stats",
      beforeShowPromise: () =>
        new Promise<void>((resolve) => {
          setActiveTab("stats");
          setTimeout(() => resolve(), 350);
        }),
      attachTo: {
        element: ".tour-stats-section",
        on: "top" as const,
      },
      title: "Mira las estadísticas",
      text: [
        "Cuando empiecen a votar, aquí verás el rendimiento de cada categoría y, con los planes avanzados, incluso quién ha votado.",
      ],
      buttons: [
        {
          text: "Atrás",
          classes: "shepherd-button-secondary",
          action() {
            tour.back();
          },
        },
        {
          text: "Cerrar",
          classes: "shepherd-button-primary",
          action() {
            tour.next();
          },
        },
      ],
    });

    // 7) MENSAJE FINAL — GRACIAS
    tour.addStep({
      id: "thanks",
      title: "¡Gracias por usar la guía! 🎉",
      text: [
        "Ya conoces todas las funciones principales de tu evento.",
        "Puedes repetir esta guía cuando quieras desde el botón 'Guía interactiva'."
      ],
      buttons: [
        {
          text: "Cerrar",
          classes: "shepherd-button-primary",
          action() {
            tour.cancel();
          },
        },
      ],
    });


    tour.start();
  };

  return (
    <div>
      {/* TABS + botón de guía */}
      <div className="flex border-b-2 border-white/10 mb-8 overflow-x-auto tour-event-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "px-6 py-3 text-sm font-bold transition-colors relative whitespace-nowrap cursor-pointer",
              activeTab === tab.id
                ? "text-blue-500"
                : "text-gray-400 hover:text-white"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        ))}

        <div className="flex items-center px-3 ml-auto">
          <button
            type="button"
            onClick={handleStartTour}
            className="px-3 py-2 text-[11px] rounded-full border-2 border-blue-500/40 text-blue-300 hover:bg-blue-500/10 cursor-pointer flex items-center gap-1 whitespace-nowrap"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Guía interactiva
          </button>
        </div>
      </div>

      {/* CONTENIDO TABS */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "stats" && stats}
        {activeTab === "settings" && settings}
        {activeTab === "participants" && participants}
        {activeTab === "polls" && polls}
      </div>
    </div>
  );
}
