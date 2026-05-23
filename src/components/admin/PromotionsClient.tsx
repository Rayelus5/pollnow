"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Trophy, Megaphone, ToggleLeft, ToggleRight, Plus, Trash2, Crown, Calendar, Users, Eye, EyeOff, ExternalLink, Save, ChevronDown, ChevronUp } from "lucide-react";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";
import {
    updatePromotionConfig,
    createRaffle,
    deleteRaffle,
    upsertAnnouncementBar,
    getRaffleEligibleUsers,
    selectRaffleWinner,
} from "@/app/lib/promotions-actions";

type Config = { id: string; isActive: boolean; planSlug: string; durationDays: number };
type Raffle = {
    id: string; title: string; description: string; deadline: Date;
    showCounter: boolean; maxParticipants: number | null; condition: string;
    status: string; winnerId: string | null; bannerText: string | null;
    showInBanner: boolean; createdAt: Date;
    winner: { id: string; name: string; email: string; image: string | null } | null;
};
type Bar = { id: string; text: string; link: string | null; linkText: string | null; isActive: boolean };

type Tab = "bonus" | "raffles" | "bar";
type PlanOption = { value: string; label: string };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: "Activo", color: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10" },
    CLOSED: { label: "Cerrado", color: "border-gray-500/40 text-gray-300 bg-gray-500/10" },
    WINNER_SELECTED: { label: "Ganador elegido", color: "border-amber-500/40 text-amber-300 bg-amber-500/10" },
};

