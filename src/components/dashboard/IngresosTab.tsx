"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, TrendingUp, ArrowDownToLine, Phone, X, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { requestWithdrawal } from "@/app/lib/revenue-actions";
import { MAX_BALANCE, MIN_WITHDRAWAL, WITHDRAWAL_PROCESSING_DAYS, formatEur } from "@/lib/revenue-config";
import { formatDate } from "@/lib/format-date";

export type PaymentRow = {
    id: string;
    amount: number;
    adminNote: string | null;
    createdAt: Date;
    event: { id: string; title: string } | null;
};
export type WithdrawalRow = {
    id: string;
    amount: number;
    method: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    rejectionReason: string | null;
    createdAt: Date;
};

type Props = {
    hasPhone: boolean;
    phonePrefix: string | null;
    phoneNumber: string | null;
    currentBalance: number;
    totalEarned: number;
    payments: PaymentRow[];
    withdrawals: WithdrawalRow[];
};

const STATUS_BADGE: Record<WithdrawalRow["status"], string> = {
    PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
};
const STATUS_LABEL: Record<WithdrawalRow["status"], string> = {
    PENDING: "Pendiente",
    APPROVED: "Pagado",
    REJECTED: "Rechazado",
};

export default function IngresosTab({
    hasPhone,
    phonePrefix,
    phoneNumber,
    currentBalance,
    totalEarned,
    payments,
    withdrawals,
}: Props) {
    const [modalOpen, setModalOpen] = useState(false);

    if (!hasPhone) {
        return (
            <div className="py-16 px-6 text-center border-2 border-dashed border-white/10 rounded-2xl">
                <div className="w-14 h-14 bg-blue-500/15 rounded-full flex items-center justify-center mx-auto text-blue-400 mb-4">
                    <Phone size={26} />
                </div>
                <h2 className="text-xl font-bold mb-2">Añade tu teléfono para acceder a tus ingresos</h2>
                <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                    Para acceder a tus ingresos, añade tu número de teléfono (Bizum) en la pestaña Mi Cuenta.
                </p>
                <Link href="/dashboard?tab=profile" className="inline-block bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors">
                    Ir a Mi Cuenta
                </Link>
            </div>
        );
    }

    const hasPending = withdrawals.some((w) => w.status === "PENDING");
    const canWithdraw = currentBalance >= MIN_WITHDRAWAL && !hasPending;
    const progress = Math.min(100, (currentBalance / MAX_BALANCE) * 100);
    const missing = Math.max(0, MIN_WITHDRAWAL - currentBalance);

    return (
        <div className="space-y-10">
            {/* Resumen de saldo */}
            <section>
                <h2 className="text-2xl font-bold mb-1">Mis Ingresos</h2>
                <p className="text-gray-400 text-sm mb-6">Recompensas recibidas por tus eventos en Pollnow.</p>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-neutral-900/60 border-2 border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider font-bold mb-2">
                            <Wallet size={14} /> Saldo disponible
                        </div>
                        <div className="text-4xl font-bold text-white">{formatEur(currentBalance)}</div>

                        <div className="mt-4">
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-sky-400" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1">{formatEur(currentBalance)} / {formatEur(MAX_BALANCE)} (máximo acumulable)</p>
                        </div>
                    </div>

                    <div className="bg-neutral-900/60 border-2 border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider font-bold mb-2">
                            <TrendingUp size={14} /> Total histórico ganado
                        </div>
                        <div className="text-4xl font-bold text-emerald-400">{formatEur(totalEarned)}</div>
                        <p className="text-[11px] text-gray-500 mt-4">Suma de todo lo que has ganado en Pollnow.</p>
                    </div>
                </div>

                {hasPending ? (
                    <div className="flex items-center gap-2 p-4 rounded-xl border-2 border-amber-500/20 bg-amber-500/5 text-amber-200 text-sm">
                        <Info size={16} className="text-amber-400 shrink-0" />
                        Tienes una solicitud de retiro en proceso.
                    </div>
                ) : canWithdraw ? (
                    <button
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-all cursor-pointer"
                    >
                        <ArrowDownToLine size={18} /> Solicitar retiro
                    </button>
                ) : (
                    <div className="inline-flex flex-col gap-1">
                        <button
                            disabled
                            title={`Mínimo de retiro: ${formatEur(MIN_WITHDRAWAL)}. Te faltan ${formatEur(missing)}`}
                            className="inline-flex items-center gap-2 bg-white/5 text-gray-500 font-bold px-6 py-3.5 rounded-xl border-2 border-white/10 cursor-not-allowed"
                        >
                            <ArrowDownToLine size={18} /> Solicitar retiro
                        </button>
                        <span className="text-[11px] text-gray-500">
                            Mínimo {formatEur(MIN_WITHDRAWAL)}. Te faltan {formatEur(missing)}.
                        </span>
                    </div>
                )}
            </section>

            {/* Historial de ingresos */}
            <section>
                <h3 className="text-lg font-bold mb-4">Historial de ingresos</h3>
                {payments.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-500 border-2 border-dashed border-white/10 rounded-2xl">
                        Aún no has recibido ingresos. ¡Crea eventos increíbles y podrás ganar recompensas!
                    </div>
                ) : (
                    <div className="bg-neutral-900/60 border-2 border-white/10 rounded-xl overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 font-medium">Fecha</th>
                                    <th className="p-4 font-medium">Evento</th>
                                    <th className="p-4 font-medium">Cantidad</th>
                                    <th className="p-4 font-medium">Nota</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-gray-300">
                                {payments.map((p) => (
                                    <tr key={p.id} className="hover:bg-white/5">
                                        <td className="p-4 whitespace-nowrap text-gray-500">{formatDate(p.createdAt)}</td>
                                        <td className="p-4">
                                            {p.event ? (
                                                <Link href={`/dashboard/event/${p.event.id}`} className="text-blue-400 hover:underline">{p.event.title}</Link>
                                            ) : <span className="text-gray-500">—</span>}
                                        </td>
                                        <td className="p-4 font-bold text-emerald-400 whitespace-nowrap">+{formatEur(p.amount)}</td>
                                        <td className="p-4 text-gray-400">{p.adminNote || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Historial de retiros */}
            <section>
                <h3 className="text-lg font-bold mb-4">Historial de retiros</h3>
                {withdrawals.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-500 border-2 border-dashed border-white/10 rounded-2xl">
                        No has solicitado ningún retiro todavía.
                    </div>
                ) : (
                    <div className="bg-neutral-900/60 border-2 border-white/10 rounded-xl overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 font-medium">Fecha</th>
                                    <th className="p-4 font-medium">Cantidad</th>
                                    <th className="p-4 font-medium">Método</th>
                                    <th className="p-4 font-medium">Estado</th>
                                    <th className="p-4 font-medium">Motivo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-gray-300">
                                {withdrawals.map((w) => (
                                    <tr key={w.id} className="hover:bg-white/5">
                                        <td className="p-4 whitespace-nowrap text-gray-500">{formatDate(w.createdAt)}</td>
                                        <td className="p-4 font-bold whitespace-nowrap">{formatEur(w.amount)}</td>
                                        <td className="p-4">{w.method === "BIZUM" ? "Bizum" : w.method}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border-2 ${STATUS_BADGE[w.status]}`}>
                                                {STATUS_LABEL[w.status]}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-400 max-w-xs">{w.rejectionReason || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {modalOpen && (
                <WithdrawalModal
                    balance={currentBalance}
                    defaultPhone={`${phonePrefix ?? ""}${phoneNumber ?? ""}`}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
}

function WithdrawalModal({
    balance,
    defaultPhone,
    onClose,
}: {
    balance: number;
    defaultPhone: string;
    onClose: () => void;
}) {
    const router = useRouter();
    const [recipientPhone, setRecipientPhone] = useState(defaultPhone);
    const [recipientName, setRecipientName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !submitting) onClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [submitting, onClose]);

    async function handleConfirm() {
        setError(null);
        setSubmitting(true);
        const res = await requestWithdrawal({ recipientPhone, recipientName });
        setSubmitting(false);
        if (res.error) { setError(res.error); return; }
        onClose();
        router.refresh();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => !submitting && onClose()}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Solicitar retiro"
                className="relative w-full max-w-md bg-neutral-950 border-2 border-white/10 rounded-2xl shadow-2xl p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-white"><ArrowDownToLine size={18} /> Solicitar retiro</h3>
                    <button onClick={onClose} aria-label="Cerrar" className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer">
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-2">Método de pago</label>
                        <select disabled value="BIZUM" className="w-full p-2.5 rounded-lg bg-black border-2 border-white/15 text-white text-sm opacity-80">
                            <option value="BIZUM">Bizum</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="w-phone" className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-2">Número de Bizum</label>
                        <input
                            id="w-phone"
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            className="w-full p-2.5 rounded-lg bg-black border-2 border-white/15 text-white text-sm focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="w-name" className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-2">Nombre completo del destinatario</label>
                        <input
                            id="w-name"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            placeholder="Nombre y apellidos tal como aparecen en tu cuenta bancaria"
                            className="w-full p-2.5 rounded-lg bg-black border-2 border-white/15 text-white text-sm focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-wider text-gray-500 font-bold block mb-2">Cantidad a retirar</label>
                        <input readOnly value={formatEur(balance)} className="w-full p-2.5 rounded-lg bg-white/5 border-2 border-white/15 text-white text-sm font-bold" />
                        <p className="text-[11px] text-gray-500 mt-1">Siempre se retira el saldo total disponible.</p>
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-lg border-2 border-blue-500/20 bg-blue-500/5 text-blue-200/90 text-xs">
                        <Info size={15} className="shrink-0 mt-0.5 text-blue-400" />
                        Una vez enviada la solicitud, el equipo de Pollnow realizará la transferencia en un plazo de {WITHDRAWAL_PROCESSING_DAYS} días hábiles.
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-400">
                            <AlertCircle size={15} /> {error}
                        </div>
                    )}

                    <button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold py-3 rounded-xl hover:scale-[1.01] transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Confirmar solicitud
                    </button>
                </div>
            </div>
        </div>
    );
}
