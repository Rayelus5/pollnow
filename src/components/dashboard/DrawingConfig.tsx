"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brush, Vote, Trophy, Save, ArrowRight, Image as ImageIcon, Heart, Clock, Check } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { updateDrawingConfig, advanceDrawingPhase } from "@/app/lib/drawing-actions";

type Phase = "DRAWING" | "VOTING" | "RESULTS";

const PHASES: { id: Phase; label: string; Icon: typeof Brush }[] = [
    { id: "DRAWING", label: "Dibujo", Icon: Brush },
    { id: "VOTING", label: "Votación", Icon: Vote },
    { id: "RESULTS", label: "Resultados", Icon: Trophy },
];

/** Date → "YYYY-MM-DDTHH:mm" en hora local para <input type="datetime-local">. */
function toLocalInput(d: Date | null): string {
    if (!d) return "";
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function formatHuman(value: string): string {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function DrawingConfig({
    eventId,
    planSlug,
    drawingPrompt,
    drawingDeadline,
    votingDeadline,
    drawingTimeLimit,
    drawingPhase,
    stats,
    canManage = true,
}: {
    eventId: string;
    planSlug: string;
    drawingPrompt: string | null;
    drawingDeadline: Date | null;
    votingDeadline: Date | null;
    drawingTimeLimit: number | null;
    drawingPhase: Phase;
    stats: { submissions: number; reactions: number };
    canManage?: boolean;
}) {
    const router = useRouter();
    const planKey = planSlug.toUpperCase() as keyof typeof PLANS;
    const limits = PLANS[planKey]?.limits ?? PLANS.FREE.limits;
    const allowUnlimited = limits.drawingAllowUnlimited;
    const minTime = limits.drawingMinTimeSecs ?? 10;
    const maxTime = limits.drawingMaxTimeSecs;

    // Estado controlado (permite validación en cliente antes de enviar)
    const [prompt, setPrompt] = useState(drawingPrompt ?? "");
    const [drawingAt, setDrawingAt] = useState(toLocalInput(drawingDeadline));
    const [votingAt, setVotingAt] = useState(toLocalInput(votingDeadline));
    const [unlimited, setUnlimited] = useState(drawingTimeLimit === null);
    const [time, setTime] = useState<number>(drawingTimeLimit ?? minTime);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
    const [pending, setPending] = useState(false);
    const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);

    const currentStep = PHASES.findIndex((p) => p.id === drawingPhase);
    const nextPhaseLabel = drawingPhase === "DRAWING" ? "Votación" : drawingPhase === "VOTING" ? "Resultados" : null;
    const promptLocked = drawingPhase !== "DRAWING";

    async function handleSave() {
        setMsg(null);
        // Validación en cliente (mejor UX que esperar al error del servidor)
        if (!drawingAt || !votingAt) {
            setMsg({ type: "err", text: "Indica las fechas de cierre de dibujo y de votación." });
            return;
        }
        if (new Date(votingAt) <= new Date(drawingAt)) {
            setMsg({ type: "err", text: "El cierre de votación debe ser posterior al cierre de dibujo." });
            return;
        }
        setPending(true);
        const fd = new FormData();
        fd.set("drawingPrompt", prompt);
        fd.set("drawingDeadline", drawingAt);
        fd.set("votingDeadline", votingAt);
        fd.set("drawingUnlimited", unlimited ? "true" : "false");
        if (!unlimited) fd.set("drawingTimeLimit", String(time));
        const res = await updateDrawingConfig(eventId, fd);
        setPending(false);
        if (res?.error) setMsg({ type: "err", text: res.error });
        else { setMsg({ type: "ok", text: "Configuración guardada." }); router.refresh(); }
    }

    async function doAdvance() {
        setShowAdvanceConfirm(false);
        setPending(true);
        const res = await advanceDrawingPhase(eventId);
        setPending(false);
        if (res?.error) setMsg({ type: "err", text: res.error });
        else router.refresh();
    }

    const inputCls = "w-full bg-black border-2 border-white/15 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none disabled:opacity-50";

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Stepper de fases */}
            <div className="rounded-2xl border-2 border-white/20 bg-neutral-900/40 p-5">
                {/* Stepper: cada fase es flex-1, las líneas son absolutas entre círculos */}
                <div className="flex items-start">
                    {PHASES.map((p, i) => {
                        const done = i < currentStep;
                        const active = i === currentStep;
                        const sub = p.id === "DRAWING" ? formatHuman(drawingAt) : p.id === "VOTING" ? formatHuman(votingAt) : null;
                        return (
                            <div key={p.id} className="flex-1 flex flex-col items-center text-center relative">
                                {/* Línea izquierda (hacia el paso anterior) */}
                                {i > 0 && (
                                    <div className={`absolute z-10 top-[17px] right-1/2 left-0 h-0.5 ${i <= currentStep ? "bg-emerald-500/40" : "bg-white/10"}`} />
                                )}
                                {/* Línea derecha (hacia el paso siguiente) */}
                                {i < PHASES.length - 1 && (
                                    <div className={`absolute z-10 top-[17px] left-1/2 right-0 h-0.5 ${i < currentStep ? "bg-emerald-500/40" : "bg-white/10"}`} />
                                )}
                                {/* Círculo */}
                                <div className={`relative z-20 w-9 h-9 rounded-full flex items-center justify-center border-2 ${active ? "border-blue-500 bg-zinc-900 text-blue-300" : done ? "border-emerald-500/40 bg-emerald-500 text-white" : "border-white/15 bg-neutral-900 text-gray-500"}`}>
                                    {done ? <Check size={16} /> : <p.Icon size={16} />}
                                </div>
                                {/* Etiqueta */}
                                <span className={`mt-2 text-xs font-bold leading-tight ${active ? "text-white" : "text-gray-500"}`}>{p.label}</span>
                                {sub && <span className="text-[10px] text-gray-600 mt-0.5">hasta {sub}</span>}
                            </div>
                        );
                    })}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-white/10 text-sm text-gray-400">
                    <span className="inline-flex items-center gap-1.5"><ImageIcon size={14} /> {stats.submissions} dibujos</span>
                    <span className="inline-flex items-center gap-1.5"><Heart size={14} /> {stats.reactions} reacciones</span>
                </div>
            </div>

            <div className="space-y-4 p-5 rounded-2xl border-2 border-white/20 bg-neutral-900/40">
                <div>
                    <label className="text-xs text-gray-500 uppercase block mb-1">Tema a dibujar</label>
                    <input
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        maxLength={500}
                        disabled={!canManage || promptLocked}
                        placeholder="Ej: Dibuja tu superhéroe favorito"
                        className={inputCls}
                    />
                    <p className="text-[10px] text-gray-600 mt-1">
                        {promptLocked ? "El tema solo se puede editar durante la fase de dibujo." : "Lo que verán los participantes mientras dibujan."}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-gray-500 uppercase block mb-1">Cierre de dibujo</label>
                        <input
                            type="datetime-local"
                            value={drawingAt}
                            onChange={(e) => setDrawingAt(e.target.value)}
                            disabled={!canManage}
                            className={`${inputCls} [color-scheme:dark]`}
                        />
                        <p className="text-[10px] text-gray-600 mt-1">Hasta aquí los participantes pueden subir su dibujo. Después empieza la votación.</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase block mb-1">Cierre de votación</label>
                        <input
                            type="datetime-local"
                            value={votingAt}
                            min={drawingAt || undefined}
                            onChange={(e) => setVotingAt(e.target.value)}
                            disabled={!canManage}
                            className={`${inputCls} [color-scheme:dark]`}
                        />
                        <p className="text-[10px] text-gray-600 mt-1">Hasta aquí se vota. Después se muestran los resultados (top 100).</p>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-gray-500 uppercase flex items-center gap-1.5"><Clock size={12} /> Tiempo por dibujo</label>
                        {allowUnlimited && (
                            <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer">
                                <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} disabled={!canManage} /> Sin límite
                            </label>
                        )}
                    </div>
                    {unlimited ? (
                        <p className="text-sm text-white">Sin límite de tiempo ⏳</p>
                    ) : (
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min={minTime}
                                max={maxTime ?? 600}
                                step={5}
                                value={time}
                                onChange={(e) => setTime(Number(e.target.value))}
                                disabled={!canManage}
                                className="flex-1 accent-blue-500"
                            />
                            <span className="text-sm text-white font-mono w-16 text-right">{time}s</span>
                        </div>
                    )}
                    <p className="text-[10px] text-gray-600 mt-1">
                        Cuenta atrás por participante mientras dibuja. {allowUnlimited ? `Mín. ${minTime}s, o sin límite.` : `Entre ${minTime}s y ${maxTime ?? "?"}s (tu plan no permite ilimitado).`}
                    </p>
                </div>

                {msg && <p className={`text-sm ${msg.type === "ok" ? "text-green-400" : "text-red-400"}`}>{msg.text}</p>}

                {canManage && (
                    <div className="flex items-center justify-between pt-1 gap-3 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setShowAdvanceConfirm(true)}
                            disabled={pending || drawingPhase === "RESULTS"}
                            className="text-xs font-bold text-amber-400 hover:text-amber-300 px-3 py-2 rounded-lg border-2 border-amber-500/20 hover:bg-amber-500/10 transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                        >
                            {nextPhaseLabel ? `Avanzar a ${nextPhaseLabel}` : "Fase final"} <ArrowRight size={13} />
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={pending}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <Save size={15} /> {pending ? "Guardando…" : "Guardar"}
                        </button>
                    </div>
                )}
            </div>

            {/* Modal custom de confirmación de avance de fase */}
            {showAdvanceConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border-2 border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl border-t-4 border-t-amber-500">
                        <h2 className="text-xl font-bold text-white mb-2">Avanzar a {nextPhaseLabel}</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Vas a forzar el paso a la fase de <strong>{nextPhaseLabel}</strong>, <strong>independientemente de las fechas</strong> configuradas. Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowAdvanceConfirm(false)} disabled={pending} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 font-bold cursor-pointer disabled:opacity-50">Cancelar</button>
                            <button onClick={doAdvance} disabled={pending} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-bold cursor-pointer disabled:opacity-50">Sí, avanzar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
