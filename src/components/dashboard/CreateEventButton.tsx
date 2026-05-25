"use client";

import { useState } from "react";
import { createEvent } from "@/app/lib/dashboard-actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ArrowLeft, ArrowRight, Trophy, ListOrdered, CircleHelp, Brush, Lock, Check } from "lucide-react";
import TagsInput from "@/components/ui/TagsInput";
import DatePresetPicker, { type DatePreset } from "@/components/ui/DatePresetPicker";
import { PLANS } from "@/lib/plans";

type CreateEventButtonProps = {
    planSlug: string;
    onCreatingChange?: (isCreating: boolean) => void;
};

type EventMode = "GALA" | "TIERLIST" | "PREGUNTAS" | "DIBUJO";

const MODES: { id: EventMode; label: string; desc: string; Icon: typeof Trophy }[] = [
    { id: "GALA", label: "Gala", desc: "Premios por categorías estilo GameAwards.", Icon: Trophy },
    { id: "TIERLIST", label: "Tierlist", desc: "Ordena nominados en tiers (S, A, B…).", Icon: ListOrdered },
    { id: "PREGUNTAS", label: "Preguntas", desc: "Formulario tipo test (checkbox / radio).", Icon: CircleHelp },
    { id: "DIBUJO", label: "Dibujo", desc: "Los participantes dibujan y se vota. Premium+.", Icon: Brush },
];

const HOUR = 3600_000;
const DAY = 86400_000;

// Presets de fecha de fin/cierre para GALA, TIERLIST y PREGUNTAS.
const END_PRESETS: DatePreset[] = [
    { label: "1 día", ms: DAY },
    { label: "7 días", ms: 7 * DAY },
    { label: "30 días", ms: 30 * DAY },
    { label: "90 días", ms: 90 * DAY },
];
// Duración de la fase de dibujo (desde ahora).
const DRAW_PRESETS: DatePreset[] = [
    { label: "1 hora", ms: HOUR },
    { label: "6 horas", ms: 6 * HOUR },
    { label: "12 horas", ms: 12 * HOUR },
    { label: "1 día", ms: DAY },
];
// Duración de la votación (tras el cierre del dibujo).
const VOTE_AFTER_PRESETS: DatePreset[] = [
    { label: "1 día", ms: DAY },
    { label: "3 días", ms: 3 * DAY },
    { label: "7 días", ms: 7 * DAY },
];

// Presets de tiempo por dibujo (en segundos).
const TIME_PRESETS: { label: string; s: number }[] = [
    { label: "30 seg", s: 30 },
    { label: "1 min", s: 60 },
    { label: "2 min", s: 120 },
];

const END_LABEL: Record<EventMode, string> = {
    GALA: "¿Cuándo se celebra la gala?",
    TIERLIST: "¿Cuándo cierra la votación?",
    PREGUNTAS: "¿Cuándo cierra el formulario?",
    DIBUJO: "",
};

const STEPS = ["Tipo", "Datos", "Fechas"] as const;

