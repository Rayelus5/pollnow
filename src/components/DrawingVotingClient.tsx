"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ThumbsUp, ThumbsDown, Star, Send, Trophy, Clock, Loader2 } from "lucide-react";
import DrawingCanvas, { type DrawingCanvasHandle } from "@/components/DrawingCanvas";

type Phase = "DRAWING" | "VOTING" | "RESULTS";

type EventInfo = {
    id: string;
    title: string;
    description: string | null;
    drawingPrompt: string | null;
    drawingTimeLimit: number | null;
};

export default function DrawingVotingClient({
    event,
    phase,
    alreadySubmitted,
    myImageUrl,
    superlikeUsed,
}: {
    event: EventInfo;
    phase: Phase;
    alreadySubmitted: boolean;
    myImageUrl: string | null;
    superlikeUsed: boolean;
}) {
    return (
        <main className="min-h-screen bg-black text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-4">
                    <ArrowLeft size={16} /> Volver
                </Link>

                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold">{event.title}</h1>
                    {event.description && <p className="text-gray-400 mt-1">{event.description}</p>}
                    <span className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">Dibujo</span>
                </div>

                {phase === "DRAWING" && <DrawingPhase event={event} alreadySubmitted={alreadySubmitted} myImageUrl={myImageUrl} />}
                {phase === "VOTING" && <VotingPhase eventId={event.id} superlikeUsed={superlikeUsed} />}
                {phase === "RESULTS" && <ResultsPhase eventId={event.id} />}
            </div>
        </main>
    );
}

