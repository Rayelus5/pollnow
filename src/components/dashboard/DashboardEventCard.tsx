"use client";

import { useState, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import clsx from "clsx";
import { Users, Trophy, ListOrdered, CircleHelp, Palette } from "lucide-react";

type EventMode = "GALA" | "TIERLIST" | "PREGUNTAS" | "DIBUJO";

type DashboardEventCardProps = {
    event: {
        id: string;
        title: string;
        description: string | null;
        isPublic: boolean;
        createdAt: Date;
        status: "DRAFT" | "PENDING" | "APPROVED" | "DENIED";
        mode?: EventMode;
        _count: {
            polls: number;
            participants: number;
            tiers?: number;
            questions?: number;
            drawings?: number;
        };
    };
    /** true si el usuario actual es colaborador (no dueño) → borde verde */
    isShared?: boolean;
    /** true si el usuario es dueño y tiene al menos un colaborador → icono de equipo */
    hasCollaborators?: boolean;
};

const MODE_META: Record<EventMode, { label: string; Icon: typeof Trophy; color: string }> = {
    GALA: { label: "Gala", Icon: Trophy, color: "text-amber-400" },
    TIERLIST: { label: "Tierlist", Icon: ListOrdered, color: "text-blue-400" },
    PREGUNTAS: { label: "Preguntas", Icon: CircleHelp, color: "text-violet-400" },
    DIBUJO: { label: "Dibujo", Icon: Palette, color: "text-pink-400" },
};

/** Estadísticas a mostrar en el pie de la card según el modo del evento. */
function modeStats(mode: EventMode, c: DashboardEventCardProps["event"]["_count"]): { value: number; label: string }[] {
    switch (mode) {
        case "TIERLIST":
            return [{ value: c.tiers ?? 0, label: "Tiers" }, { value: c.participants, label: "Nominados" }];
        case "PREGUNTAS":
            return [{ value: c.questions ?? 0, label: "Preguntas" }];
        case "DIBUJO":
            return [{ value: c.drawings ?? 0, label: "Dibujos" }];
        default:
            return [{ value: c.polls, label: "Categorías" }, { value: c.participants, label: "Nominados" }];
    }
}

export default function DashboardEventCard({ event, isShared = false, hasCollaborators = false }: DashboardEventCardProps) {
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

    const mode = event.mode ?? "GALA";
    const modeMeta = MODE_META[mode];
    const ModeIcon = modeMeta.Icon;
    const stats = modeStats(mode, event._count);

    return (
        <div
            onClick={handleClick}
            className={clsx(
                "relative group bg-neutral-900/50 border-2 rounded-2xl p-6 transition-all cursor-pointer overflow-hidden",
                isShared
                    ? "border-green-500/40 hover:border-green-400/70 hover:bg-neutral-900 shadow-[0_0_20px_-8px_rgba(34,197,94,0.3)]"
                    : "border-white/15 hover:border-blue-500/50 hover:bg-neutral-900"
            )}
        >
            {/* Contenido normal */}
            <div className={clsx(isNavigating && "opacity-40")}>
                <div className="flex flex-col justify-between">
                    <div className="min-h-40 max-h-40">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-2 items-center flex-wrap">
                                <span className="flex items-center gap-1 text-[10px] p-1.5 rounded-full border-2 border-white/10 text-gray-300 font-semibold">
                                    <ModeIcon className={clsx("w-4 h-4", modeMeta.color)} />
                                    {/* {modeMeta.label} */}
                                </span>

                                <div
                                    className={clsx(
                                        "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                                        visibilityClass
                                    )}
                                >
                                    {visibilityLabel}
                                </div>

                                {event.status !== "DRAFT" && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border-2 border-white/10 text-gray-300 ${event.status === "APPROVED" ? "bg-green-500/10" : event.status === "DENIED" ? "bg-red-500/10" : event.status === "PENDING" ? "bg-yellow-500/10" : "bg-gray-800/30"}`}>
                                        {event.status === "PENDING" && "En revisión"}
                                        {event.status === "APPROVED" && "Aprobado"}
                                        {event.status === "DENIED" && "Rechazado"}
                                    </span>
                                )}

                                {/* Icono de colaboración */}
                                {(isShared || hasCollaborators) && (
                                    <span className={clsx(
                                        "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border-2 font-semibold",
                                        isShared
                                            ? "border-green-500/30 text-green-400 bg-green-500/10"
                                            : "border-white/15 text-gray-400 bg-white/5"
                                    )}>
                                        <Users className="w-3 h-3" />
                                        {isShared ? "Compartido" : "Equipo"}
                                    </span>
                                )}
                            </div>
                            <span className="text-gray-500 text-xs shrink-0">
                                {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: es })
                                    .replace(/alrededor de /i, "")
                                    .replace(/^./, (c) => c.toUpperCase())}
                            </span>
                        </div>

                        <h3 className={clsx(
                            "text-xl font-bold text-white mb-2 transition-colors truncate",
                            isShared ? "group-hover:text-green-400" : "group-hover:text-blue-400"
                        )}>
                            {event.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-6 line-clamp-2">
                            {event.description || "Sin descripción"}
                        </p>
                    </div>

                    <div className="flex items-center justify-start gap-4 text-xs text-gray-500 font-mono border-t-2 border-white/10 pt-4">
                        {stats.map((s) => (
                            <div key={s.label} className="flex items-center gap-1">
                                <span className="text-white font-bold">{s.value}</span>{" "}
                                {s.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Overlay de carga */}
            {isNavigating && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mb-3" />
                    <p className="text-xs text-gray-300">Abriendo el panel del evento...</p>
                </div>
            )}
        </div>
    );
}
