"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    HelpCircle, X, Map, BookOpen, Gamepad2,
    ChevronRight, Lock, Sparkles, ArrowRight,
} from "lucide-react";

type Props = {
    canCreateMore: boolean;
};

export default function HelpButton({ canCreateMore }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [showCreateSub, setShowCreateSub] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setShowCreateSub(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleWebTour = () => {
        setIsOpen(false);
        setShowCreateSub(false);
        if (typeof window !== "undefined" && window.location.pathname === "/dashboard") {
            window.dispatchEvent(new CustomEvent("pollnow:tour", { detail: "web" }));
        } else {
            router.push("/dashboard?tour=web");
        }
    };

    const handleTutorialPage = () => {
        setIsOpen(false);
        setShowCreateSub(false);
        router.push("/help/create-event");
    };

    const handleGuidedTour = () => {
        if (!canCreateMore) return;
        setIsOpen(false);
        setShowCreateSub(false);
        if (typeof window !== "undefined" && window.location.pathname === "/dashboard") {
            window.dispatchEvent(new CustomEvent("pollnow:tour", { detail: "create" }));
        } else {
            router.push("/dashboard?tab=events&tour=create");
        }
    };

    return (
        <div className="fixed top-28 right-5 md:top-30 md:right-10 z-50" ref={menuRef}>
            {/* ── Floating menu ─────────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute top-15 right-0 w-72 bg-neutral-900 border-2 border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2 bg-violet-500/5">
                            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                                <Sparkles size={12} className="text-violet-400" />
                            </div>
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                                Centro de ayuda
                            </span>
                        </div>

                        {/* Tour por la web */}
                        <button
                            onClick={handleWebTour}
                            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors group border-b border-white/5 cursor-pointer"
                        >
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                <Map size={15} className="text-blue-400" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-semibold text-white">Tour por la web</p>
                                <p className="text-[11px] text-gray-500 leading-tight">
                                    Recorre las funciones principales de POLLNOW
                                </p>
                            </div>
                            <ArrowRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                        </button>

                        {/* Crear un evento */}
                        <button
                            onClick={() => setShowCreateSub(p => !p)}
                            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors group cursor-pointer"
                        >
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                <BookOpen size={15} className="text-emerald-400" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-semibold text-white">Crear un evento</p>
                                <p className="text-[11px] text-gray-500 leading-tight">
                                    Aprende a crear tu primera gala
                                </p>
                            </div>
                            <motion.div
                                animate={{ rotate: showCreateSub ? 90 : 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                            </motion.div>
                        </button>

                        {/* Submenu: crear evento */}
                        <AnimatePresence>
                            {showCreateSub && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden bg-black/20"
                                >
                                    {/* Tutorial visual */}
                                    <button
                                        onClick={handleTutorialPage}
                                        className="w-full flex items-center gap-3 px-5 py-3 pl-8 hover:bg-white/5 transition-colors group cursor-pointer border-t border-white/5"
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                                            <BookOpen size={13} className="text-violet-400" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-medium text-white">Tutorial visual</p>
                                            <p className="text-[10px] text-gray-500 leading-tight">
                                                Guía detallada paso a paso
                                            </p>
                                        </div>
                                        <ArrowRight size={12} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                    </button>

                                    {/* Tutorial guiado */}
                                    <button
                                        onClick={handleGuidedTour}
                                        disabled={!canCreateMore}
                                        className={`w-full flex items-center gap-3 px-5 py-3 pl-8 transition-colors border-t border-white/5
                                            ${canCreateMore
                                                ? "hover:bg-white/5 cursor-pointer group"
                                                : "opacity-50 cursor-not-allowed"
                                            }`}
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                            <Gamepad2 size={13} className="text-amber-400" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-medium text-white">Tour guiado</p>
                                                {!canCreateMore && (
                                                    <Lock size={10} className="text-gray-500" />
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-500 leading-tight">
                                                {canCreateMore
                                                    ? "Interactivo, como un videojuego"
                                                    : "Límite de eventos alcanzado"
                                                }
                                            </p>
                                        </div>
                                        {canCreateMore
                                            ? <ArrowRight size={12} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                                            : <Lock size={12} className="text-gray-600" />
                                        }
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Floating button ────────────────────────────────────── */}
            <motion.button
                onClick={() => { setIsOpen(p => !p); setShowCreateSub(false); }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className={`w-10 h-10 rounded-full shadow-2xl flex items-center justify-center transition-colors cursor-pointer
                    ${isOpen
                        ? "bg-violet-600 border-2 border-violet-400/50"
                        : "bg-neutral-800 border-2 border-white/15 hover:border-violet-500/50 hover:bg-neutral-700"
                    }`}
                style={{ width: 42, height: 42 }}
                aria-label="Centro de ayuda"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <X size={20} className="text-white" />
                        </motion.div>
                    ) : (
                        <motion.div key="help" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <HelpCircle size={22} className="text-gray-300" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
