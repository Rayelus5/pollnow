"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Send } from "lucide-react";

type QOption = { id: string; text: string; order: number };
type Question = {
    id: string;
    text: string;
    description: string | null;
    type: "CHECKBOX" | "RADIO";
    pageIndex: number;
    order: number;
    isRequired: boolean;
    options: QOption[];
};

export default function PreguntasVotingClient({
    event,
    questions,
}: {
    event: { id: string; title: string; description: string | null };
    questions: Question[];
}) {
    const [answers, setAnswers] = useState<Record<string, string[]>>({});
    const [pageIdx, setPageIdx] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [voted, setVoted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && localStorage.getItem(`pq_voted_${event.id}`)) setVoted(true);
    }, [event.id]);

    // Agrupar por página
    const pages = useMemo(() => {
        const map = new Map<number, Question[]>();
        for (const q of questions) {
            if (!map.has(q.pageIndex)) map.set(q.pageIndex, []);
            map.get(q.pageIndex)!.push(q);
        }
        return [...map.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([, qs]) => qs.sort((a, b) => a.order - b.order));
    }, [questions]);

    const current = pages[pageIdx] ?? [];
    const isLast = pageIdx >= pages.length - 1;

    function toggle(q: Question, optionId: string) {
        if (voted) return;
        setAnswers((prev) => {
            const cur = prev[q.id] ?? [];
            if (q.type === "RADIO") return { ...prev, [q.id]: [optionId] };
            return { ...prev, [q.id]: cur.includes(optionId) ? cur.filter((o) => o !== optionId) : [...cur, optionId] };
        });
        setError(null);
    }

    function validatePage(qs: Question[]): boolean {
        for (const q of qs) {
            if (q.isRequired && (answers[q.id]?.length ?? 0) === 0) {
                setError(`Responde la pregunta obligatoria: "${q.text}".`);
                return false;
            }
        }
        return true;
    }

    function next() {
        if (!validatePage(current)) return;
        setError(null);
        setPageIdx((p) => Math.min(p + 1, pages.length - 1));
    }

    async function handleSubmit() {
        // Validar TODAS las páginas (obligatorias)
        for (const qs of pages) if (!validatePage(qs)) return;
        setSubmitting(true);
        setError(null);
        const payload = {
            eventId: event.id,
            answers: Object.entries(answers).map(([questionId, optionIds]) => ({ questionId, optionIds })),
        };
        try {
            const res = await fetch("/api/preguntas-votes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 403) { localStorage.setItem(`pq_voted_${event.id}`, "1"); setVoted(true); }
                else setError(data.error || "No se pudieron registrar las respuestas.");
            } else {
                localStorage.setItem(`pq_voted_${event.id}`, "1");
                setVoted(true);
            }
        } catch {
            setError("Error de red. Inténtalo de nuevo.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
                <Link href="/polls" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-4">
                    <ArrowLeft size={16} /> Volver
                </Link>

                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold">{event.title}</h1>
                    {event.description && <p className="text-gray-400 mt-1">{event.description}</p>}
                    <span className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">Formulario</span>
                </div>

                {voted ? (
                    <div className="max-w-md mx-auto text-center bg-neutral-900/60 border-2 border-green-500/30 rounded-2xl p-8">
                        <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4 text-green-400">
                            <Check size={28} />
                        </div>
                        <h2 className="text-xl font-bold mb-1">¡Respuestas registradas!</h2>
                        <p className="text-sm text-gray-400">Gracias por participar. Los resultados son privados.</p>
                    </div>
                ) : (
                    <>
                        {pages.length > 1 && (
                            <p className="text-center text-xs text-gray-500 mb-4">Página {pageIdx + 1} de {pages.length}</p>
                        )}

                        <div className="space-y-5">
                            {current.map((q) => (
                                <div key={q.id} className="bg-neutral-900/60 border-2 border-white/8 rounded-2xl p-5">
                                    <div className="mb-3">
                                        <h3 className="font-bold text-lg flex items-start gap-1">
                                            {q.text}
                                            {q.isRequired && <span className="text-red-400 text-sm">*</span>}
                                        </h3>
                                        {q.description && <p className="text-sm text-gray-400 mt-0.5">{q.description}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        {q.options.map((opt) => {
                                            const selected = (answers[q.id] ?? []).includes(opt.id);
                                            return (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => toggle(q, opt.id)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors cursor-pointer ${selected ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-black/30 hover:border-white/25"}`}
                                                >
                                                    <span className={`w-5 h-5 shrink-0 flex items-center justify-center border-2 ${q.type === "CHECKBOX" ? "rounded" : "rounded-full"} ${selected ? "border-blue-500 bg-blue-500 text-white" : "border-white/30"}`}>
                                                        {selected && <Check size={13} />}
                                                    </span>
                                                    <span className="text-sm">{opt.text}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}

                        <div className="flex justify-between items-center mt-6">
                            <button
                                onClick={() => setPageIdx((p) => Math.max(0, p - 1))}
                                disabled={pageIdx === 0}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border-2 border-white/15 text-gray-300 hover:bg-white/5 disabled:opacity-30 cursor-pointer"
                            >
                                <ArrowLeft size={16} /> Anterior
                            </button>
                            {isLast ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 py-2.5 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Send size={16} /> {submitting ? "Enviando…" : "Enviar respuestas"}
                                </button>
                            ) : (
                                <button onClick={next} className="inline-flex items-center gap-1.5 bg-white text-black font-bold px-6 py-2.5 rounded-full hover:bg-gray-100 cursor-pointer">
                                    Siguiente <ArrowRight size={16} />
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
