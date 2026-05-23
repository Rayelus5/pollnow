"use client";

import { useState } from "react";
import { createEvent } from "@/app/lib/dashboard-actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";
import { Plus, X, ArrowLeft, Trophy, ListOrdered, CircleHelp, Brush, Lock } from "lucide-react";
import TagsInput from "@/components/ui/TagsInput";
import { PLANS } from "@/lib/plans";

type CreateEventButtonProps = {
    planSlug: string;
    /**
     * Callback opcional para avisar al padre (DashboardTabs)
     * de que estamos creando un evento. Ideal para mostrar loaders globales.
     */
    onCreatingChange?: (isCreating: boolean) => void;
};

type EventMode = "GALA" | "TIERLIST" | "PREGUNTAS" | "DIBUJO";

const MODES: { id: EventMode; label: string; desc: string; Icon: typeof Trophy }[] = [
    { id: "GALA", label: "Gala", desc: "Premios por categorías estilo GameAwards.", Icon: Trophy },
    { id: "TIERLIST", label: "Tierlist", desc: "Ordena nominados en tiers (S, A, B…).", Icon: ListOrdered },
    { id: "PREGUNTAS", label: "Preguntas", desc: "Formulario tipo test (checkbox / radio).", Icon: CircleHelp },
    { id: "DIBUJO", label: "Dibujo", desc: "Los participantes dibujan y se vota. Premium+.", Icon: Brush },
];

