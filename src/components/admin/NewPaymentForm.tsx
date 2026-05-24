"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { Search, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { searchUsersForPayment, getUserPublishedEvents, createRevenuePayment } from "@/app/lib/revenue-actions";
import { MAX_BALANCE, formatEur } from "@/lib/revenue-config";

type UserHit = { id: string; name: string | null; email: string; currentBalance: number; marginAvailable: number };
type EventHit = { id: string; title: string };
type Feedback = { type: "success" | "error"; text: string } | null;

export default function NewPaymentForm({ onClose, initialUserId }: { onClose: () => void; initialUserId?: string }) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [debounced] = useDebounce(query, 300);
    const [results, setResults] = useState<UserHit[]>([]);
    const [searching, setSearching] = useState(false);

    const [selected, setSelected] = useState<UserHit | null>(null);
    const [events, setEvents] = useState<EventHit[]>([]);
    const [eventId, setEventId] = useState("");
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<Feedback>(null);

    useEffect(() => {
        if (debounced.length < 2 || selected) { setResults([]); return; }
        setSearching(true);
        searchUsersForPayment(debounced).then((r) => setResults(r)).finally(() => setSearching(false));
    }, [debounced, selected]);

    async function selectUser(u: UserHit) {
        setSelected(u);
        setResults([]);
        setQuery("");
        const evs = await getUserPublishedEvents(u.id);
        setEvents(evs);
    }

    function reset() {
        setSelected(null);
        setEvents([]);
        setEventId("");
        setAmount("");
    }

    async function handleSubmit() {
        setFeedback(null);
        if (!selected) return;
        const amountNum = Number(amount.replace(",", "."));
        if (!eventId) { setFeedback({ type: "error", text: "Selecciona un evento." }); return; }
        if (!Number.isFinite(amountNum) || amountNum <= 0) { setFeedback({ type: "error", text: "Cantidad inválida." }); return; }
        if (amountNum > selected.marginAvailable + 1e-9) { setFeedback({ type: "error", text: `Máximo ${formatEur(selected.marginAvailable)} para este usuario.` }); return; }

        setSubmitting(true);
        const res = await createRevenuePayment({ userId: selected.id, eventId, amount: amountNum, adminNote: note || undefined });
        setSubmitting(false);
        if (res.error) { setFeedback({ type: "error", text: res.error }); return; }
        setFeedback({ type: "success", text: "Envío creado correctamente." });
        router.refresh();
        setTimeout(onClose, 800);
    }

    const atMax = selected ? selected.marginAvailable <= 0 : false;

    return (
        <div className="bg-neutral-900 border-2 border-white/10 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">Nuevo envío</h3>
                <button onClick={onClose} aria-label="Cerrar" className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer"><X size={16} /></button>
            </div>

            {/* Selección de usuario */}
            {!selected ? (
                <div className="relative">
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-2">Usuario</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Busca por nombre o email…"
                            className="w-full bg-black border-2 border-white/15 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:border-blue-500 outline-none"
                        />
                        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 animate-spin" />}
                    </div>
                    {results.length > 0 && (
                        <div className="mt-2 border-2 border-white/10 rounded-lg overflow-hidden divide-y divide-white/5">
                            {results.map((u) => (
                                <button key={u.id} onClick={() => selectUser(u)} className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors cursor-pointer">
                                    <div className="text-sm text-white font-medium">{u.name}</div>
                                    <div className="text-xs text-gray-500">{u.email} · saldo {formatEur(u.currentBalance)}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border-2 border-white/10">
                        <div>
                            <div className="text-sm text-white font-medium">{selected.name}</div>
                            <div className="text-xs text-gray-500">{selected.email}</div>
                            <div className="text-xs text-gray-400 mt-1">
                                Saldo: <span className="text-white font-bold">{formatEur(selected.currentBalance)}</span> ·
                                Margen hasta {formatEur(MAX_BALANCE)}: <span className="text-emerald-400 font-bold">{formatEur(selected.marginAvailable)}</span>
                            </div>
                        </div>
                        <button onClick={reset} className="text-xs text-blue-400 hover:underline cursor-pointer">Cambiar</button>
                    </div>

                    {atMax ? (
                        <div className="flex items-center gap-2 p-3 rounded-lg border-2 border-amber-500/20 bg-amber-500/5 text-amber-300 text-sm">
                            <AlertCircle size={15} /> Este usuario ya ha alcanzado el saldo máximo de {formatEur(MAX_BALANCE)}.
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-2">Evento publicado</label>
                                <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="w-full p-2.5 rounded-lg bg-black border-2 border-white/15 text-white text-sm focus:border-blue-500 outline-none">
                                    <option value="">Selecciona un evento…</option>
                                    {events.map((e) => (
                                        <option key={e.id} value={e.id} className="bg-neutral-900">{e.title} ({e.id.slice(0, 8)})</option>
                                    ))}
                                </select>
                                {events.length === 0 && <p className="text-[11px] text-amber-400 mt-1">Este usuario no tiene eventos publicados.</p>}
                            </div>

                            <div>
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-2">Cantidad (€)</label>
                                <input
                                    type="number" step="0.01" min="0.01" max={selected.marginAvailable}
                                    value={amount} onChange={(e) => setAmount(e.target.value)}
                                    placeholder={`Máx ${formatEur(selected.marginAvailable)}`}
                                    className="w-full p-2.5 rounded-lg bg-black border-2 border-white/15 text-white text-sm focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-2">Nota para el usuario <span className="normal-case text-gray-600">(opcional)</span></label>
                                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full p-2.5 rounded-lg bg-black border-2 border-white/15 text-white text-sm focus:border-blue-500 outline-none" />
                            </div>

                            {feedback && (
                                <div className={`flex items-center gap-2 text-sm ${feedback.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                                    {feedback.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />} {feedback.text}
                                </div>
                            )}

                            <button onClick={handleSubmit} disabled={submitting || events.length === 0}
                                className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg font-bold hover:bg-gray-100 disabled:opacity-50 cursor-pointer">
                                {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Crear envío
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
