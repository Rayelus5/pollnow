"use client";

import { useState } from "react";
import { approveEvent, rejectEvent } from "@/app/lib/admin-actions";
import { Check, X, ExternalLink, User, Calendar } from "lucide-react";
import Link from "next/link";
import { Bouncy } from 'ldrs/react';
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

if (typeof window !== 'undefined') import('ldrs/bouncy');

export default function ReviewCard({ event }: { event: any }) {
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleApprove = async () => {
        if (!confirm(`¿Aprobar "${event.title}" para el público?`)) return;
        setLoading(true);
        await approveEvent(event.id);
        // La página se recargará por el revalidatePath
    };

    const handleReject = async () => {
        if (!reason.trim()) return alert("Debes escribir un motivo para rechazar.");
        setLoading(true);
        await rejectEvent(event.id, reason);
        // La página se recargará
    };

    return (
        <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
            {/* Header Evento */}
            <div className="p-6 border-b border-white/5 flex justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-white">{event.title}</h3>
                        <Link href={`/e/${event.slug}`} target="_blank" className="text-blue-400 hover:text-blue-300">
                            <ExternalLink size={14} />
                        </Link>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2">{event.description || "Sin descripción."}</p>
                </div>
                <div className="text-right shrink-0">
                    <div className="text-xs text-gray-500 mb-1 flex items-center justify-end gap-1">
                        <Calendar size={12} /> {formatDistanceToNow(new Date(event.updatedAt), { addSuffix: true, locale: es })}
                    </div>
                    <div className="text-xs bg-black/50 px-2 py-1 rounded border border-white/10 font-mono text-gray-400">
                        ID: {event.id.slice(0, 8)}
                    </div>
                </div>
            </div>

            {/* Info Contextual */}
            <div className="px-6 py-4 bg-black/20 flex items-center gap-6 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center font-bold">
                        {event.user.name?.[0]}
                    </div>
                    <span>{event.user.name} ({event.user.email})</span>
                </div>
                <div className="h-4 w-px bg-white/10"></div>
                <span>{event._count.polls} Categorías</span>
                <span>{event._count.participants} Nominados</span>
            </div>

            {/* Acciones */}
            <div className="p-4 bg-white/5 border-t border-white/5">
                {!rejecting ? (
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setRejecting(true)}
                            disabled={loading}
                            className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-bold rounded-lg flex items-center gap-2 text-sm transition-colors"
                        >
                            <X size={16} /> Denegar
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex items-center gap-2 text-sm transition-colors shadow-lg shadow-green-900/20"
                        >
                            {loading ? <Bouncy size="20" color="white" /> : <><Check size={16} /> Aprobar Publicación</>}
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs text-red-400 font-bold block mb-2 uppercase tracking-wider">Motivo del rechazo (Obligatorio)</label>
                        <textarea
                            className="w-full bg-black border border-red-900/50 rounded-lg p-3 text-white text-sm mb-3 focus:border-red-500 outline-none min-h-[80px]"
                            placeholder="Ej: El título contiene lenguaje inapropiado..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setRejecting(false)} className="px-4 py-2 text-gray-400 text-sm hover:text-white font-medium">Cancelar</button>
                            <button onClick={handleReject} disabled={loading} className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-500 flex items-center gap-2">
                                {loading ? "Enviando..." : "Confirmar Rechazo"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}