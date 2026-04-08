"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, UserCircle, CalendarDays, LayoutList } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";

type EventRow = {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean;
    createdAt: Date;
    status: "DRAFT" | "PENDING" | "APPROVED" | "DENIED";
    _count: { polls: number; participants: number };
};

type Props = {
    invitationId: string;
    event: EventRow;
    invitedBy: { name: string; username: string; image: string | null };
    onAccepted: () => void;
    onRejected: () => void;
};

export default function PendingInviteCard({ invitationId, event, invitedBy, onAccepted, onRejected }: Props) {
    const [responding, setResponding] = useState<"accept" | "reject" | null>(null);
    const [error, setError] = useState("");

    const respond = async (action: "accept" | "reject") => {
        setResponding(action);
        setError("");
        const res = await fetch("/api/collaborators/respond", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invitationId, action }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            action === "accept" ? onAccepted() : onRejected();
        } else {
            setError(data.error ?? "Error al responder");
            setResponding(null);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.2 }}
            className="relative bg-neutral-900/60 border-2 border-amber-500/40 rounded-2xl p-6 overflow-hidden shadow-[0_0_20px_-8px_rgba(245,158,11,0.25)] flex flex-col gap-4"
        >
            {/* Badge de invitación */}
            <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border-2 border-amber-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Invitación pendiente
                </span>
                <span className="text-gray-500 text-xs">
                    {formatDistanceToNow(event.createdAt, { addSuffix: true, locale: es })}
                </span>
            </div>

            {/* Info del evento */}
            <div>
                <h3 className="text-xl font-bold text-white mb-1 truncate">{event.title}</h3>
                <p className="text-sm text-gray-400 line-clamp-2">
                    {event.description || "Sin descripción"}
                </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-500 font-mono border-t-2 border-white/8 pt-3">
                <div className="flex items-center gap-1.5">
                    <LayoutList className="w-3.5 h-3.5" />
                    <span className="text-white font-bold">{event._count.polls}</span> Categorías
                </div>
                <div className="flex items-center gap-1.5">
                    <UserCircle className="w-3.5 h-3.5" />
                    <span className="text-white font-bold">{event._count.participants}</span> Nominados
                </div>
            </div>

            {/* Remitente */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/4 border-2 border-white/8">
                <div className="w-7 h-7 rounded-full bg-neutral-700 overflow-hidden shrink-0">
                    {invitedBy.image ? (
                        <Image src={invitedBy.image} alt={invitedBy.name} width={28} height={28} className="w-full h-full object-cover" />
                    ) : (
                        <span className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                            {invitedBy.name.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-gray-400">
                        Invitado por <span className="font-semibold text-gray-200">{invitedBy.name}</span>
                        <span className="text-gray-600 ml-1">@{invitedBy.username}</span>
                    </p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border-2 border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}

            {/* Botones */}
            <div className="flex gap-2 mt-auto">
                <button
                    onClick={() => respond("accept")}
                    disabled={!!responding}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {responding === "accept" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4" />
                    )}
                    Aceptar
                </button>
                <button
                    onClick={() => respond("reject")}
                    disabled={!!responding}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {responding === "reject" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <XCircle className="w-4 h-4" />
                    )}
                    Rechazar
                </button>
            </div>
        </motion.div>
    );
}
