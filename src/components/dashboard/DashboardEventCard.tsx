"use client";

import { useState, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import clsx from "clsx";

type DashboardEventCardProps = {
    event: {
        id: string;
        title: string;
        description: string | null;
        isPublic: boolean;
        createdAt: Date;
        status: "DRAFT" | "PENDING" | "APPROVED" | "DENIED";
        _count: {
            polls: number;
            participants: number;
        };
    };
};

export default function DashboardEventCard({ event }: DashboardEventCardProps) {
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);

    const handleClick = (e: MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (isNavigating) return;
        setIsNavigating(true);
        router.push(`/dashboard/event/${event.id}`);
    };

    const visibilityLabel = event.isPublic ? "Público" : "Privado";
    const visibilityClass = event.isPublic
        ? "bg-green-900/30 text-green-400"
        : "bg-yellow-900/30 text-yellow-400";

    return (
        <div
            onClick={handleClick}
            className="relative group bg-neutral-900/50 border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-neutral-900 transition-all cursor-pointer overflow-hidden"
        >
            {/* Contenido normal */}
            <div className={clsx(isNavigating && "opacity-40")}>
                <div className="flex flex-col justify-between">
                    <div className="min-h-40 max-h-40">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-2 items-center">
                                <div
                                    className={clsx(
                                        "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                                        visibilityClass
                                    )}
                                >
                                    {visibilityLabel}
                                </div>

                                {event.status !== "DRAFT" && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-gray-300 ${event.status === "APPROVED" ? "bg-green-500/10" : event.status === "DENIED" ? "bg-red-500/10" : event.status === "PENDING" ? "bg-yellow-500/10" : "bg-gray-800/30"}`}>
                                        {event.status === "PENDING" && "En revisión"}
                                        {event.status === "APPROVED" && "Aprobado"}
                                        {event.status === "DENIED" && "Rechazado"}
                                    </span>
                                )}
                                
                            </div>
                            <span className="text-gray-500 text-xs">
                                {formatDistanceToNow(event.createdAt, {
                                    addSuffix: true,
                                    locale: es,
                                })}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors truncate">
                            {event.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-6 line-clamp-2 ">
                            {event.description || "Sin descripción"}
                        </p>
                    </div>

                    <div className="flex items-center justify-start gap-4 text-xs text-gray-500 font-mono border-t border-white/5 pt-4">
                        <div className="flex items-center gap-1">
                            <span className="text-white font-bold">{event._count.polls}</span>{" "}
                            Categorías
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-white font-bold">
                                {event._count.participants}
                            </span>{" "}
                            Nominados
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay de carga */}
            {isNavigating && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mb-3" />
                    <p className="text-xs text-gray-300">
                        Abriendo el panel del evento...
                    </p>
                </div>
            )}
        </div>
    );
}