export default function PromotionsClient({
    initialConfig,
    initialRaffles,
    initialBar,
    planOptions,
}: {
    initialConfig: Config;
    initialRaffles: Raffle[];
    initialBar: Bar;
    planOptions: PlanOption[];
}) {
    const [tab, setTab] = useState<Tab>("bonus");

    return (
        <div>
            {/* Tabs */}
            <div className="flex gap-1 mb-8 bg-neutral-900 border-2 border-white/10 rounded-xl p-1 w-fit">
                {([
                    { id: "bonus", icon: <Gift size={15} />, label: "Bono de bienvenida" },
                    { id: "raffles", icon: <Trophy size={15} />, label: "Sorteos" },
                    { id: "bar", icon: <Megaphone size={15} />, label: "Barra de anuncios" },
                ] as { id: Tab; icon: React.ReactNode; label: string }[]).map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                            tab === t.id
                                ? "bg-white/10 text-white"
                                : "text-gray-500 hover:text-gray-300"
                        }`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                >
                    {tab === "bonus" && <BonusTab initialConfig={initialConfig} planOptions={planOptions} />}
                    {tab === "raffles" && <RafflesTab initialRaffles={initialRaffles} />}
                    {tab === "bar" && <BarTab initialBar={initialBar} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// ─── Tab: Bono de bienvenida ──────────────────────────────────────────────────

function BonusTab({ initialConfig, planOptions }: { initialConfig: Config; planOptions: PlanOption[] }) {
    const [config, setConfig] = useState(initialConfig);
    const [saved, setSaved] = useState(false);
    const [pending, startTransition] = useTransition();

    const save = () => {
        startTransition(async () => {
            await updatePromotionConfig({
                isActive: config.isActive,
                planSlug: config.planSlug,
                durationDays: config.durationDays,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        });
    };

    return (
        <div className="max-w-xl space-y-6">
            <div className="bg-neutral-900 border-2 border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-white">Bono de bienvenida</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Cada nuevo registro recibirá el plan elegido durante el tiempo indicado.
                        </p>
                    </div>
                    <button
                        onClick={() => setConfig(c => ({ ...c, isActive: !c.isActive }))}
                        className="cursor-pointer"
                    >
                        {config.isActive
                            ? <ToggleRight size={40} className="text-emerald-400" />
                            : <ToggleLeft size={40} className="text-gray-600" />
                        }
                    </button>
                </div>

                <AnimatePresence>
                    {config.isActive && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-4 pb-2">
                                <div>
                                    <label className="text-xs uppercase text-gray-500 block mb-2">Plan a regalar</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {planOptions.map(p => (
                                            <button
                                                key={p.value}
                                                onClick={() => setConfig(c => ({ ...c, planSlug: p.value }))}
                                                className={`flex-1 min-w-[100px] py-2.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer ${
                                                    config.planSlug === p.value
                                                        ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                                                        : "border-white/10 text-gray-600 hover:border-white/20"
                                                }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs uppercase text-gray-500 block mb-2">Duración (días)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={365}
                                        value={config.durationDays}
                                        onChange={e => setConfig(c => ({ ...c, durationDays: parseInt(e.target.value) || 30 }))}
                                        className="w-full bg-black border-2 border-white/20 rounded-lg p-3 text-white focus:border-violet-500 outline-none"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
                    <button
                        onClick={save}
                        disabled={pending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
                    >
                        {pending ? <Bouncy size="20" speed="1.75" color="#fff" /> : <Save size={15} />}
                        {pending ? "Guardando..." : "Guardar"}
                    </button>
                    {saved && <span className="text-xs text-emerald-400">¡Guardado!</span>}
                </div>
            </div>

            <div className="text-xs text-gray-600 bg-neutral-900/50 border border-white/5 rounded-xl p-4 space-y-1">
                <p>• Los usuarios que ya estén registrados no se verán afectados.</p>
                <p>• El bono expira automáticamente pasado el número de días indicado.</p>
                <p>• Los usuarios con Stripe activo no se verán alterados.</p>
            </div>
        </div>
    );
}

// ─── Tab: Sorteos ─────────────────────────────────────────────────────────────

function RafflesTab({ initialRaffles }: { initialRaffles: Raffle[] }) {
    const [raffles, setRaffles] = useState(initialRaffles);
    const [showForm, setShowForm] = useState(false);
    const [winnerModal, setWinnerModal] = useState<Raffle | null>(null);
    const [pending, startTransition] = useTransition();

    const handleCreate = (data: Parameters<typeof createRaffle>[0]) => {
        startTransition(async () => {
            await createRaffle(data);
            window.location.reload();
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm("¿Eliminar este sorteo?")) return;
        startTransition(async () => {
            await deleteRaffle(id);
            window.location.reload();
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{raffles.length} sorteo{raffles.length !== 1 ? "s" : ""}</p>
                <button
                    onClick={() => setShowForm(s => !s)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                    <Plus size={15} /> Nuevo sorteo
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <RaffleForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} pending={pending} />
                    </motion.div>
                )}
            </AnimatePresence>

            {raffles.length === 0 && !showForm && (
                <div className="py-16 border-2 border-dashed border-white/10 rounded-2xl text-center text-gray-500">
                    No hay sorteos. ¡Crea el primero!
                </div>
            )}

            <div className="space-y-3">
                {raffles.map(raffle => (
                    <RaffleCard
                        key={raffle.id}
                        raffle={raffle}
                        onDelete={handleDelete}
                        onSelectWinner={() => setWinnerModal(raffle)}
                    />
                ))}
            </div>

            {winnerModal && (
                <WinnerModal raffle={winnerModal} onClose={() => setWinnerModal(null)} />
            )}
        </div>
    );
}

function RaffleCard({ raffle, onDelete, onSelectWinner }: {
    raffle: Raffle;
    onDelete: (id: string) => void;
    onSelectWinner: () => void;
}) {
    const s = STATUS_LABELS[raffle.status] ?? STATUS_LABELS.ACTIVE;
    return (
        <div className="bg-neutral-900 border-2 border-white/10 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-white truncate">{raffle.title}</h3>
                        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.color}`}>
                            {s.label}
                        </span>
                        {raffle.showInBanner && (
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-red-500/30 text-red-300 bg-red-500/10">
                                En barra
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-1">{raffle.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(raffle.deadline).toLocaleDateString("es-ES")}
                        </span>
                        {raffle.maxParticipants && (
                            <span className="flex items-center gap-1">
                                <Users size={11} /> Max {raffle.maxParticipants}
                            </span>
                        )}
                    </div>
                    {raffle.winner && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-amber-300">
                            <Crown size={12} />
                            Ganador: <strong>{raffle.winner.name}</strong> ({raffle.winner.email})
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {raffle.status === "ACTIVE" && (
                        <button
                            onClick={onSelectWinner}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-lg hover:bg-amber-500/20 transition-colors cursor-pointer"
                        >
                            <Crown size={12} /> Elegir ganador
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(raffle.id)}
                        className="p-1.5 text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function RaffleForm({ onSubmit, onCancel, pending }: {
    onSubmit: (data: Parameters<typeof createRaffle>[0]) => void;
    onCancel: () => void;
    pending: boolean;
}) {
    const [form, setForm] = useState({
        title: "", description: "", deadline: "",
        showCounter: true, maxParticipants: "",
        condition: "all_users", bannerText: "", showInBanner: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...form,
            maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : null,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-neutral-900 border-2 border-violet-500/30 rounded-2xl p-6 mb-4 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2"><Plus size={16} /> Nuevo Sorteo</h3>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs uppercase text-gray-500 block mb-1">Título *</label>
                    <input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                        className="w-full bg-black border-2 border-white/20 rounded-lg p-2.5 text-white text-sm focus:border-violet-500 outline-none" />
                </div>
                <div>
                    <label className="text-xs uppercase text-gray-500 block mb-1">Fecha límite *</label>
                    <input required type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({...f, deadline: e.target.value}))}
                        className="w-full bg-black border-2 border-white/20 rounded-lg p-2.5 text-white text-sm focus:border-violet-500 outline-none" />
                </div>
            </div>

            <div>
                <label className="text-xs uppercase text-gray-500 block mb-1">Descripción *</label>
                <textarea required rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                    className="w-full bg-black border-2 border-white/20 rounded-lg p-2.5 text-white text-sm focus:border-violet-500 outline-none resize-none" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs uppercase text-gray-500 block mb-1">Condición</label>
                    <select value={form.condition} onChange={e => setForm(f => ({...f, condition: e.target.value}))}
                        className="w-full bg-black border-2 border-white/20 rounded-lg p-2.5 text-white text-sm focus:border-violet-500 outline-none">
                        <option value="all_users">Todos los usuarios</option>
                        <option value="registered_before_deadline">Registrados antes de la fecha límite</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs uppercase text-gray-500 block mb-1">Máx. participantes (opcional)</label>
                    <input type="number" min={1} value={form.maxParticipants} onChange={e => setForm(f => ({...f, maxParticipants: e.target.value}))}
                        className="w-full bg-black border-2 border-white/20 rounded-lg p-2.5 text-white text-sm focus:border-violet-500 outline-none" />
                </div>
            </div>

            <div>
                <label className="text-xs uppercase text-gray-500 block mb-1">Texto para la barra de anuncios (opcional)</label>
                <input value={form.bannerText} onChange={e => setForm(f => ({...f, bannerText: e.target.value}))}
                    placeholder="Ej: 🎉 Sorteo activo — ¡Únete ahora!"
                    className="w-full bg-black border-2 border-white/20 rounded-lg p-2.5 text-white text-sm focus:border-violet-500 outline-none" />
            </div>

            <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={form.showCounter} onChange={e => setForm(f => ({...f, showCounter: e.target.checked}))}
                        className="accent-violet-500" />
                    Mostrar contador de participantes
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={form.showInBanner} onChange={e => setForm(f => ({...f, showInBanner: e.target.checked}))}
                        className="accent-violet-500" />
                    Mostrar en barra de anuncios
                </label>
            </div>

            <div className="flex gap-3 pt-2">
                <button type="button" onClick={onCancel} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-bold rounded-xl transition-colors cursor-pointer">
                    Cancelar
                </button>
                <button type="submit" disabled={pending} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer">
                    {pending ? <Bouncy size="20" speed="1.75" color="#fff" /> : <Plus size={15} />}
                    {pending ? "Creando..." : "Crear sorteo"}
                </button>
            </div>
        </form>
    );
}

function WinnerModal({ raffle, onClose }: { raffle: Raffle; onClose: () => void }) {
    const [users, setUsers] = useState<{ id: string; name: string; email: string; image: string | null }[]>([]);
    const [loading, setLoading] = useState(true);
    const [highlighted, setHighlighted] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    useState(() => {
        getRaffleEligibleUsers(raffle.id).then(u => { setUsers(u); setLoading(false); });
    });

    const pickRandom = () => {
        if (users.length === 0) return;
        const winner = users[Math.floor(Math.random() * users.length)];
        setHighlighted(winner.id);
    };

    const confirm = () => {
        if (!highlighted) return;
        startTransition(async () => {
            await selectRaffleWinner(raffle.id, highlighted);
            onClose();
            window.location.reload();
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-neutral-900 border-2 border-white/10 rounded-2xl w-full max-w-lg shadow-2xl"
            >
                <div className="p-5 border-b border-white/10">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Crown size={16} className="text-amber-400" /> Elegir ganador — {raffle.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{users.length} participante{users.length !== 1 ? "s" : ""} elegible{users.length !== 1 ? "s" : ""}</p>
                </div>

                <div className="p-5 max-h-64 overflow-y-auto space-y-1.5">
                    {loading ? (
                        <div className="flex justify-center py-8"><Bouncy size="40" speed="1.75" color="#a78bfa" /></div>
                    ) : users.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No hay participantes elegibles</p>
                    ) : users.map(u => (
                        <div
                            key={u.id}
                            onClick={() => setHighlighted(u.id)}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                                highlighted === u.id
                                    ? "border-amber-500/50 bg-amber-500/10"
                                    : "border-white/5 hover:border-white/15"
                            }`}
                        >
                            {u.image && <img src={u.image} className="w-7 h-7 rounded-full" alt="" />}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{u.name}</p>
                                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                            </div>
                            {highlighted === u.id && <Crown size={14} className="text-amber-400 shrink-0" />}
                        </div>
                    ))}
                </div>

                <div className="p-5 border-t border-white/10 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-bold rounded-xl transition-colors cursor-pointer">
                        Cancelar
                    </button>
                    <button onClick={pickRandom} className="flex-1 py-2.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-sm font-bold rounded-xl transition-colors cursor-pointer">
                        🎲 Aleatorio
                    </button>
                    <button onClick={confirm} disabled={!highlighted || pending} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-sm font-bold rounded-xl transition-colors cursor-pointer">
                        {pending ? <Bouncy size="20" speed="1.75" color="#000" /> : <Crown size={14} />}
                        Confirmar
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Tab: Barra de anuncios ───────────────────────────────────────────────────