export default function CreateEventButton({ planSlug, onCreatingChange }: CreateEventButtonProps) {
    const isPremium = planSlug === "premium" || planSlug === "plus";

    const planLimits = Object.values(PLANS).find((p) => p.slug === planSlug)?.limits ?? PLANS.FREE.limits;
    const drawingAllowed = planLimits.drawingMaxEvents > 0;
    const drawingAllowUnlimited = planLimits.drawingAllowUnlimited;
    const drawingMin = planLimits.drawingMinTimeSecs ?? 10;
    const drawingMax = planLimits.drawingMaxTimeSecs; // number | null

    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [direction, setDirection] = useState(1);
    const [mode, setMode] = useState<EventMode>("GALA");
    const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingPremium, setLoadingPremium] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // Campos del formulario (estado elevado para conservar datos entre fases).
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [drawingPrompt, setDrawingPrompt] = useState("");
    const [drawingDeadlineISO, setDrawingDeadlineISO] = useState("");
    const [drawingUnlimited, setDrawingUnlimited] = useState(false);
    const [drawingTime, setDrawingTime] = useState<number>(drawingMin);

    const router = useRouter();

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
        setDirection(1);
        setMode("GALA");
        setTitle("");
        setDescription("");
        setTags([]);
        setServerError(null);
        setIsQuotaExceeded(false);
        setDrawingPrompt("");
        setDrawingDeadlineISO("");
        setDrawingUnlimited(false);
        setDrawingTime(drawingMin);
    };

    async function handleSubmit(formData: FormData) {
        // Solo se crea el evento desde la última fase (evita envíos accidentales).
        if (step !== 3) return;
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

    const goTo = (next: 1 | 2 | 3) => {
        setDirection(next >= step ? 1 : -1);
        setStep(next);
    };

    const pickMode = (m: EventMode) => {
        setMode(m);
        setServerError(null);
        goTo(2);
    };

    const slide = {
        enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
    };

    const canContinueBasics = title.trim().length >= 3;

    // Tiempo por dibujo: límites del plan, clamp y porcentaje para el slider.
    const drawingMaxSecs = drawingMax ?? 600;
    const clampTime = (v: number) => Math.max(drawingMin, Math.min(drawingMaxSecs, Math.round(v) || drawingMin));
    const timePct = Math.round(((drawingTime - drawingMin) / Math.max(1, drawingMaxSecs - drawingMin)) * 100);
    const timePresets = TIME_PRESETS.filter((p) => p.s >= drawingMin && p.s <= drawingMaxSecs);

    return (
        <>
            <button
                onClick={openModal}
                className="tour-create-btn bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 cursor-pointer"
            >
                <Plus size={20} /> Nuevo Evento
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border-2 border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
                        <button
                            onClick={closeModal}
                            className="absolute right-4 top-4 text-gray-400 hover:text-white z-10 cursor-pointer"
                            disabled={isSubmitting}
                        >
                            <X size={18} />
                        </button>

                        {isQuotaExceeded ? (
                            <>
                                <h4 className="text-xl font-bold text-indigo-400 mb-4 pb-2 border-b-2 border-indigo-600">
                                    Límite alcanzado
                                </h4>
                                <p className="text-white mb-6 text-sm">
                                    Has llegado al número máximo de eventos para tu plan actual.
                                    <br />
                                    Para crear más eventos, necesitas unirte a <b>{isPremium ? "Premium+" : "Premium"}</b>.
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
                                        {loadingPremium ? <Bouncy size="28" speed="1.75" color="#fff" /> : "Unirme ahora"}
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Cabecera con progreso */}
                                <div className="mb-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        {step > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => goTo((step - 1) as 1 | 2 | 3)}
                                                disabled={isSubmitting}
                                                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                                                title="Atrás"
                                            >
                                                <ArrowLeft size={18} />
                                            </button>
                                        )}
                                        <h2 className="text-lg font-bold text-white">
                                            {step === 1 && "Elige el tipo de evento"}
                                            {step === 2 && (
                                                <>Datos · <span className="text-blue-400">{MODES.find((m) => m.id === mode)?.label}</span></>
                                            )}
                                            {step === 3 && (
                                                <>Fechas · <span className="text-blue-400">{MODES.find((m) => m.id === mode)?.label}</span></>
                                            )}
                                        </h2>
                                    </div>
                                    {/* Barra de pasos */}
                                    <div className="flex items-center gap-2">
                                        {STEPS.map((label, i) => {
                                            const n = (i + 1) as 1 | 2 | 3;
                                            const done = n < step;
                                            const current = n === step;
                                            return (
                                                <div key={label} className="flex items-center gap-2 flex-1">
                                                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-blue-500"
                                                            initial={false}
                                                            animate={{ width: done || current ? "100%" : "0%" }}
                                                            transition={{ duration: 0.3 }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <form action={handleSubmit}>
                                    {/* Inputs ocultos persistentes (los campos visibles son controlados sin name) */}
                                    <input type="hidden" name="mode" value={mode} />
                                    <input type="hidden" name="title" value={title} />
                                    <input type="hidden" name="description" value={description} />
                                    <input type="hidden" name="tags" value={tags.join(",")} />

                                    <AnimatePresence mode="wait" custom={direction}>
                                        {/* PASO 1: TIPO */}
                                        {step === 1 && (
                                            <motion.div
                                                key="step1"
                                                custom={direction}
                                                variants={slide}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                transition={{ duration: 0.22 }}
                                            >
                                                <p className="text-xs text-gray-500 mb-4">Cada formato tiene su propia forma de votar.</p>
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
                                                                        : mode === id
                                                                            ? "border-blue-500/60 bg-blue-500/5"
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
                                            </motion.div>
                                        )}

                                        {/* PASO 2: DATOS BÁSICOS */}
                                        {step === 2 && (
                                            <motion.div
                                                key="step2"
                                                custom={direction}
                                                variants={slide}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                transition={{ duration: 0.22 }}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase block mb-1">Nombre del Evento</label>
                                                    <input
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
                                                        rows={3}
                                                        maxLength={100}
                                                        value={description}
                                                        onChange={(e) => setDescription(e.target.value)}
                                                        placeholder={mode === "TIERLIST" ? "El tema de tu tierlist…" : "¿De qué va este evento?"}
                                                        className="tour-modal-description w-full bg-black border-2 border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors resize-none"
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 uppercase block mb-1">Etiquetas</label>
                                                    <TagsInput value={tags} onChange={setTags} disabled={isSubmitting} name="" />
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* PASO 3: FECHAS Y OPCIONES */}
                                        {step === 3 && (
                                            <motion.div
                                                key="step3"
                                                custom={direction}
                                                variants={slide}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                transition={{ duration: 0.22 }}
                                                className="space-y-4"
                                            >
                                                {mode !== "DIBUJO" ? (
                                                    <DatePresetPicker
                                                        name="galaDate"
                                                        label={END_LABEL[mode]}
                                                        presets={END_PRESETS}
                                                        defaultPresetIndex={1}
                                                        disabled={isSubmitting}
                                                    />
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-xs text-gray-400 uppercase block mb-1">Tema a dibujar</label>
                                                            <input
                                                                name="drawingPrompt"
                                                                maxLength={500}
                                                                value={drawingPrompt}
                                                                onChange={(e) => setDrawingPrompt(e.target.value)}
                                                                placeholder="Ej: Dibuja tu superhéroe favorito"
                                                                className="w-full bg-black border-2 border-white/20 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors"
                                                                disabled={isSubmitting}
                                                            />
                                                        </div>
                                                        <DatePresetPicker
                                                            name="drawingDeadline"
                                                            label="¿Cuánto dura la fase de dibujo?"
                                                            presets={DRAW_PRESETS}
                                                            defaultPresetIndex={3}
                                                            disabled={isSubmitting}
                                                            onChange={setDrawingDeadlineISO}
                                                        />
                                                        <DatePresetPicker
                                                            name="votingDeadline"
                                                            label="¿Cuánto dura la votación después?"
                                                            presets={VOTE_AFTER_PRESETS}
                                                            defaultPresetIndex={0}
                                                            mode="relative"
                                                            baseISO={drawingDeadlineISO}
                                                            disabled={isSubmitting}
                                                        />
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
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

                                                            {drawingUnlimited ? (
                                                                <p className="text-sm text-gray-400 bg-white/5 border-2 border-white/10 rounded-lg p-3">
                                                                    Sin límite de tiempo: los participantes podrán dibujar sin reloj.
                                                                </p>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    {/* Valor enviado al servidor */}
                                                                    <input type="hidden" name="drawingTimeLimit" value={drawingTime} />

                                                                    {/* Presets + input manual */}
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        {timePresets.map((p) => {
                                                                            const active = drawingTime === p.s;
                                                                            return (
                                                                                <motion.button
                                                                                    key={p.s}
                                                                                    type="button"
                                                                                    whileTap={{ scale: 0.95 }}
                                                                                    disabled={isSubmitting}
                                                                                    onClick={() => setDrawingTime(clampTime(p.s))}
                                                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-colors cursor-pointer disabled:opacity-50 ${
                                                                                        active
                                                                                            ? "bg-blue-600 border-blue-500 text-white"
                                                                                            : "bg-white/[0.03] border-white/15 text-gray-300 hover:border-blue-500/50"
                                                                                    }`}
                                                                                >
                                                                                    {p.label}
                                                                                </motion.button>
                                                                            );
                                                                        })}
                                                                        <div className="flex items-center gap-1.5 ml-auto">
                                                                            <input
                                                                                type="number"
                                                                                min={drawingMin}
                                                                                max={drawingMaxSecs}
                                                                                value={drawingTime}
                                                                                onChange={(e) => setDrawingTime(Number(e.target.value))}
                                                                                onBlur={() => setDrawingTime(clampTime(drawingTime))}
                                                                                disabled={isSubmitting}
                                                                                className="w-20 bg-black border-2 border-white/20 rounded-lg p-2 text-white text-sm text-right focus:border-blue-500 outline-none"
                                                                            />
                                                                            <span className="text-xs text-gray-500">seg</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Slider con pista rellena */}
                                                                    <input
                                                                        type="range"
                                                                        min={drawingMin}
                                                                        max={drawingMaxSecs}
                                                                        step={5}
                                                                        value={drawingTime}
                                                                        onChange={(e) => setDrawingTime(Number(e.target.value))}
                                                                        disabled={isSubmitting}
                                                                        className="w-full h-2 appearance-none rounded-full cursor-pointer accent-blue-500 disabled:opacity-50"
                                                                        style={{ background: `linear-gradient(to right, #3b82f6 ${timePct}%, rgba(255,255,255,0.12) ${timePct}%)` }}
                                                                    />
                                                                    <div className="flex justify-between text-[10px] text-gray-600">
                                                                        <span>{drawingMin}s</span>
                                                                        <span className="text-blue-400 font-mono font-bold">{drawingTime}s</span>
                                                                        <span>{drawingMaxSecs}s</span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <p className="text-[10px] text-gray-600 mt-2">
                                                                {drawingAllowUnlimited
                                                                    ? `Mín. ${drawingMin}s · puedes elegir sin límite.`
                                                                    : `Entre ${drawingMin}s y ${drawingMaxSecs}s (tu plan no permite tiempo ilimitado).`}
                                                            </p>
                                                        </div>
                                                        <p className="text-[10px] text-amber-400/80">Los eventos de Dibujo son siempre privados.</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {serverError && (
                                        <div className="mt-4 p-3 bg-red-500/10 border-2 border-red-500/30 rounded text-red-300 text-sm">
                                            {serverError}
                                        </div>
                                    )}

                                    {/* Acciones de navegación */}
                                    {step !== 1 && (
                                        <div className="flex gap-3 pt-5">
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded text-gray-300 font-bold transition-colors cursor-pointer"
                                                disabled={isSubmitting}
                                            >
                                                Cancelar
                                            </button>
                                            {step === 2 ? (
                                                <button
                                                    key="next"
                                                    type="button"
                                                    onClick={() => goTo(3)}
                                                    disabled={!canContinueBasics || isSubmitting}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                >
                                                    Siguiente <ArrowRight size={18} />
                                                </button>
                                            ) : (
                                                <button
                                                    key="create"
                                                    type="submit"
                                                    disabled={isSubmitting || !canContinueBasics}
                                                    className="tour-modal-submit flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                >
                                                    {isSubmitting ? <Bouncy size="32" speed="1.75" color="#fff" /> : <><Check size={18} /> Crear Evento</>}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
