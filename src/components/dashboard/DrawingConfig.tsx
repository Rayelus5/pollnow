"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brush, Vote, Trophy, Save, ArrowRight, Image as ImageIcon, Heart } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { updateDrawingConfig, advanceDrawingPhase } from "@/app/lib/drawing-actions";

type Phase = "DRAWING" | "VOTING" | "RESULTS";

/** Date → "YYYY-MM-DDTHH:mm" en hora local para <input type="datetime-local">. */
function toLocalInput(d: Date | null): string {
    if (!d) return "";
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

const PHASE_META: Record<Phase, { label: string; Icon: typeof Brush; color: string }> = {
    DRAWING: { label: "Fase de dibujo", Icon: Brush, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    VOTING: { label: "Fase de votación", Icon: Vote, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    RESULTS: { label: "Resultados", Icon: Trophy, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
};

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

    const [unlimited, setUnlimited] = useState(drawingTimeLimit === null);
    const [time, setTime] = useState<number>(drawingTimeLimit ?? minTime);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
    const [pending, setPending] = useState(false);
    const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);

    const meta = PHASE_META[drawingPhase];

    async function handleSave(fd: FormData) {
        setMsg(null);
        setPending(true);
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

    return (
        <div className="space-y-6">
            {/* Fase actual + stats */}
            <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-sm font-bold ${meta.color}`}>
                    <meta.Icon size={15} /> {meta.label}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                    <ImageIcon size={14} /> {stats.submissions} dibujos
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                    <Heart size={14} /> {stats.reactions} reacciones
                </span>
            </div>

            <form action={handleSave} className="space-y-4 p-5 rounded-2xl border-2 border-white/10 bg-neutral-900/40">
                <div>
                    <label className="text-xs text-gray-500 uppercase block mb-1">Tema a dibujar</label>
                    <input
                        name="drawingPrompt"
                        defaultValue={drawingPrompt ?? ""}
                        maxLength={500}
                        disabled={!canManage || drawingPhase !== "DRAWING"}
                        placeholder="Ej: Dibuja tu superhéroe favorito"
                        className="w-full bg-black border-2 border-white/20 rounded-lg p-3 text-white text-sm focus:border-blue-500 outline-none disabled:opacity-50"
                    />
                    {drawingPhase !== "DRAWING" && <p className="text-[10px] text-gray-600 mt-1">El tema solo se puede editar durante la fase de dibujo.</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-gray-500 uppercase block mb-1">Cierre de dibujo</label>
                        <input
                            type="datetime-local"
                            name="drawingDeadline"
                            defaultValue={toLocalInput(drawingDeadline)}
                            disabled={!canManage}
                            required
                            className="w-full bg-black border-2 border-white/20 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none [color-scheme:dark] disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase block mb-1">Cierre de votación</label>
                        <input
                            type="datetime-local"
                            name="votingDeadline"
                            defaultValue={toLocalInput(votingDeadline)}
                            disabled={!canManage}
                            required
                            className="w-full bg-black border-2 border-white/20 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none [color-scheme:dark] disabled:opacity-50"
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-gray-500 uppercase">Tiempo por dibujo</label>
                        {allowUnlimited && (
                            <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer">
                                <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} disabled={!canManage} /> Sin límite
                            </label>
                        )}
                    </div>
                    {!unlimited && (
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
                        {allowUnlimited ? `Mín. ${minTime}s · o sin límite.` : `Entre ${minTime}s y ${maxTime ?? "?"}s (tu plan no permite ilimitado).`}
                    </p>
                </div>

                {msg && (
                    <p className={`text-sm ${msg.type === "ok" ? "text-green-400" : "text-red-400"}`}>{msg.text}</p>
                )}

                {canManage && (
                    <div className="flex items-center justify-between pt-1">
                        <button
                            type="button"
                            onClick={() => setShowAdvanceConfirm(true)}
                            disabled={pending || drawingPhase === "RESULTS"}
                            className="text-xs font-bold text-amber-400 hover:text-amber-300 px-3 py-2 rounded-lg border-2 border-amber-500/20 hover:bg-amber-500/10 transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                        >
                            Avanzar fase <ArrowRight size={13} />
                        </button>
                        <button
                            type="submit"
                            disabled={pending}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <Save size={15} /> Guardar
                        </button>
                    </div>
                )}
            </form>

            {/* Modal custom de confirmación de avance de fase */}
            {showAdvanceConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border-2 border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl border-t-4 border-t-amber-500">
                        <h2 className="text-xl font-bold text-white mb-2">Avanzar fase manualmente</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Vas a forzar el paso a la siguiente fase, <strong>independientemente de las fechas</strong> configuradas. Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAdvanceConfirm(false)}
                                disabled={pending}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 font-bold cursor-pointer disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={doAdvance}
                                disabled={pending}
                                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-bold cursor-pointer disabled:opacity-50"
                            >
                                Sí, avanzar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
