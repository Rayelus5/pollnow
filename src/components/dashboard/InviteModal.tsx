"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, UserPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useDebounce } from "use-debounce";
import Image from "next/image";

type UserSuggestion = {
    id: string;
    name: string;
    username: string;
    image: string | null;
};

type Props = {
    eventId: string;
    onClose: () => void;
    onInvited: (user: UserSuggestion) => void;
};

export default function InviteModal({ eventId, onClose, onInvited }: Props) {
    const [query, setQuery] = useState("");
    const [debouncedQuery] = useDebounce(query, 300);
    const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
    const [selected, setSelected] = useState<UserSuggestion | null>(null);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus al abrir
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Buscar usuarios
    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setSuggestions([]);
            return;
        }
        setLoadingSuggestions(true);
        fetch(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}&eventId=${eventId}`)
            .then((r) => r.json())
            .then((data) => setSuggestions(data.users ?? []))
            .finally(() => setLoadingSuggestions(false));
    }, [debouncedQuery, eventId]);

    const handleInvite = async () => {
        if (!selected || inviting) return;
        setInviting(true);
        setStatus("idle");

        const res = await fetch("/api/collaborators/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId, invitedUserId: selected.id }),
        });

        const data = await res.json();
        if (res.ok) {
            setStatus("success");
            onInvited(selected);
            setTimeout(onClose, 1500);
        } else {
            setStatus("error");
            setErrorMsg(data.error ?? "Error al enviar la invitación");
        }
        setInviting(false);
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <motion.div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            />

            {/* Modal */}
            <motion.div
                className="relative w-full max-w-md bg-neutral-900 border-2 border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b-2 border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center">
                            <UserPlus className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-white text-sm">Invitar colaborador</h2>
                            <p className="text-[11px] text-gray-500">Busca por nombre o @usuario</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Search input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Buscar usuario..."
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSelected(null);
                                setStatus("idle");
                            }}
                            className="w-full bg-neutral-800 border-2 border-white/10 focus:border-blue-500/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors"
                        />
                        {loadingSuggestions && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" />
                        )}
                    </div>

                    {/* Suggestions */}
                    <AnimatePresence mode="wait">
                        {suggestions.length > 0 && !selected && (
                            <motion.ul
                                key="suggestions"
                                className="space-y-1"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                            >
                                {suggestions.map((u) => (
                                    <li key={u.id}>
                                        <button
                                            onClick={() => {
                                                setSelected(u);
                                                setSuggestions([]);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 border-2 border-transparent hover:border-white/10 transition-all text-left cursor-pointer group"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden shrink-0">
                                                {u.image ? (
                                                    <Image src={u.image} alt={u.name} width={32} height={32} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-300">
                                                        {u.name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                                                    {u.name}
                                                </p>
                                                <p className="text-[11px] text-gray-500">@{u.username}</p>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </motion.ul>
                        )}

                        {/* Selected user preview */}
                        {selected && (
                            <motion.div
                                key="selected"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 border-2 border-blue-500/30"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <div className="w-9 h-9 rounded-full bg-neutral-700 overflow-hidden shrink-0">
                                    {selected.image ? (
                                        <Image src={selected.image} alt={selected.name} width={36} height={36} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-300">
                                            {selected.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{selected.name}</p>
                                    <p className="text-[11px] text-blue-400">@{selected.username}</p>
                                </div>
                                <button
                                    onClick={() => { setSelected(null); setStatus("idle"); }}
                                    className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}

                        {/* Empty state */}
                        {debouncedQuery.length >= 2 && !loadingSuggestions && suggestions.length === 0 && !selected && (
                            <motion.p
                                key="empty"
                                className="text-center text-sm text-gray-500 py-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                No se encontraron usuarios
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* Feedback */}
                    <AnimatePresence>
                        {status === "success" && (
                            <motion.div
                                className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border-2 border-green-500/20 rounded-xl px-4 py-3"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                Invitación enviada correctamente
                            </motion.div>
                        )}
                        {status === "error" && (
                            <motion.div
                                className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border-2 border-red-500/20 rounded-xl px-4 py-3"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {errorMsg}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 border-2 border-white/10 transition-all cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleInvite}
                        disabled={!selected || inviting || status === "success"}
                        className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
                    >
                        {inviting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <UserPlus className="w-4 h-4" />
                        )}
                        Enviar invitación
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
