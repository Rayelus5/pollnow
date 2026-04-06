"use client";

import { useState, useEffect, useRef } from "react";
import { X, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type TagSuggestion = { tag: string; count: number };

const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 20;

export default function TagsInput({
    value,
    onChange,
    disabled = false,
    name = "tags",
}: {
    value: string[];
    onChange: (tags: string[]) => void;
    disabled?: boolean;
    name?: string;
}) {
    const [input, setInput] = useState("");
    const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!input.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        const timeout = setTimeout(async () => {
            try {
                const res = await fetch(`/api/tags?q=${encodeURIComponent(input.toLowerCase())}`);
                if (!res.ok) return;
                const data: TagSuggestion[] = await res.json();
                const filtered = data.filter((s) => !value.includes(s.tag));
                setSuggestions(filtered);
                setShowSuggestions(filtered.length > 0);
            } catch {
                // silent fail
            }
        }, 220);
        return () => clearTimeout(timeout);
    }, [input, value]);

    const normalizeTag = (raw: string) =>
        raw
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // strip diacritics for slug
            .replace(/[^a-z0-9\-]/g, "")
            .slice(0, MAX_TAG_LENGTH);

    const addTag = (raw: string) => {
        const tag = normalizeTag(raw);
        if (!tag || value.includes(tag) || value.length >= MAX_TAGS) return;
        onChange([...value, tag]);
        setInput("");
        setSuggestions([]);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag));

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(input);
        }
        if (e.key === "Backspace" && !input && value.length > 0) {
            removeTag(value[value.length - 1]);
        }
        if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* Pill container */}
            <div
                className={`flex flex-wrap gap-1.5 w-full bg-black border-2 rounded-xl p-2.5 min-h-[48px] cursor-text transition-colors
                    ${disabled ? "opacity-50 pointer-events-none" : "border-white/20 focus-within:border-blue-500"}`}
                onClick={() => inputRef.current?.focus()}
            >
                <AnimatePresence initial={false}>
                    {value.map((tag) => (
                        <motion.span
                            key={tag}
                            layout
                            initial={{ opacity: 0, scale: 0.75 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.75 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1 px-2 py-0.5 bg-blue-600/20 border-2 border-blue-500/40 rounded-lg text-blue-300 text-xs font-semibold"
                        >
                            <Hash size={9} className="opacity-60" />
                            {tag}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                                className="ml-0.5 text-blue-400/70 hover:text-white transition-colors"
                            >
                                <X size={10} />
                            </button>
                        </motion.span>
                    ))}
                </AnimatePresence>

                {value.length < MAX_TAGS && (
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value.toLowerCase())}
                        onKeyDown={handleKeyDown}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        onFocus={() => input && suggestions.length > 0 && setShowSuggestions(true)}
                        placeholder={value.length === 0 ? "Añade etiquetas..." : ""}
                        maxLength={MAX_TAG_LENGTH}
                        className="flex-1 min-w-[90px] bg-transparent text-white text-sm outline-none placeholder-gray-600"
                        disabled={disabled}
                    />
                )}
            </div>

            <p className="text-[10px] text-gray-600 mt-1">
                Máx. {MAX_TAGS} etiquetas · Enter o coma para confirmar · solo minúsculas
            </p>

            {/* Suggestions popup (above the input) */}
            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-[calc(100%+6px)] left-0 right-0 bg-neutral-900 border-2 border-white/15 rounded-xl overflow-hidden shadow-2xl z-50"
                    >
                        <p className="text-[9px] text-gray-600 px-3 pt-2.5 pb-1 uppercase tracking-widest font-bold">
                            Sugerencias
                        </p>
                        {suggestions.map(({ tag, count }) => (
                            <button
                                key={tag}
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); addTag(tag); }}
                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors text-left group"
                            >
                                <span className="flex items-center gap-1.5 text-sm text-gray-300 group-hover:text-white transition-colors">
                                    <Hash size={11} className="text-blue-500" />
                                    {tag}
                                </span>
                                <span className="text-[10px] text-gray-600 font-mono">({count})</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Single hidden input with comma-separated values for form submission */}
            <input type="hidden" name={name} value={value.join(",")} />
        </div>
    );
}
