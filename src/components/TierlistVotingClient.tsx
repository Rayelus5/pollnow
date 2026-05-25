"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Check, Trophy, ZoomIn, X } from "lucide-react";

type Participant = { id: string; name: string; imageUrl: string | null };
type Tier = { id: string; label: string; color: string; order: number };

const TRAY = "tray";

export default function TierlistVotingClient({
    event,
    tiers,
    participants,
}: {
    event: { id: string; title: string; description: string | null };
    tiers: Tier[];
    participants: Participant[];
}) {
    const sortedTiers = [...tiers].sort((a, b) => a.order - b.order);
    const partById = new Map(participants.map((p) => [p.id, p]));

    // Estado: droppableId -> participantId[]
    const [lists, setLists] = useState<Record<string, string[]>>(() => {
        const init: Record<string, string[]> = { [TRAY]: participants.map((p) => p.id) };
        sortedTiers.forEach((t) => (init[`tier-${t.id}`] = []));
        return init;
    });
    const [submitting, setSubmitting] = useState(false);
    const [voted, setVoted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Imagen ampliada (lightbox) al pulsar una tarjeta con imagen.
    const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);

    useEffect(() => {
        if (!lightbox) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightbox]);

    // Reconstruye un estado de listas válido a partir de lo guardado: descarta ids
    // que ya no existen y coloca en la bandeja cualquier nominado no clasificado.
    function buildFromSaved(saved: Record<string, string[]>): Record<string, string[]> {
        const valid = new Set(participants.map((p) => p.id));
        const placed = new Set<string>();
        const next: Record<string, string[]> = { [TRAY]: [] };
        sortedTiers.forEach((t) => (next[`tier-${t.id}`] = []));
        for (const t of sortedTiers) {
            const key = `tier-${t.id}`;
            for (const pid of saved[key] ?? []) {
                if (valid.has(pid) && !placed.has(pid)) { next[key].push(pid); placed.add(pid); }
            }
        }
        for (const pid of saved[TRAY] ?? []) {
            if (valid.has(pid) && !placed.has(pid)) { next[TRAY].push(pid); placed.add(pid); }
        }
        for (const p of participants) if (!placed.has(p.id)) next[TRAY].push(p.id);
        return next;
    }

    function persistLists(current: Record<string, string[]>) {
        try { localStorage.setItem(`tl_lists_${event.id}`, JSON.stringify(current)); } catch { /* no-op */ }
    }

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!localStorage.getItem(`tl_voted_${event.id}`)) return;
        setVoted(true);
        // Restaurar la tierlist que envió el usuario (para mostrarla deshabilitada).
        const saved = localStorage.getItem(`tl_lists_${event.id}`);
        if (saved) {
            try { setLists(buildFromSaved(JSON.parse(saved))); } catch { /* mantener estado actual */ }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event.id]);

    function onDragEnd(result: DropResult) {
        if (voted) return;
        const { source, destination } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        setLists((prev) => {
            const next = { ...prev };
            const src = Array.from(next[source.droppableId]);
            const [moved] = src.splice(source.index, 1);
            const dst = source.droppableId === destination.droppableId ? src : Array.from(next[destination.droppableId]);
            dst.splice(destination.index, 0, moved);
            next[source.droppableId] = source.droppableId === destination.droppableId ? dst : src;
            next[destination.droppableId] = dst;
            return next;
        });
    }

    async function handleSubmit() {
        setError(null);
        setSubmitting(true);
        const entries: { tierId: string; participantId: string }[] = [];
        for (const t of sortedTiers) {
            for (const pid of lists[`tier-${t.id}`]) entries.push({ tierId: t.id, participantId: pid });
        }
        if (entries.length === 0) {
            setError("Coloca al menos un nominado en un tier.");
            setSubmitting(false);
            return;
        }
        try {
            const res = await fetch("/api/tierlist-votes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId: event.id, entries }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 403) { localStorage.setItem(`tl_voted_${event.id}`, "1"); persistLists(lists); setVoted(true); }
                else setError(data.error || "No se pudo registrar el voto.");
            } else {
                localStorage.setItem(`tl_voted_${event.id}`, "1");
                persistLists(lists);
                setVoted(true);
            }
        } catch {
            setError("Error de red. Inténtalo de nuevo.");
        } finally {
            setSubmitting(false);
        }
    }

    function Card({ p, index }: { p: Participant; index: number }) {
        return (
            <Draggable draggableId={p.id} index={index} isDragDisabled={voted}>
                {(prov, snap) => (
                    <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        onClick={() => { if (p.imageUrl) setLightbox({ url: p.imageUrl, name: p.name }); }}
                        className={`group relative aspect-square w-20 rounded-lg overflow-hidden border-2 bg-neutral-800 shrink-0 ${snap.isDragging ? "border-blue-500 shadow-xl" : "border-white/10"} ${voted ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
                        title={p.imageUrl ? `${p.name} · pulsa para ampliar` : p.name}
                    >
                        {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-center text-[11px] font-bold text-gray-200 px-1">{p.name}</div>
                        )}
                        {p.imageUrl && (
                            <>
                                <div className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <ZoomIn size={12} />
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[10px] text-white text-center truncate px-1 py-0.5">{p.name}</div>
                            </>
                        )}
                    </div>
                )}
            </Draggable>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <Link href="/polls" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-4">
                    <ArrowLeft size={16} /> Volver
                </Link>

                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold">{event.title}</h1>
                    {event.description && <p className="text-gray-400 mt-1">{event.description}</p>}
                    <span className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">Tierlist</span>
                </div>

                {/* Aviso de voto registrado (la tierlist se muestra debajo, deshabilitada) */}
                {voted && (
                    <div className="max-w-2xl mx-auto mb-6 flex items-center gap-3 bg-green-500/10 border-2 border-green-500/30 rounded-2xl px-5 py-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center text-green-400 shrink-0">
                            <Check size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-white">¡Voto registrado!</p>
                            <p className="text-sm text-gray-400">Esta es la tierlist que enviaste. Ya no puedes editarla.</p>
                        </div>
                    </div>
                )}

                <DragDropContext onDragEnd={onDragEnd}>
                    {/* Tabla de tiers */}
                    <div className={`rounded-2xl overflow-hidden border-2 border-neutral-700 ${voted ? "opacity-90" : ""}`}>
                        {sortedTiers.map((t) => (
                            <div key={t.id} className="flex border-b border-neutral-700 last:border-b-0 min-h-[96px]">
                                <div className="w-24 shrink-0 flex items-center justify-center font-bold text-black/80 text-center px-2 break-words" style={{ backgroundColor: t.color }}>
                                    {t.label}
                                </div>
                                <Droppable droppableId={`tier-${t.id}`} direction="horizontal" isDropDisabled={voted}>
                                    {(prov, snap) => (
                                        <div
                                            ref={prov.innerRef}
                                            {...prov.droppableProps}
                                            className={`flex-1 flex flex-wrap gap-2 p-2 items-center bg-neutral-900/40 ${snap.isDraggingOver ? "bg-blue-500/5" : ""}`}
                                        >
                                            {lists[`tier-${t.id}`].map((pid, i) => {
                                                const p = partById.get(pid);
                                                return p ? <Card key={pid} p={p} index={i} /> : null;
                                            })}
                                            {prov.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>

                    {/* Bandeja de nominados (sin clasificar) */}
                    {(!voted || lists[TRAY].length > 0) && (
                        <div className="mt-6">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                {voted ? "Sin clasificar" : "Arrastra los nominados a los tiers"}
                            </p>
                            <Droppable droppableId={TRAY} direction="horizontal" isDropDisabled={voted}>
                                {(prov, snap) => (
                                    <div
                                        ref={prov.innerRef}
                                        {...prov.droppableProps}
                                        className={`flex flex-wrap gap-2 p-3 rounded-2xl border-2 border-neutral-700 bg-neutral-800/40 min-h-[110px] ${snap.isDraggingOver ? "border-blue-500/40" : ""} ${voted ? "opacity-90" : ""}`}
                                    >
                                        {lists[TRAY].map((pid, i) => {
                                            const p = partById.get(pid);
                                            return p ? <Card key={pid} p={p} index={i} /> : null;
                                        })}
                                        {prov.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    )}

                    {!voted && (
                        <>
                            {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}

                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Trophy size={18} /> {submitting ? "Registrando…" : "Registrar voto"}
                                </button>
                            </div>
                        </>
                    )}
                </DragDropContext>
            </div>

            {/* Lightbox: imagen ampliada de la opción */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightbox(null)}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
                    >
                        <button
                            onClick={() => setLightbox(null)}
                            aria-label="Cerrar"
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            src={lightbox.url}
                            alt={lightbox.name}
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-[90vw] max-h-[80vh] object-contain rounded-xl border-2 border-white/15 shadow-2xl"
                        />
                        <p className="mt-4 text-white font-semibold text-center max-w-[90vw] break-words">{lightbox.name}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