function BarTab({ initialBar }: { initialBar: Bar }) {
    const [bar, setBar] = useState(initialBar);
    const [saved, setSaved] = useState(false);
    const [pending, startTransition] = useTransition();

    const save = () => {
        startTransition(async () => {
            await upsertAnnouncementBar({
                text: bar.text,
                link: bar.link ?? undefined,
                linkText: bar.linkText ?? undefined,
                isActive: bar.isActive,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        });
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div className="bg-neutral-900 border-2 border-white/10 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Barra de anuncios</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Aparece en la parte superior de toda la web.</p>
                    </div>
                    <button onClick={() => setBar(b => ({ ...b, isActive: !b.isActive }))} className="cursor-pointer">
                        {bar.isActive
                            ? <ToggleRight size={40} className="text-emerald-400" />
                            : <ToggleLeft size={40} className="text-gray-600" />
                        }
                    </button>
                </div>

                <div>
                    <label className="text-xs uppercase text-gray-500 block mb-1.5">Texto del anuncio</label>
                    <input
                        value={bar.text}
                        onChange={e => setBar(b => ({ ...b, text: e.target.value }))}
                        placeholder="Ej: 🎉 ¡Sorteo activo! — Los 100 primeros usuarios ganan 1 mes de Plus gratis"
                        maxLength={300}
                        className="w-full bg-black border-2 border-white/20 rounded-lg p-3 text-white text-sm focus:border-violet-500 outline-none"
                    />
                    <p className="text-[10px] text-gray-600 mt-1">{bar.text.length}/300</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs uppercase text-gray-500 block mb-1.5">Enlace (opcional)</label>
                        <input
                            value={bar.link ?? ""}
                            onChange={e => setBar(b => ({ ...b, link: e.target.value || null }))}
                            placeholder="https://pollnow.es/..."
                            className="w-full bg-black border-2 border-white/20 rounded-lg p-3 text-white text-sm focus:border-violet-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs uppercase text-gray-500 block mb-1.5">Texto del enlace (opcional)</label>
                        <input
                            value={bar.linkText ?? ""}
                            onChange={e => setBar(b => ({ ...b, linkText: e.target.value || null }))}
                            placeholder="Más info"
                            className="w-full bg-black border-2 border-white/20 rounded-lg p-3 text-white text-sm focus:border-violet-500 outline-none"
                        />
                    </div>
                </div>

                {/* Preview */}
                {bar.text.trim() && (
                    <div>
                        <p className="text-xs uppercase text-gray-500 mb-2">Vista previa</p>
                        <div className="bg-red-600 text-white text-sm font-medium rounded-lg overflow-hidden">
                            <div className="flex items-center gap-2 px-3 py-2">
                                <Megaphone size={13} className="shrink-0" />
                                <span>{bar.text}</span>
                                {bar.link && bar.linkText && (
                                    <span className="underline font-bold ml-1">{bar.linkText} →</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                    <button
                        onClick={save}
                        disabled={pending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
                    >
                        {pending ? <Bouncy size="20" speed="1.75" color="#fff" /> : <Save size={15} />}
                        {pending ? "Guardando..." : "Guardar y publicar"}
                    </button>
                    {saved && <span className="text-xs text-emerald-400">¡Publicado!</span>}
                </div>
            </div>

            <div className="text-xs text-gray-600 bg-neutral-900/50 border border-white/5 rounded-xl p-4">
                <p>• Para que los usuarios que ya la cerraron la vean de nuevo, desactívala y vuelve a activarla (genera un nuevo ID).</p>
                <p className="mt-1">• El texto hace scroll automático horizontal.</p>
            </div>
        </div>
    );
}