export default function CreateEventButton({
    planSlug,
    onCreatingChange,
}: CreateEventButtonProps) {
    const isPremium = planSlug === "premium" || planSlug === "plus";

    // Límites del plan (display/gating en cliente; el servidor valida de forma autoritativa)
    const planLimits =
        Object.values(PLANS).find((p) => p.slug === planSlug)?.limits ?? PLANS.FREE.limits;
    const drawingAllowed = planLimits.drawingMaxEvents > 0;
    const drawingAllowUnlimited = planLimits.drawingAllowUnlimited;
    const drawingMin = planLimits.drawingMinTimeSecs ?? 10;
    const drawingMax = planLimits.drawingMaxTimeSecs; // number | null

    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [mode, setMode] = useState<EventMode>("GALA");
    const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingPremium, setLoadingPremium] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    // Estado de campos DIBUJO
    const [drawingUnlimited, setDrawingUnlimited] = useState(false);
    const [drawingTime, setDrawingTime] = useState<number>(drawingMin);

    const router = useRouter();

    // Filtro de título (bloquea emojis / símbolos raros)
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const allowed = /^[\w\s\-\.,:;!¡?¿()'`´"áéíóúÁÉÍÓÚñÑüÜ]*$/;
        if (allowed.test(value)) {
            setTitle(value);
            setServerError(null);
        }
    };

    const resetAll = () => {
        setStep(1);
        setMode("GALA");
        setTitle("");
        setTags([]);
        setServerError(null);
        setIsQuotaExceeded(false);
        setDrawingUnlimited(false);
        setDrawingTime(drawingMin);
    };

    async function handleSubmit(formData: FormData) {
        setServerError(null);
        setIsSubmitting(true);
        onCreatingChange?.(true);

        const res = await createEvent(formData);

        if (res?.success && res.eventId) {
            setIsOpen(false);
            resetAll();
            router.push(`/dashboard/event/${res.eventId}`);
        } else {
            if (res?.error && res.error.toLowerCase().includes("límite") && res.error.toLowerCase().includes("plan")) {
                setIsQuotaExceeded(true);
            } else {
                setServerError(res?.error || "Ha ocurrido un error al crear el evento.");
            }
        }

        setIsSubmitting(false);
        onCreatingChange?.(false);
    }

    const openModal = () => {
        resetAll();
        setIsOpen(true);
    };

    const closeModal = () => {
        if (isSubmitting) return;
        setIsOpen(false);
        resetAll();
    };

    const pickMode = (m: EventMode) => {
        setMode(m);
        setServerError(null);
        setStep(2);
    };

    return (
        <>
            {/* Botón principal que abre el modal */}
            <button
                onClick={openModal}
                className="tour-create-btn bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 cursor-pointer"
            >
                <Plus size={20} /> Nuevo Evento
            </button>

            {/* MODAL PRINCIPAL */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border-2 border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        {/* Botón cerrar */}
                        <button
                            onClick={closeModal}
                            className="absolute right-4 top-4 text-gray-400 hover:text-white"
                            disabled={isSubmitting}
                        >
                            <X size={18} />
                        </button>

                        {/* CASO: LÍMITE ALCANZADO → UPGRADE */}
                        {isQuotaExceeded ? (
                            <>
                                <h4 className="text-xl font-bold text-indigo-400 mb-4 pb-2 border-b-2 border-indigo-600">
                                    Límite alcanzado
                                </h4>
                                <p className="text-white mb-6 text-sm">
                                    Has llegado al número máximo de eventos para tu plan actual.
                                    <br />
                                    Para crear más eventos, necesitas unirte a{" "}
                                    <b>{isPremium ? "Premium+" : "Premium"}</b>.
                                </p>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold transition-colors cursor-pointer"
                                        disabled={loadingPremium}
                                    >
                                        Cerrar
                                    </button>
                                    <Link
                                        href="/premium"
                                        onClick={() => setLoadingPremium(true)}
                                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded text-white font-bold transition-colors text-center flex justify-center items-center disabled:opacity-50"
                                    >
                                        {loadingPremium ? (
                                            <Bouncy size="28" speed="1.75" color="#fff" />
                                        ) : (
                                            "Unirme ahora"
                                        )}
                                    </Link>
                                </div>
                            </>
                        ) : step === 1 ? (
                            /* PASO 1: SELECTOR DE MODO */
                            <>
                                <h2 className="text-xl font-bold text-white mb-1">Elige el tipo de evento</h2>
                                <p className="text-xs text-gray-500 mb-5">Cada formato tiene su propia forma de votar.</p>

                                <div className="grid grid-cols-2 gap-3">
                                    {MODES.map(({ id, label, desc, Icon }) => {
                                        const locked = id === "DIBUJO" && !drawingAllowed;
                                        return (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => (locked ? setIsQuotaExceeded(true) : pickMode(id))}
                                                className={`relative text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                                    locked
                                                        ? "border-white/10 bg-white/[0.02] opacity-70 hover:opacity-100"
                                                        : "border-white/15 bg-white/[0.03] hover:border-blue-500/60 hover:bg-blue-500/5"
                                                }`}
                                            >
                                                {locked && (
                                                    <span className="absolute right-2 top-2 text-amber-400" title="Requiere Premium o superior">
                                                        <Lock size={14} />
                                                    </span>
                                                )}
                                                <Icon size={22} className={locked ? "text-gray-500" : "text-blue-400"} />
                                                <div className="mt-2 font-bold text-white text-sm">{label}</div>
                                                <div className="text-[11px] text-gray-500 leading-snug mt-0.5">{desc}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            /* PASO 2: FORMULARIO */
                            <>
                                <div className="flex items-center gap-2 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        disabled={isSubmitting}
                                        className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                                        title="Cambiar tipo"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <h2 className="text-xl font-bold text-white">
                                        Nuevo evento · <span className="text-blue-400">{MODES.find((m) => m.id === mode)?.label}</span>
                                    </h2>
                                </div>

                                <form action={handleSubmit} className="space-y-4">
                                    <input type="hidden" name="mode" value={mode} />

                                    <div>
                                        <label className="text-xs text-gray-500 uppercase block mb-1">Nombre del Evento</label>
                                        <input
                                            name="title"
                                            required
                                            maxLength={40}
                                            value={title}
                                            onChange={handleTitleChange}
                                            placeholder="Ej: Premios Verano 2025"
                                            className="tour-modal-title w-full bg-black border-2 border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors"
                                            autoFocus
                                            disabled={isSubmitting}
                                        />
                                        <p className="text-[10px] text-gray-600 mt-1">Solo letras, números y puntuación básica.</p>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 uppercase block mb-1">Descripción</label>
                                        <textarea
                                            name="description"
                                            rows={3}
                                            maxLength={100}
                                            placeholder={mode === "TIERLIST" ? "El tema de tu tierlist…" : "¿De qué va este evento?"}
                                            className="tour-modal-description w-full bg-black border-2 border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors resize-none"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 uppercase block mb-1">Etiquetas</label>
                                        <TagsInput value={tags} onChange={setTags} disabled={isSubmitting} name="tags" />
                                    </div>

                                    {/* CAMPOS EXCLUSIVOS DE DIBUJO */}
                                    {mode === "DIBUJO" && (
                                        <div className="space-y-4 p-3 rounded-xl border-2 border-blue-500/20 bg-blue-500/5">
                                            <div>
                                                <label className="text-xs text-gray-400 uppercase block mb-1">Tema a dibujar</label>
                                                <input
                                                    name="drawingPrompt"
                                                    maxLength={500}
                                                    placeholder="Ej: Dibuja tu superhéroe favorito"
                                                    className="w-full bg-black border-2 border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-gray-400 uppercase block mb-1">Cierre dibujo</label>
                                                    <input
                                                        type="datetime-local"
                                                        name="drawingDeadline"
                                                        required
                                                        className="w-full bg-black border-2 border-white/20 rounded p-2 text-white text-sm focus:border-blue-500 outline-none [color-scheme:dark]"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-400 uppercase block mb-1">Cierre votación</label>
                                                    <input
                                                        type="datetime-local"
                                                        name="votingDeadline"
                                                        required
                                                        className="w-full bg-black border-2 border-white/20 rounded p-2 text-white text-sm focus:border-blue-500 outline-none [color-scheme:dark]"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-xs text-gray-400 uppercase">Tiempo por dibujo</label>
                                                    {drawingAllowUnlimited && (
                                                        <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                name="drawingUnlimited"
                                                                checked={drawingUnlimited}
                                                                onChange={(e) => setDrawingUnlimited(e.target.checked)}
                                                            />
                                                            Sin límite
                                                        </label>
                                                    )}
                                                </div>
                                                {!drawingUnlimited && (
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="range"
                                                            name="drawingTimeLimit"
                                                            min={drawingMin}
                                                            max={drawingMax ?? 600}
                                                            step={5}
                                                            value={drawingTime}
                                                            onChange={(e) => setDrawingTime(Number(e.target.value))}
                                                            className="flex-1 accent-blue-500"
                                                            disabled={isSubmitting}
                                                        />
                                                        <span className="text-sm text-white font-mono w-16 text-right">{drawingTime}s</span>
                                                    </div>
                                                )}
                                                <p className="text-[10px] text-gray-600 mt-1">
                                                    {drawingAllowUnlimited
                                                        ? `Mín. ${drawingMin}s · puedes elegir sin límite.`
                                                        : `Entre ${drawingMin}s y ${drawingMax ?? "?"}s (tu plan no permite tiempo ilimitado).`}
                                                </p>
                                            </div>
                                            <p className="text-[10px] text-amber-400/80">Los eventos de Dibujo son siempre privados.</p>
                                        </div>
                                    )}

                                    {serverError && (
                                        <div className="p-3 bg-red-500/10 border-2 border-red-500/30 rounded text-red-300 text-sm">
                                            {serverError}
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold transition-colors cursor-pointer"
                                            disabled={isSubmitting}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || title.trim().length < 3}
                                            className="tour-modal-submit flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {isSubmitting ? (
                                                <Bouncy size="32" speed="1.75" color="#fff" />
                                            ) : (
                                                <>
                                                    <Plus size={18} />
                                                    Crear Evento
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
