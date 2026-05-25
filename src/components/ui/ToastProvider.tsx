"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

type Toast = {
    id: number;
    text: string;
    type: ToastType;
};

type ToastApi = {
    success: (text: string) => void;
    error: (text: string) => void;
    info: (text: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const STYLES: Record<ToastType, string> = {
    success: "bg-emerald-900/80 border-emerald-500/40 text-emerald-100",
    error: "bg-red-900/80 border-red-500/40 text-red-100",
    info: "bg-blue-900/80 border-blue-500/40 text-blue-100",
};

function ToastIcon({ type }: { type: ToastType }) {
    if (type === "success") return <CheckCircle size={18} className="text-emerald-300 shrink-0" />;
    if (type === "error") return <XCircle size={18} className="text-red-300 shrink-0" />;
    return <Info size={18} className="text-blue-300 shrink-0" />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const pushToast = useCallback((text: string, type: ToastType) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, text, type }].slice(-3));
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const api: ToastApi = {
        success: (text) => pushToast(text, "success"),
        error: (text) => pushToast(text, "error"),
        info: (text) => pushToast(text, "info"),
    };

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className="fixed top-20 inset-x-4 md:inset-x-auto md:right-6 z-[200] flex flex-col items-center md:items-end gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            layout
                            initial={{ opacity: 0, y: -16, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.9 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className={`pointer-events-auto w-full max-w-sm rounded-xl border-2 px-4 py-3 text-sm shadow-lg backdrop-blur-md ${STYLES[toast.type]}`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2">
                                    <ToastIcon type={toast.type} />
                                    <p>{toast.text}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeToast(toast.id)}
                                    className="ml-2 text-xs text-gray-300 hover:text-white cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastApi {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast debe usarse dentro de <ToastProvider>");
    }
    return ctx;
}
