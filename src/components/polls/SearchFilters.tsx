"use client";

import { Search, Flame, Clock, TrendingUp, TrendingDown, CalendarClock, Hourglass, Flag, Dice5, X } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Ordenaciones simples (un solo estado). Las posiciones intermedias las ocupan
// el toggle de valoración y el toggle de estado.
const LEADING_SORTS = [
    { value: "recent", label: "Recientes", icon: Clock },
    { value: "popular", label: "Populares", icon: Flame },
] as const;

const TRAILING_SORTS = [
    { value: "oldest", label: "Más antiguos", icon: CalendarClock },
] as const;

type SortValue = "recent" | "popular" | "top" | "worst" | "oldest";

export default function SearchFilters({
    currentSort = "recent",
    currentTag = "",
    currentStatus = "",
}: {
    currentSort?: string;
    currentTag?: string;
    currentStatus?: string;
}) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [randomLoading, setRandomLoading] = useState(false);

    const updateParam = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set(key, value);
        else params.delete(key);
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleSearch = useDebouncedCallback((term: string) => {
        updateParam("q", term || null);
    }, 300);

    const handleSort = (sort: SortValue) => {
        updateParam("sort", sort === "recent" ? null : sort);
    };

    const handleRandomClick = async () => {
        setRandomLoading(true);
        try {
            const res = await fetch("/api/events/random");
            if (res.ok) {
                const { slug } = await res.json();
                router.push(`/e/${slug}`);
            }
        } catch {
            // silent fail
        } finally {
            setRandomLoading(false);
        }
    };

    const activeSort = (currentSort || "recent") as SortValue;

    // Toggle de valoración: alterna entre "Mejor valorados" y "Peor valorados".
    const ratingActive = activeSort === "top" || activeSort === "worst";
    const ratingIsWorst = activeSort === "worst";
    const handleRatingClick = () => {
        // Primer clic activa "Mejor valorados"; los siguientes alternan top ↔ worst.
        if (!ratingActive) handleSort("top");
        else handleSort(ratingIsWorst ? "top" : "worst");
    };

    // Toggle de estado: ciclo inactivo → "No finalizado" → "Finalizado" → inactivo.
    const statusActive = currentStatus === "active" || currentStatus === "ended";
    const statusIsEnded = currentStatus === "ended";
    const handleStatusClick = () => {
        if (currentStatus === "active") updateParam("status", "ended");
        else if (currentStatus === "ended") updateParam("status", null);
        else updateParam("status", "active");
    };

    const chipClass = (isActive: boolean) =>
        `flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border-2 transition-all whitespace-nowrap cursor-pointer shrink-0 ${isActive
            ? "border-blue-500/60 bg-blue-500/15 text-blue-300"
            : "border-white/10 bg-white/3 text-gray-500 hover:border-white/20 hover:text-gray-300"
        }`;

    const RatingIcon = ratingIsWorst ? TrendingDown : TrendingUp;
    const StatusIcon = statusIsEnded ? Flag : Hourglass;

    return (
        <div className="w-full space-y-3">
            {/* Row 1: Search + Random */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
                    <input
                        onChange={(e) => handleSearch(e.target.value)}
                        defaultValue={searchParams.get("q")?.toString()}
                        placeholder="Buscar eventos, descripciones..."
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border-2 border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all text-sm"
                    />
                </div>

                {/* Random button */}
                <motion.button
                    onClick={handleRandomClick}
                    disabled={randomLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Evento aleatorio"
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full font-bold text-md transition-all shadow-lg shadow-violet-900/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                    <motion.span
                        animate={randomLoading ? { rotate: 360 } : { rotate: 0 }}
                        transition={randomLoading ? { duration: 0.5, repeat: Infinity, ease: "linear" } : {}}
                    >
                        <Dice5 size={24} strokeWidth={2.5} />
                    </motion.span>
                    <span className="hidden sm:inline">Random</span>
                </motion.button>
            </div>

            {/* Row 2: Sort chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none md:justify-center">
                {LEADING_SORTS.map(({ value, label, icon: Icon }) => (
                    <motion.button
                        key={value}
                        onClick={() => handleSort(value)}
                        whileTap={{ scale: 0.95 }}
                        className={chipClass(activeSort === value)}
                    >
                        <Icon size={12} />
                        {label}
                    </motion.button>
                ))}

                {/* Toggle valoración: Mejor valorados ↔ Peor valorados */}
                <motion.button
                    onClick={handleRatingClick}
                    whileTap={{ scale: 0.95 }}
                    className={chipClass(ratingActive)}
                >
                    <RatingIcon size={12} />
                    {ratingIsWorst ? "Peor valorados" : "Mejor valorados"}
                </motion.button>

                {/* Toggle estado: No finalizado ↔ Finalizado */}
                <motion.button
                    onClick={handleStatusClick}
                    whileTap={{ scale: 0.95 }}
                    className={chipClass(statusActive)}
                >
                    <StatusIcon size={12} />
                    {statusIsEnded ? "Finalizado" : "No finalizado"}
                </motion.button>

                {TRAILING_SORTS.map(({ value, label, icon: Icon }) => (
                    <motion.button
                        key={value}
                        onClick={() => handleSort(value)}
                        whileTap={{ scale: 0.95 }}
                        className={chipClass(activeSort === value)}
                    >
                        <Icon size={12} />
                        {label}
                    </motion.button>
                ))}
            </div>

            {/* Active tag filter chip */}
            <AnimatePresence>
                {currentTag && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Filtrando por etiqueta:</span>
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/15 border-2 border-blue-500/30 rounded-full text-xs text-blue-300 font-semibold">
                                #{currentTag}
                                <button
                                    onClick={() => updateParam("tag", null)}
                                    className="text-blue-400/70 hover:text-white transition-colors cursor-pointer"
                                >
                                    <X size={11} />
                                </button>
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
