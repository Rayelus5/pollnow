"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Link2, MessageCircle, Send, Twitter, Facebook, Mail, Check, Loader2, X } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

type Props = {
    eventTitle: string;
    slug: string;
    isPublic: boolean;
    accessKey: string;
};

function escapeHtml(s: string) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

type CopyState = "idle" | "copying" | "copied";

export default function EventShareButton({ eventTitle, slug, isPublic, accessKey }: Props) {
    const toast = useToast();
    const [open, setOpen] = useState(false);
    const [copyState, setCopyState] = useState<CopyState>("idle");
    const [canNativeShare, setCanNativeShare] = useState(false);
    const [url, setUrl] = useState("");

    // El origin solo existe en el cliente; lo resolvemos tras montar para evitar
    // diferencias de hidratación. La native share API también se detecta aquí.
    useEffect(() => {
        const origin = window.location.origin;
        setUrl(`${origin}/e/${slug}${isPublic ? "" : `?key=${accessKey}`}`);
        setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    }, [slug, isPublic, accessKey]);

    // Cerrar el popup con Escape.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const message = `¡Vota ahora en Pollnow! Este evento te podría interesar: ${eventTitle}`;
    const plainText = `${message}\n${url}`;
    const htmlText = `¡Vota ahora en Pollnow! Este evento te podría interesar: <b>${escapeHtml(eventTitle)}</b><br>${escapeHtml(url)}`;

    async function legacyCopy() {
        const ta = document.createElement("textarea");
        ta.value = plainText;
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } finally { document.body.removeChild(ta); }
    }

    async function handleCopy() {
        if (copyState === "copying") return;
        setCopyState("copying");
        try {
            // Preferimos copiar texto enriquecido (con el nombre en negrita) + texto plano.
            if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
                const item = new ClipboardItem({
                    "text/html": new Blob([htmlText], { type: "text/html" }),
                    "text/plain": new Blob([plainText], { type: "text/plain" }),
                });
                await navigator.clipboard.write([item]);
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(plainText);
            } else {
                await legacyCopy();
            }
            setCopyState("copied");
            toast.success("Enlace copiado");
            setTimeout(() => setCopyState("idle"), 2000);
        } catch {
            // Último recurso si clipboard.write falla (permisos, etc.).
            try {
                await legacyCopy();
                setCopyState("copied");
                toast.success("Enlace copiado");
                setTimeout(() => setCopyState("idle"), 2000);
            } catch {
                setCopyState("idle");
                toast.error("No se pudo copiar el enlace");
            }
        }
    }

    function openIntent(href: string) {
        window.open(href, "_blank", "noopener,noreferrer");
    }

    async function handleNativeShare() {
        try {
            await navigator.share({ title: eventTitle, text: message, url });
        } catch {
            /* el usuario canceló la hoja de compartir: sin acción */
        }
    }

    const channels = [
        {
            key: "whatsapp",
            label: "WhatsApp",
            icon: <MessageCircle size={22} />,
            color: "bg-green-500/15 text-green-300 border-green-500/30 hover:bg-green-500/25",
            onClick: () => openIntent(`https://wa.me/?text=${encodeURIComponent(`¡Vota ahora en Pollnow! Este evento te podría interesar: *${eventTitle}*\n${url}`)}`),
        },
        {
            key: "x",
            label: "X",
            icon: <Twitter size={22} />,
            color: "bg-sky-500/15 text-sky-300 border-sky-500/30 hover:bg-sky-500/25",
            onClick: () => openIntent(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`),
        },
        {
            key: "telegram",
            label: "Telegram",
            icon: <Send size={22} />,
            color: "bg-sky-500/15 text-sky-300 border-sky-500/30 hover:bg-sky-500/25",
            onClick: () => openIntent(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`),
        },
        {
            key: "facebook",
            label: "Facebook",
            icon: <Facebook size={22} />,
            color: "bg-blue-600/15 text-blue-300 border-blue-600/30 hover:bg-blue-600/25",
            onClick: () => openIntent(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`),
        },
        {
            key: "email",
            label: "Email",
            icon: <Mail size={22} />,
            color: "bg-white/5 text-gray-200 border-white/15 hover:bg-white/10",
            onClick: () => openIntent(`mailto:?subject=${encodeURIComponent(`¡Vota en Pollnow: ${eventTitle}!`)}&body=${encodeURIComponent(`${message}\n\n${url}`)}`),
        },
    ];

    if (canNativeShare) {
        channels.push({
            key: "native",
            label: "Más…",
            icon: <Share2 size={22} />,
            color: "bg-white/5 text-gray-200 border-white/15 hover:bg-white/10",
            onClick: handleNativeShare,
        });
    }

    return (
        <>
            {/* Pill flotante */}
            <motion.button
                onClick={() => setOpen(true)}
                aria-label="Compartir evento"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ delay: 0.3 }}
                className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/15 text-white font-bold text-sm shadow-lg hover:bg-white/20 hover:border-white/30 transition-colors cursor-pointer"
            >
                <Share2 size={18} /> Compartir
            </motion.button>

            {/* Popup */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 12 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm bg-neutral-900/90 border-2 border-white/10 rounded-3xl p-6 shadow-2xl"
                        >
                            <div className="flex items-start justify-between gap-3 mb-1">
                                <div className="flex items-center gap-2 text-white">
                                    <Share2 size={20} className="text-sky-300" />
                                    <h2 className="text-lg font-bold">Compartir evento</h2>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    aria-label="Cerrar"
                                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition-colors cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="text-sm text-gray-400 mb-5 truncate" title={eventTitle}>{eventTitle}</p>

                            {/* Canales */}
                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {channels.map((c) => (
                                    <button
                                        key={c.key}
                                        onClick={c.onClick}
                                        className="flex flex-col items-center gap-2 cursor-pointer group"
                                    >
                                        <span className={`w-14 h-14 flex items-center justify-center rounded-2xl border-2 transition-colors ${c.color}`}>
                                            {c.icon}
                                        </span>
                                        <span className="text-[11px] text-gray-400 group-hover:text-white transition-colors">{c.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Copiar enlace */}
                            <div className="flex items-center gap-2 bg-black/40 border-2 border-white/10 rounded-2xl p-2">
                                <span className="flex-1 min-w-0 px-2 text-xs text-gray-400 truncate font-mono">{url || "Cargando…"}</span>
                                <button
                                    onClick={handleCopy}
                                    disabled={copyState === "copying" || !url}
                                    className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 ${copyState === "copied" ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
                                >
                                    {copyState === "copying" ? (
                                        <><Loader2 size={14} className="animate-spin" /> Copiando…</>
                                    ) : copyState === "copied" ? (
                                        <><Check size={14} /> ¡Copiado!</>
                                    ) : (
                                        <><Link2 size={14} /> Copiar</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
