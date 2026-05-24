"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, AlertCircle } from "lucide-react";
import { approveWithdrawal, rejectWithdrawal } from "@/app/lib/revenue-actions";
import { formatEur } from "@/lib/revenue-config";

type Mode = "approve" | "reject" | null;

export default function WithdrawalActions({
    id,
    amount,
    recipientName,
    recipientPhone,
}: {
    id: string;
    amount: number;
    recipientName: string;
    recipientPhone: string;
}) {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>(null);
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) setMode(null); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [busy]);

    async function confirm() {
        setError(null);
        setBusy(true);
        const res = mode === "approve" ? await approveWithdrawal(id) : await rejectWithdrawal(id, reason);
        setBusy(false);
        if (res.error) { setError(res.error); return; }
        setMode(null);
        router.refresh();
    }

    return (
        <>
            <div className="flex gap-2 justify-end">
                <button onClick={() => { setMode("approve"); setError(null); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 cursor-pointer">
                    <Check size={13} /> Pagado
                </button>
                <button onClick={() => { setMode("reject"); setError(null); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-red-500/10 text-red-400 border-2 border-red-500/20 text-xs font-bold hover:bg-red-500/20 cursor-pointer">
                    <X size={13} /> Rechazar
                </button>
            </div>

            {mode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => !busy && setMode(null)}>
                    <div role="dialog" aria-modal="true" aria-label={mode === "approve" ? "Confirmar pago" : "Rechazar retiro"}
                        className="relative w-full max-w-md bg-neutral-950 border-2 border-white/10 rounded-2xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setMode(null)} aria-label="Cerrar" className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer"><X size={16} /></button>

                        {mode === "approve" ? (
                            <>
                                <h3 className="text-lg font-bold text-white mb-3">Confirmar pago</h3>
                                <p className="text-sm text-gray-300 mb-5">
                                    ¿Confirmas que has enviado <span className="font-bold text-white">{formatEur(amount)}</span> por Bizum
                                    a <span className="font-bold text-white">{recipientName}</span> ({recipientPhone})?
                                </p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-white mb-3">Rechazar solicitud</h3>
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-2">Motivo del rechazo</label>
                                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
                                    placeholder="Explica el motivo (mín. 10 caracteres). El usuario lo recibirá por email."
                                    className="w-full p-3 rounded-lg bg-black border-2 border-white/15 text-white text-sm focus:border-blue-500 outline-none mb-1" />
                            </>
                        )}

                        {error && <div className="flex items-center gap-2 text-sm text-red-400 mb-3"><AlertCircle size={15} /> {error}</div>}

                        <button onClick={confirm} disabled={busy}
                            className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer ${mode === "approve" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-red-600 hover:bg-red-500 text-white"}`}>
                            {busy ? <Loader2 size={16} className="animate-spin" /> : mode === "approve" ? <Check size={16} /> : <X size={16} />}
                            {mode === "approve" ? "Confirmar pago" : "Rechazar solicitud"}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