// ─── FASE DIBUJO ───────────────────────────────────────────────────────────────
function DrawingPhase({ event, alreadySubmitted, myImageUrl }: { event: EventInfo; alreadySubmitted: boolean; myImageUrl: string | null }) {
    const canvasRef = useRef<DrawingCanvasHandle>(null);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(alreadySubmitted);
    const [savedUrl, setSavedUrl] = useState(myImageUrl);
    const [error, setError] = useState<string | null>(null);
    const [remaining, setRemaining] = useState<number | null>(event.drawingTimeLimit ?? null);

    const submit = useCallback(async () => {
        if (submitting || done) return;
        setSubmitting(true);
        setError(null);
        const blob = await canvasRef.current?.exportBlob();
        if (!blob) { setError("No se pudo exportar el dibujo."); setSubmitting(false); return; }
        const fd = new FormData();
        fd.set("eventId", event.id);
        fd.set("file", blob, "drawing.png");
        try {
            const res = await fetch("/api/drawing/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 403) { setDone(true); }
                else setError(data.error || "No se pudo enviar el dibujo.");
            } else {
                setSavedUrl(data.imageUrl);
                setDone(true);
            }
        } catch {
            setError("Error de red al subir el dibujo.");
        } finally {
            setSubmitting(false);
        }
    }, [event.id, submitting, done]);

    // Temporizador (si hay límite). Al llegar a 0, auto-envía.
    useEffect(() => {
        if (done || remaining === null) return;
        if (remaining <= 0) { submit(); return; }
        const t = setTimeout(() => setRemaining((r) => (r === null ? null : r - 1)), 1000);
        return () => clearTimeout(t);
    }, [remaining, done, submit]);

    if (done) {
        return (
            <div className="max-w-md mx-auto text-center bg-neutral-900/60 border-2 border-green-500/30 rounded-2xl p-8">
                <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4 text-green-400"><Check size={28} /></div>
                <h2 className="text-xl font-bold mb-1">¡Dibujo enviado!</h2>
                <p className="text-sm text-gray-400 mb-4">Cuando termine la fase de dibujo empezará la votación.</p>
                {savedUrl && <img src={savedUrl} alt="Tu dibujo" className="rounded-xl border-2 border-white/10 mx-auto max-w-xs w-full" />}
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <div className="rounded-xl border-2 border-blue-500/20 bg-blue-500/5 px-4 py-2">
                    <span className="text-xs text-gray-400 uppercase">Tema</span>
                    <p className="font-bold text-white">{event.drawingPrompt || "Dibujo libre"}</p>
                </div>
                {remaining !== null && (
                    <span className={`inline-flex items-center gap-1.5 font-mono font-bold px-3 py-2 rounded-xl border-2 ${remaining <= 10 ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-white border-white/15"}`}>
                        <Clock size={16} /> {remaining}s
                    </span>
                )}
            </div>

            <DrawingCanvas ref={canvasRef} />

            {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}

            <div className="flex justify-center mt-5">
                <button onClick={submit} disabled={submitting} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-full transition-colors disabled:opacity-50 cursor-pointer">
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {submitting ? "Enviando…" : "Registrar dibujo"}
                </button>
            </div>
        </div>
    );
}

// ─── FASE VOTACIÓN ───────────────────────────────────────────────────────────────
type BatchItem = { id: string; imageUrl: string };

function VotingPhase({ eventId, superlikeUsed }: { eventId: string; superlikeUsed: boolean }) {
    const [items, setItems] = useState<BatchItem[]>([]);
    const [seen, setSeen] = useState<string[]>([]);
    const [reacted, setReacted] = useState<Record<string, string>>({});
    const [usedSuper, setUsedSuper] = useState(superlikeUsed);
    const [loading, setLoading] = useState(true);
    const [empty, setEmpty] = useState(false);

    const loadBatch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/drawing/batch?eventId=${eventId}&seen=${seen.join(",")}`);
            const data = await res.json();
            const batch: BatchItem[] = data.items ?? [];
            if (batch.length === 0) setEmpty(true);
            setItems(batch);
            setSeen((prev) => [...prev, ...batch.map((b) => b.id)]);
        } catch {
            setEmpty(true);
        } finally {
            setLoading(false);
        }
    }, [eventId, seen]);

    // Carga inicial
    useEffect(() => { loadBatch(); /* eslint-disable-next-line */ }, []);

    async function react(submissionId: string, type: "LIKE" | "DISLIKE" | "SUPERLIKE") {
        if (reacted[submissionId]) return;
        setReacted((p) => ({ ...p, [submissionId]: type }));
        if (type === "SUPERLIKE") setUsedSuper(true);
        try {
            const res = await fetch("/api/drawing/react", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submissionId, type }),
            });
            if (!res.ok && res.status === 409) setUsedSuper(true);
        } catch { /* optimista; ignorar */ }
    }

    const allReacted = items.length > 0 && items.every((i) => reacted[i.id]);

    return (
        <div>
            <p className="text-center text-sm text-gray-400 mb-1">Vota los dibujos: 👍 +100 · 👎 −100 · ⭐ +300 (1 superlike por evento)</p>
            <p className="text-center text-xs text-gray-600 mb-6">Verás dibujos al azar. Reacciona a los que quieras y carga más cuando termines.</p>

            {loading && items.length === 0 ? (
                <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-gray-500" /></div>
            ) : empty && items.length === 0 ? (
                <div className="text-center py-16 text-gray-500">No hay (más) dibujos para votar por ahora. ¡Gracias por participar!</div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {items.map((item) => {
                            const r = reacted[item.id];
                            return (
                                <div key={item.id} className={`rounded-2xl overflow-hidden border-2 bg-neutral-900 ${r ? "border-green-500/30 opacity-70" : "border-white/10"}`}>
                                    <img src={item.imageUrl} alt="Dibujo" className="w-full aspect-[3/2] object-cover bg-white" />
                                    <div className="flex items-center justify-center gap-2 p-2">
                                        <button onClick={() => react(item.id, "LIKE")} disabled={!!r} className={`flex-1 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:cursor-default ${r === "LIKE" ? "bg-green-500/20 text-green-400" : "bg-white/5 text-gray-300 hover:bg-green-500/10 hover:text-green-400 disabled:opacity-40"}`} title="Like (+100)">
                                            <ThumbsUp size={16} />
                                        </button>
                                        <button onClick={() => react(item.id, "DISLIKE")} disabled={!!r} className={`flex-1 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:cursor-default ${r === "DISLIKE" ? "bg-red-500/20 text-red-400" : "bg-white/5 text-gray-300 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"}`} title="Dislike (−100)">
                                            <ThumbsDown size={16} />
                                        </button>
                                        <button onClick={() => react(item.id, "SUPERLIKE")} disabled={!!r || usedSuper} className={`flex-1 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:cursor-default ${r === "SUPERLIKE" ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-gray-300 hover:bg-amber-500/10 hover:text-amber-400 disabled:opacity-30"}`} title={usedSuper ? "Superlike ya usado" : "Superlike (+300, 1 por evento)"}>
                                            <Star size={16} fill={r === "SUPERLIKE" ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-center mt-8">
                        <button onClick={loadBatch} disabled={loading || (!allReacted && items.length > 0 && !empty)} className="inline-flex items-center gap-2 bg-white text-black font-bold px-7 py-3 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                            {allReacted || items.length === 0 ? "Ver más dibujos" : "Reacciona a todos para ver más"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── FASE RESULTADOS ───────────────────────────────────────────────────────────────
type ResultItem = { id: string; imageUrl: string; score: number; likeCount: number; dislikeCount: number; superlikeCount: number };

function ResultsPhase({ eventId }: { eventId: string }) {
    const [results, setResults] = useState<ResultItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/drawing/results?eventId=${eventId}`);
                const data = await res.json();
                setResults(data.results ?? []);
                setTotal(data.total ?? 0);
            } finally {
                setLoading(false);
            }
        })();
    }, [eventId]);

    if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-gray-500" /></div>;
    if (results.length === 0) return <div className="text-center py-16 text-gray-500">No hay dibujos en este evento.</div>;

    const podium = results.slice(0, 3);
    const rest = results.slice(3);

    return (
        <div>
            <h2 className="text-center text-xl font-bold mb-1 flex items-center justify-center gap-2"><Trophy size={20} className="text-amber-400" /> Resultados</h2>
            {total > 100 && <p className="text-center text-xs text-gray-500 mb-6">Mostrando solo los 100 mejores de {total} dibujos.</p>}

            {/* Podio */}
            <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto mb-8 items-end">
                {podium.map((r, i) => (
                    <div key={r.id} className={`text-center ${i === 0 ? "order-2" : i === 1 ? "order-1" : "order-3"}`}>
                        <div className={`relative rounded-2xl overflow-hidden border-2 ${i === 0 ? "border-amber-400" : i === 1 ? "border-gray-300" : "border-amber-700"}`}>
                            <img src={r.imageUrl} alt={`#${i + 1}`} className="w-full aspect-square object-cover bg-white" />
                            <span className="absolute top-1 left-1 text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                        </div>
                        <p className="mt-1 font-bold text-sm">{r.score} pts</p>
                    </div>
                ))}
            </div>

            {/* Resto */}
            {rest.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    {rest.map((r, i) => (
                        <div key={r.id} className="rounded-xl overflow-hidden border-2 border-white/10 bg-neutral-900 relative">
                            <img src={r.imageUrl} alt={`#${i + 4}`} className="w-full aspect-square object-cover bg-white" />
                            <div className="absolute inset-x-0 bottom-0 bg-black/70 text-[11px] text-center py-0.5 flex items-center justify-center gap-2">
                                <span className="text-gray-400">#{i + 4}</span>
                                <span className="font-bold text-white">{r.score} pts</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
