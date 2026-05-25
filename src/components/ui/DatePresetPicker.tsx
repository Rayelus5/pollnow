"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock } from "lucide-react";
import { formatDate } from "@/lib/format-date";

export type DatePreset = { label: string; ms: number };

type Props = {
    /** Nombre del input hidden que se envía en el formulario (valor en ISO/UTC). */
    name: string;
    label: string;
    presets: DatePreset[];
    /** Índice del preset seleccionado por defecto. */
    defaultPresetIndex?: number;
    /** "absolute": ahora + offset · "relative": baseISO + offset. */
    mode?: "absolute" | "relative";
    /** Fecha base (ISO) para el modo "relative". */
    baseISO?: string | null;
    disabled?: boolean;
    /** Notifica el valor ISO resultante (para encadenar pickers). */
    onChange?: (iso: string) => void;
};

/** Date → "YYYY-MM-DDTHH:mm" en hora local (para input datetime-local). */
function toLocalInput(d: Date): string {
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function DatePresetPicker({
    name,
    label,
    presets,
    defaultPresetIndex = 0,
    mode = "absolute",
    baseISO,
    disabled,
    onChange,
}: Props) {
    const [selected, setSelected] = useState<number | "custom">(defaultPresetIndex);
    const [customLocal, setCustomLocal] = useState("");

    // Base sobre la que se calcula el resultado (ahora, o la fecha base en modo relativo).
    const baseMs = useMemo(() => {
        if (mode === "relative") {
            const t = baseISO ? new Date(baseISO).getTime() : NaN;
            return isNaN(t) ? Date.now() : t;
        }
        return Date.now();
    }, [mode, baseISO]);

    // Fecha resultante según la selección.
    const resultDate: Date | null = useMemo(() => {
        if (selected === "custom") {
            if (!customLocal) return null;
            const d = new Date(customLocal);
            return isNaN(d.getTime()) ? null : d;
        }
        return new Date(baseMs + presets[selected].ms);
    }, [selected, customLocal, baseMs, presets]);

    const iso = resultDate ? resultDate.toISOString() : "";

    useEffect(() => {
        onChange?.(iso);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iso]);

    // Al cambiar a "personalizado", prerrellenar con la fecha del preset activo.
    const enableCustom = () => {
        if (selected !== "custom") {
            const seed = resultDate ?? new Date(baseMs + presets[defaultPresetIndex].ms);
            setCustomLocal(toLocalInput(seed));
        }
        setSelected("custom");
    };

    return (
        <div>
            <label className="text-xs text-gray-400 uppercase block mb-2 flex items-center gap-1.5">
                <CalendarClock size={13} /> {label}
            </label>

            <div className="flex flex-wrap gap-2">
                {presets.map((p, i) => {
                    const active = selected === i;
                    return (
                        <motion.button
                            key={p.label}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            disabled={disabled}
                            onClick={() => setSelected(i)}
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
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    disabled={disabled}
                    onClick={enableCustom}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-colors cursor-pointer disabled:opacity-50 ${
                        selected === "custom"
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-white/[0.03] border-white/15 text-gray-300 hover:border-blue-500/50"
                    }`}
                >
                    Personalizado
                </motion.button>
            </div>

            <AnimatePresence initial={false}>
                {selected === "custom" && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <input
                            type="datetime-local"
                            value={customLocal}
                            min={toLocalInput(new Date())}
                            disabled={disabled}
                            onChange={(e) => setCustomLocal(e.target.value)}
                            className="mt-3 w-full bg-black border-2 border-white/20 rounded-lg p-2.5 text-white text-sm focus:border-blue-500 outline-none [color-scheme:dark]"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="text-[11px] text-gray-500 mt-2">
                {resultDate ? `≈ ${formatDate(resultDate, true)}` : "Selecciona una fecha"}
            </p>

            <input type="hidden" name={name} value={iso} />
        </div>
    );
}
