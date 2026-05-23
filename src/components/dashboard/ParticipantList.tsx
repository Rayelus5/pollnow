"use client";

import { useState, useRef } from "react";
import { updateEventParticipant, deleteEventParticipant, createEventParticipant } from "@/app/lib/event-actions";
import { bulkCreateParticipants, type BulkImportResult } from "@/app/lib/csv-actions";
import {
    Pencil, Trash2, Save, X, Plus, Search, Upload, Wand2,
    Lock, Star, Crown, ChevronLeft, ChevronRight, Sparkles,
    RefreshCw, User, Link2, AlertCircle, FileSpreadsheet,
    Download, CheckCircle2, XCircle
} from "lucide-react";
import { useFormStatus } from 'react-dom';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/plans";
import { Quantum } from 'ldrs/react';
import { Bouncy } from 'ldrs/react';
import 'ldrs/react/Bouncy.css';
import 'ldrs/react/Quantum.css';
import { motion, AnimatePresence } from "framer-motion";

// ─── AI Image Generation Cooldown (global, shared across all form instances) ──
const AI_COOLDOWN_SECONDS = 30;
let lastAiGenerationTime = 0;

// ─── Types ────────────────────────────────────────────────────────────────────

type Participant = {
    id: string;
    name: string;
    imageUrl: string | null;
};

type InputMode = "manual" | "ai" | "search";

type SearchImage = { url: string; thumbnail: string; source: "pexels" | "wikimedia"; credit?: string };

// ─── Submit buttons ───────────────────────────────────────────────────────────

function SaveButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="h-10 px-5 bg-white/10 hover:bg-white/15 border-2 border-white/15 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
            {pending ? <Bouncy size="16" speed="1.75" color="white" /> : <><Save size={14} /> Guardar</>}
        </button>
    );
}

function CreateButton({ mode }: { mode: InputMode }) {
    const { pending } = useFormStatus();
    const isAi = mode === "ai";
    return (
        <button
            type="submit"
            disabled={pending}
            className={`h-10 px-6 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50
                ${isAi
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-purple-900/40"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
        >
            {pending
                ? <Bouncy size="16" speed="1.75" color={isAi ? "white" : "black"} />
                : <>{isAi ? <Sparkles size={14} /> : <Plus size={14} />} Crear nominado</>
            }
        </button>
    );
}

function DeleteButton() {
    const { pending } = useFormStatus();
    return (
        <button
            disabled={pending}
            className="h-9 w-9 flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all cursor-pointer"
        >
            {pending ? <Bouncy size="16" speed="1.75" color="#f87171" /> : <Trash2 size={15} />}
        </button>
    );
}

// ─── Mode switcher ────────────────────────────────────────────────────────────

function ModeSwitcher({ mode, onChange, canUseAi }: { mode: InputMode; onChange: (m: InputMode) => void; canUseAi: boolean }) {
    return (
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border-2 border-white/8 w-fit flex-wrap">
            <button
                type="button"
                onClick={() => onChange("manual")}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
                    ${mode === "manual" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
                {mode === "manual" && (
                    <motion.div
                        layoutId="mode-pill"
                        className="absolute inset-0 bg-white/10 border-2 border-white/15 rounded-lg"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
                <Upload size={12} className="relative z-10" />
                <span className="relative z-10">Manual</span>
            </button>

            <button
                type="button"
                onClick={() => onChange("search")}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
                    ${mode === "search" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
                {mode === "search" && (
                    <motion.div
                        layoutId="mode-pill"
                        className="absolute inset-0 bg-emerald-600/20 border-2 border-emerald-500/40 rounded-lg"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
                <Search size={12} className={`relative z-10 ${mode === "search" ? "text-emerald-300" : ""}`} />
                <span className={`relative z-10 ${mode === "search" ? "text-emerald-200" : ""}`}>Buscar</span>
            </button>

            <button
                type="button"
                onClick={() => canUseAi && onChange("ai")}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                    ${!canUseAi ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                    ${mode === "ai" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
                {mode === "ai" && (
                    <motion.div
                        layoutId="mode-pill"
                        className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-purple-600/30 border-2 border-violet-500/40 rounded-lg"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
                <Sparkles size={12} className={`relative z-10 ${mode === "ai" ? "text-violet-300" : ""}`} />
                <span className={`relative z-10 ${mode === "ai" ? "text-violet-200" : ""}`}>
                    <span className="hidden sm:inline">Generar con </span>IA
                </span>
                {!canUseAi && <Lock size={10} className="relative z-10 ml-0.5" />}
            </button>
        </div>
    );
}

// ─── Panel de búsqueda de imágenes en internet (Pexels + Wikimedia) ─────────────

function SearchImagesPanel({ eventId, initialQuery, onPick, compact }: {
    eventId: string;
    initialQuery: string;
    onPick: (url: string) => void;
    compact?: boolean;
}) {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<SearchImage[]>([]);
    const [visible, setVisible] = useState(5);
    const [loading, setLoading] = useState(false);
    const [picking, setPicking] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const doSearch = async () => {
        if (!query.trim() || loading) return;
        setLoading(true); setError(null); setVisible(5); setSearched(true);
        try {
            const res = await fetch(`/api/search-images?q=${encodeURIComponent(query.trim())}`);
            const data = await res.json();
            if (!res.ok) { setError(data.error || "No se pudo buscar."); setResults([]); }
            else {
                setResults(data.images ?? []);
                if ((data.images ?? []).length === 0) setError("Sin resultados. Prueba con otro término.");
            }
        } catch {
            setError("Error de red al buscar.");
        } finally {
            setLoading(false);
        }
    };

    const pick = async (img: SearchImage) => {
        if (picking) return;
        setPicking(img.url); setError(null);
        try {
            const res = await fetch("/api/participant-image/rehost", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: img.url, eventId }),
            });
            const data = await res.json();
            if (res.ok && data.url) onPick(data.url);
            else setError(data.error || "No se pudo guardar la imagen.");
        } catch {
            setError("Error al guardar la imagen.");
        } finally {
            setPicking(null);
        }
    };

    const shown = results.slice(0, visible);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-3.5 h-3.5" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); doSearch(); } }}
                        placeholder="Busca una imagen (ej: el nombre del nominado)…"
                        className="w-full bg-black border-2 border-emerald-500/25 rounded-lg px-3 py-2 pl-9 text-white text-sm focus:border-emerald-500 outline-none placeholder-gray-600"
                    />
                </div>
                <button
                    type="button"
                    onClick={doSearch}
                    disabled={loading || !query.trim()}
                    className="px-3 py-2 bg-emerald-600/20 text-emerald-300 border-2 border-emerald-500/30 rounded-lg hover:bg-emerald-600/40 transition-colors disabled:opacity-40 text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                    {loading ? <Bouncy size="14" speed="1.75" color="#6ee7b7" /> : <Search size={13} />} Buscar
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border-2 border-red-500/25 text-red-400 text-xs">
                    <AlertCircle size={12} className="shrink-0" /><span>{error}</span>
                </div>
            )}

            {shown.length > 0 && (
                <>
                    <div className={`grid ${compact ? "grid-cols-5" : "grid-cols-5"} gap-2`}>
                        {shown.map((img) => (
                            <button
                                key={img.url}
                                type="button"
                                onClick={() => pick(img)}
                                disabled={!!picking}
                                className="relative aspect-square rounded-lg overflow-hidden border-2 border-white/10 hover:border-emerald-500/60 transition-colors cursor-pointer disabled:opacity-50 group"
                                title={img.credit ? `Foto de ${img.credit} (${img.source})` : img.source}
                            >
                                <img src={img.thumbnail} alt="" className="w-full h-full object-cover" />
                                {picking === img.url && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <Bouncy size="20" speed="1.75" color="#fff" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    {visible < results.length && visible < 20 && (
                        <button
                            type="button"
                            onClick={() => setVisible((v) => Math.min(v + 5, 20, results.length))}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer mt-0.5"
                        >
                            Mostrar más ({Math.min(5, results.length - visible)})
                        </button>
                    )}
                    <p className="text-[10px] text-gray-600">Imágenes de Pexels y Wikimedia. Al elegir una, se guarda en tu almacenamiento.</p>
                </>
            )}
            {searched && !loading && results.length === 0 && !error && (
                <p className="text-xs text-gray-600 py-2">Sin resultados.</p>
            )}
        </div>
    );
}

// ─── Image preview ────────────────────────────────────────────────────────────

function ImagePreview({
    image,
    isGenerating,
    mode,
    onUploadClick,
    onRegenerate,
    isEditMode,
}: {
    image: string;
    isGenerating: boolean;
    mode: InputMode;
    onUploadClick: () => void;
    onRegenerate?: () => void;
    isEditMode: boolean;
}) {
    const size = isEditMode ? "w-14 h-14" : "w-16 h-16 sm:w-20 sm:h-20";
    const isAi = mode === "ai";
    const isManual = mode === "manual";

    return (
        <div className="relative shrink-0 group" onClick={isManual && !isGenerating ? onUploadClick : undefined}>
            {/* Glow ring for AI mode */}
            {isAi && !isEditMode && (
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 opacity-40 blur-sm animate-pulse pointer-events-none" />
            )}

            <div className={`relative ${size} rounded-full overflow-hidden border-2 flex items-center justify-center transition-all
                ${isAi
                    ? "border-violet-500/50 bg-violet-950/50"
                    : isManual
                        ? "border-blue-500/30 bg-gray-900 cursor-pointer hover:border-blue-500"
                        : "border-emerald-500/40 bg-gray-900"
                }`}
            >
                {isGenerating ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 overflow-hidden">
                        {/* Gradient blobs */}
                        <div className="absolute w-3/4 h-3/4 rounded-full bg-violet-600/50 blur-md animate-[ping_2s_ease-in-out_infinite] pointer-events-none" />
                        <div className="absolute w-1/2 h-1/2 rounded-full bg-fuchsia-500/40 blur-sm animate-[pulse_1.5s_ease-in-out_infinite_0.5s] pointer-events-none" />
                        {/* Quantum loader on top */}
                        <div className="relative z-10">
                            <Quantum size={isEditMode ? "30" : "50"} speed="1.75" color="#e3daffff" />
                        </div>
                    </div>
                ) : image ? (
                    <>
                        <img src={image} className="w-full h-full object-cover" alt="Preview" />
                        {/* Overlay actions */}
                        {isAi && onRegenerate ? (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <RefreshCw size={isEditMode ? 12 : 16} className="text-violet-300" />
                            </button>
                        ) : isManual ? (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={isEditMode ? 12 : 16} className="text-white" />
                            </div>
                        ) : null}
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        {isAi
                            ? <Sparkles size={isEditMode ? 14 : 22} className="text-violet-400" />
                            : isManual
                                ? <Upload size={isEditMode ? 14 : 22} className="text-blue-400" />
                                : <Search size={isEditMode ? 14 : 22} className="text-emerald-400" />
                        }
                    </div>
                )}
            </div>

            {/* Small badge */}
            {isAi && image && !isGenerating && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center border-2 border-black">
                    <Sparkles size={9} className="text-white" />
                </div>
            )}
        </div>
    );
}

// ─── Participant Form ─────────────────────────────────────────────────────────

function ParticipantForm({
    initialName = "",
    initialImage = "",
    onSubmit,
    onCancel,
    isEditMode = false,
    planSlug,
    eventId,
}: {
    initialName?: string;
    initialImage?: string;
    onSubmit: (formData: FormData) => Promise<void>;
    onCancel: () => void;
    isEditMode?: boolean;
    planSlug: string;
    eventId: string;
}) {
    const canUseAi = planSlug !== "free";
    const [mode, setMode] = useState<InputMode>("manual");
    const [name, setName] = useState(initialName);
    const [image, setImage] = useState(initialImage);
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setName(val);
        // Auto-suggest prompt when name changes in AI mode
        if (mode === "ai" && !aiPrompt && val) {
            setAiPrompt(`Retrato ultra-realista de un ${val}, fondo neutro oscuro, iluminación dramática profesional, alta resolución, estilo fotográfico.`);
        }
    };

    const handleModeChange = (m: InputMode) => {
        setMode(m);
        if (m === "ai" && name && !aiPrompt) {
            setAiPrompt(`Retrato ultra-realista de un ${name}, fondo neutro oscuro, iluminación dramática profesional, alta resolución, estilo fotográfico.`);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) {
            alert("La imagen es demasiado grande (Max 4MB)");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setImage(reader.result as string);
        reader.readAsDataURL(file);
    };

    const startCooldown = () => {
        const elapsed = Math.floor((Date.now() - lastAiGenerationTime) / 1000);
        const remaining = Math.max(0, AI_COOLDOWN_SECONDS - elapsed);
        if (remaining <= 0) return;
        setCooldownRemaining(remaining);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
            setCooldownRemaining((prev) => {
                if (prev <= 1) {
                    if (cooldownRef.current) clearInterval(cooldownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const generateAIImage = async () => {
        if (!name && !aiPrompt) return;
        const elapsed = Date.now() - lastAiGenerationTime;
        if (elapsed < AI_COOLDOWN_SECONDS * 1000) {
            startCooldown();
            return;
        }
        setIsGenerating(true);
        setAiError(false);
        try {
            const seed = Math.floor(Math.random() * 10000);
            const prompt = aiPrompt || `Ultra-realistic photographic depiction of ${name}. Professional lighting, high-detail textures, sharp focus, natural colors, minimalistic background.`;

            const res = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, seed }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const { imageUrl } = await res.json();
            setImage(imageUrl);
            lastAiGenerationTime = Date.now();
            startCooldown();
        } catch (error) {
            console.error("Error generando imagen:", error);
            setAiError(true);
            setTimeout(() => setAiError(false), 5000);
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Edit mode layout: siempre dos columnas (avatar | campos+botones) ──
    if (isEditMode) {
        return (
            <form
                action={async (fd) => { fd.set("imageUrl", image); await onSubmit(fd); }}
                className="flex items-start gap-3 w-full"
            >
                {/* Columna izquierda: avatar */}
                <div className="shrink-0">
                    <ImagePreview
                        image={image}
                        isGenerating={isGenerating}
                        mode={mode}
                        onUploadClick={() => fileInputRef.current?.click()}
                        onRegenerate={generateAIImage}
                        isEditMode
                    />
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                </div>

                {/* Columna derecha: todo el contenido */}
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <input
                        name="name"
                        value={name}
                        onChange={handleNameChange}
                        maxLength={80}
                        className="w-full bg-black border-2 border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                        placeholder="Nombre..."
                        required
                    />

                    <ModeSwitcher mode={mode} onChange={handleModeChange} canUseAi={canUseAi} />

                    <AnimatePresence mode="wait">
                        {mode === "manual" ? (
                            <motion.div key="manual-edit"
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                            >
                                <div className="relative">
                                    <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 w-3 h-3" />
                                    <input
                                        name="imageUrl"
                                        value={image}
                                        onChange={(e) => setImage(e.target.value)}
                                        className="w-full bg-black border-2 border-white/10 rounded-lg px-3 py-2 pl-8 text-white text-sm focus:border-blue-500 outline-none text-gray-400"
                                        placeholder="URL de imagen..."
                                    />
                                </div>
                            </motion.div>
                        ) : mode === "search" ? (
                            <motion.div key="search-edit"
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                            >
                                <SearchImagesPanel eventId={eventId} initialQuery={name} onPick={setImage} compact />
                            </motion.div>
                        ) : (
                            <motion.div key="ai-edit"
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="flex gap-2"
                            >
                                <input
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    className="flex-1 min-w-0 bg-violet-950/30 border-2 border-violet-500/30 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500 outline-none placeholder-violet-400/40"
                                    placeholder="Describe la imagen..."
                                />
                                <button
                                    type="button"
                                    onClick={generateAIImage}
                                    disabled={isGenerating || cooldownRemaining > 0 || (!name && !aiPrompt)}
                                    className="px-3 py-2 bg-violet-600/20 text-violet-300 border-2 border-violet-500/30 rounded-lg hover:bg-violet-600/40 transition-colors disabled:opacity-40 flex items-center gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
                                >
                                    {cooldownRemaining > 0 ? (
                                        <span>{cooldownRemaining}s</span>
                                    ) : (
                                        <>
                                            <Wand2 size={12} />
                                            <span className="hidden xs:inline">Generar</span>
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {aiError && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border-2 border-red-500/30 text-red-400 text-xs">
                            <AlertCircle size={12} className="shrink-0" />
                            <span>Generación no disponible. Inténtalo más tarde.</span>
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <SaveButton />
                        <button type="button" onClick={onCancel}
                            className="h-10 px-3 flex items-center justify-center bg-white/5 border-2 border-white/10 text-gray-400 rounded-xl hover:bg-white/10 transition-all cursor-pointer">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            </form>
        );
    }

    // ── Create mode layout (full card) ──
    const isAi = mode === "ai";

    return (
        <form
            action={async (fd) => { fd.set("imageUrl", image); await onSubmit(fd); }}
            className="flex flex-col gap-5"
        >
            {/* Mode switcher */}
            <div className="flex flex-wrap items-center gap-3">
                <ModeSwitcher mode={mode} onChange={handleModeChange} canUseAi={canUseAi} />
                {!canUseAi && (
                    <Link href="/premium" className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors shrink-0">
                        <Sparkles size={10} /> Desbloquear IA
                    </Link>
                )}
            </div>

            {/* Main content */}
            <div className="flex gap-4 items-start">
                {/* Image preview column */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                    <ImagePreview
                        image={image}
                        isGenerating={isGenerating}
                        mode={mode}
                        onUploadClick={() => fileInputRef.current?.click()}
                        onRegenerate={generateAIImage}
                        isEditMode={false}
                    />
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />

                    {mode === "manual" && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                        >
                            Subir foto
                        </button>
                    )}
                    {isAi && image && !isGenerating && (
                        <button
                            type="button"
                            onClick={generateAIImage}
                            disabled={cooldownRemaining > 0}
                            className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <RefreshCw size={9} />
                            {cooldownRemaining > 0 ? `${cooldownRemaining}s` : "Regenerar"}
                        </button>
                    )}
                </div>

                {/* Fields column */}
                <div className="flex-1 flex flex-col gap-3 min-w-0">
                    {/* Name */}
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-3.5 h-3.5" />
                        <input
                            name="name"
                            value={name}
                            onChange={handleNameChange}
                            autoFocus
                            maxLength={80}
                            className="w-full bg-black border-2 border-white/10 rounded-xl px-3 py-2.5 pl-9 text-white text-sm focus:border-blue-500 outline-none placeholder-gray-600 transition-colors"
                            placeholder="Nombre del nominado..."
                            required
                        />
                    </div>

                    {/* Mode-specific inputs */}
                    <AnimatePresence mode="wait">
                        {mode === "manual" ? (
                            <motion.div
                                key="manual-create"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.18 }}
                                className="flex flex-col gap-2"
                            >
                                <div className="relative">
                                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-3.5 h-3.5" />
                                    <input
                                        name="imageUrl"
                                        value={image}
                                        onChange={(e) => setImage(e.target.value)}
                                        className="w-full bg-black border-2 border-white/10 rounded-xl px-3 py-2.5 pl-9 text-white text-sm focus:border-blue-500 outline-none placeholder-gray-600 transition-colors"
                                        placeholder="URL de imagen (opcional)..."
                                    />
                                </div>
                            </motion.div>
                        ) : mode === "search" ? (
                            <motion.div
                                key="search-create"
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ duration: 0.18 }}
                                className="flex flex-col gap-2"
                            >
                                <SearchImagesPanel eventId={eventId} initialQuery={name} onPick={setImage} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="ai-create"
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ duration: 0.18 }}
                                className="flex flex-col gap-2"
                            >
                                {/* Prompt label */}
                                <div className="flex items-center gap-2">
                                    <Wand2 size={11} className="text-violet-400" />
                                    <span className="text-[11px] text-violet-300/80 font-medium">Prompt de imagen</span>
                                    <span className="text-[10px] text-gray-600">(Edita o usa la sugerencia automática)</span>
                                </div>

                                {/* Prompt textarea */}
                                <div className="relative">
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        rows={3}
                                        className="w-full bg-violet-950/20 border-2 border-violet-500/25 rounded-xl px-3 py-2.5 text-white text-sm focus:border-violet-500/60 outline-none placeholder-violet-400/30 transition-colors resize-none leading-relaxed"
                                        placeholder={`Ej: Retrato ultra-realista de un ${name || "la persona"}, fondo oscuro, iluminación dramática...`}
                                    />
                                </div>

                                {/* Generate button */}
                                <button
                                    type="button"
                                    onClick={generateAIImage}
                                    disabled={isGenerating || cooldownRemaining > 0 || (!name && !aiPrompt)}
                                    className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40
                                        bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-purple-900/30"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Quantum size="20" speed="1.75" color="white" />
                                            <span>Generando imagen...</span>
                                        </>
                                    ) : cooldownRemaining > 0 ? (
                                        <>
                                            <RefreshCw size={14} />
                                            <span>Espera {cooldownRemaining}s para generar otra</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={14} />
                                            <span>{image ? "Regenerar imagen" : "Generar imagen con IA"}</span>
                                        </>
                                    )}
                                </button>

                                {aiError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border-2 border-red-500/25 text-red-400 text-xs"
                                    >
                                        <AlertCircle size={12} className="shrink-0" />
                                        <span>Generación no disponible ahora mismo. Inténtalo más tarde.</span>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between border-t-2 border-white/5 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                    Cancelar
                </button>
                <CreateButton mode={mode} />
            </div>
        </form>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ParticipantList({
    initialData,
    eventId,
    planSlug,
    canManageNominees = true,
    square = false,
    limitOverride,
}: {
    initialData: Participant[];
    eventId: string;
    planSlug: string;
    canManageNominees?: boolean;
    /** Render cuadrado de los avatares (modo TIERLIST). */
    square?: boolean;
    /** Sobrescribe el límite de items (p.ej. tierlistMaxOptions en TIERLIST). */
    limitOverride?: number;
}) {
    const router = useRouter();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; // nominados por página

    const planKey = planSlug.toUpperCase() as keyof typeof PLANS;
    const currentLimit = limitOverride ?? (PLANS[planKey]?.limits?.participantsPerEvent || 12);
    const canImportCsv = planSlug === "enterprise" || planSlug === "unlimited";
    const currentCount = initialData.length;
    const isAtLimit = currentCount >= currentLimit;

    const handleCreateClick = () => {
        if (isAtLimit) setShowUpgradeModal(true);
        else setIsCreating(true);
    };

    const filteredData = initialData.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-4 tour-participants-section">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Lista de Nominados
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border-2 font-mono
                        ${isAtLimit
                            ? "text-red-400 border-red-500/30 bg-red-500/10"
                            : "text-gray-500 border-gray-700"
                        }`}>
                        {currentCount} / {currentLimit}
                    </span>
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar nominados..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full bg-neutral-900 border-2 border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                    {canManageNominees && canImportCsv && (
                        <button
                            onClick={() => setShowCsvModal(true)}
                            className="bg-amber-500/10 text-amber-400 border-2 border-amber-500/20 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-amber-500/20 transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <FileSpreadsheet size={14} /> CSV
                        </button>
                    )}
                    {canManageNominees && (
                        <button
                            onClick={handleCreateClick}
                            className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer"
                        >
                            <Plus size={14} /> Nuevo
                        </button>
                    )}
                </div>
            </div>

            {/* ── Upgrade modal ── */}
            <AnimatePresence>
                {showUpgradeModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowUpgradeModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-neutral-900 border-2 border-white/10 rounded-2xl w-full max-w-lg p-8 shadow-2xl relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none -mr-16 -mt-16" />
                            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                <Lock className="text-amber-500" /> Límite Alcanzado
                            </h2>
                            <p className="text-gray-400 text-sm mb-6">
                                Has alcanzado el máximo de <strong>{currentLimit} {square ? "elementos" : "participantes"}</strong> en tu plan actual.
                            </p>
                            <div className={`bg-black/40 rounded-xl border-2 border-white/5 p-4 mb-8 space-y-3 ${square ? "hidden" : ""}`}>
                                <div className="flex justify-between items-center text-sm border-b-2 border-white/5 pb-2">
                                    <span className="text-gray-500">Tu Plan ({PLANS[planKey].name})</span>
                                    <span className="font-mono text-red-400">{currentLimit} participantes</span>
                                </div>
                                {planSlug !== "premium" && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-blue-300"><Star size={12} /> Premium</span>
                                        <span className="font-mono text-white">{PLANS.PREMIUM.limits.participantsPerEvent} participantes</span>
                                    </div>
                                )}
                                {planSlug !== "plus" && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-purple-300"><Crown size={12} /> Plus</span>
                                        <span className="font-mono text-white">{PLANS.PLUS.limits.participantsPerEvent} participantes</span>
                                    </div>
                                )}
                                {planSlug !== "unlimited" && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-purple-300"><Crown size={12} /> Unlimited</span>
                                        <span className="font-mono text-white">{PLANS.UNLIMITED.limits.participantsPerEvent} participantes</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowUpgradeModal(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-bold transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <Link href="/premium" className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-center shadow-lg transition-colors">
                                    Mejorar Plan
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Create form ── */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.99 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        className="relative rounded-2xl border-2 border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-black p-5 overflow-hidden"
                    >
                        {/* Decorative gradient top line */}
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                        <ParticipantForm
                            eventId={eventId}
                            onSubmit={async (fd) => {
                                await createEventParticipant(eventId, fd);
                                setIsCreating(false);
                            }}
                            onCancel={() => setIsCreating(false)}
                            planSlug={planSlug}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Participant list ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 min-h-[300px] items-start">
                <AnimatePresence>
                    {paginatedData.map((p, i) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ delay: i * 0.04 }}
                            className={`group bg-neutral-900/60 border-2 border-white/8 rounded-xl overflow-hidden hover:border-white/15 transition-all ${editingId === p.id ? "md:col-span-2 md:col-start-1" : ""}`}
                        >
                            {editingId === p.id ? (
                                <div className="p-4">
                                    <ParticipantForm
                                        eventId={eventId}
                                        initialName={p.name}
                                        initialImage={p.imageUrl || ""}
                                        isEditMode
                                        onSubmit={async (fd) => {
                                            await updateEventParticipant(p.id, eventId, fd);
                                            setEditingId(null);
                                        }}
                                        onCancel={() => setEditingId(null)}
                                        planSlug={planSlug}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 p-3.5">
                                    {/* Avatar */}
                                    <div className={`w-11 h-11 ${square ? "rounded-lg" : "rounded-full"} overflow-hidden shrink-0 border-2 border-white/10 bg-neutral-800`}>
                                        {p.imageUrl ? (
                                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-sm">
                                                {p.name.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-100 truncate text-sm">{p.name}</p>
                                        <p className="text-[11px] text-gray-600 mt-0.5">
                                            {p.imageUrl ? (
                                                <span className="text-emerald-500/80">Con imagen</span>
                                            ) : (
                                                <span>Sin imagen</span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    {canManageNominees && (
                                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                                onClick={() => setEditingId(p.id)}
                                                className="h-9 w-9 flex items-center justify-center text-blue-400/70 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all cursor-pointer"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <form action={deleteEventParticipant.bind(null, p.id, eventId)}>
                                                <DeleteButton />
                                            </form>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredData.length === 0 && !isCreating && (
                    <div className="md:col-span-2 text-center py-12 border-2 border-dashed border-white/8 rounded-xl text-gray-600 text-sm flex flex-col items-center gap-2">
                        <User size={28} className="text-gray-700" />
                        {searchQuery ? "No se encontraron nominados." : "Aún no hay nominados. Pulsa \"Nuevo\" para empezar."}
                    </div>
                )}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4 border-t-2 border-white/5">
                    <button
                        onClick={() => currentPage > 1 && setCurrentPage(c => c - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
                    >
                        <ChevronLeft size={18} className="text-white" />
                    </button>
                    <span className="text-xs text-gray-400 font-mono">
                        Página <span className="text-white font-bold">{currentPage}</span> de {totalPages}
                    </span>
                    <button
                        onClick={() => currentPage < totalPages && setCurrentPage(c => c + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
                    >
                        <ChevronRight size={18} className="text-white" />
                    </button>
                </div>
            )}

            {/* ── CSV Import Modal ── */}
            {showCsvModal && canManageNominees && (
                <CsvImportParticipantsModal
                    eventId={eventId}
                    onClose={(didCreate) => {
                        setShowCsvModal(false);
                        if (didCreate) router.refresh();
                    }}
                />
            )}
        </div>
    );
}

// ─── CSV Import Modal ─────────────────────────────────────────────────────────

type ParsedParticipantRow = {
    rowIndex: number;
    name: string;
    imageUrl: string;
    valid: boolean;
    validationError?: string;
};

function parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (line[i] === "," && !inQuotes) {
            fields.push(current.trim());
            current = "";
        } else {
            current += line[i];
        }
    }
    fields.push(current.trim());
    return fields;
}

function CsvImportParticipantsModal({
    eventId,
    onClose,
}: {
    eventId: string;
    onClose: (didCreate: boolean) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [parsedRows, setParsedRows] = useState<ParsedParticipantRow[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [hasFile, setHasFile] = useState(false);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<BulkImportResult | null>(null);

    const validRows = parsedRows.filter(r => r.valid);
    const invalidRows = parsedRows.filter(r => !r.valid);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setParseError(null);
        setResult(null);
        setParsedRows([]);

        if (!file.name.endsWith(".csv")) {
            setParseError("El archivo debe tener extensión .csv");
            return;
        }

        const text = await file.text();
        const lines = text.trim().split(/\r?\n/).filter(l => l.trim());

        if (lines.length < 2) {
            setParseError("El archivo está vacío o solo contiene la cabecera.");
            return;
        }

        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s/g, "_"));
        const nameIdx = headers.indexOf("nombre");
        const imageIdx = headers.indexOf("imagen_url");

        if (nameIdx === -1) {
            setParseError('No se encontró la columna "nombre". Asegúrate de que la primera fila es: nombre,imagen_url');
            return;
        }

        const parsed: ParsedParticipantRow[] = lines.slice(1).map((line, i) => {
            const cols = parseCSVLine(line);
            const name = cols[nameIdx] ?? "";
            const imageUrl = imageIdx !== -1 ? (cols[imageIdx] ?? "") : "";
            let valid = true;
            let validationError: string | undefined;
            if (!name.trim()) { valid = false; validationError = "El nombre es obligatorio"; }
            else if (name.trim().length > 80) { valid = false; validationError = "Supera los 80 caracteres"; }
            return { rowIndex: i + 2, name, imageUrl, valid, validationError };
        });

        setHasFile(true);
        setParsedRows(parsed);
    }

    async function handleImport() {
        if (!validRows.length || importing) return;
        setImporting(true);
        const res = await bulkCreateParticipants(eventId, validRows.map(r => ({ name: r.name, imageUrl: r.imageUrl || undefined })));
        setResult(res);
        setImporting(false);
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => !importing && onClose(!!result?.created)}
        >
            <motion.div
                initial={{ scale: 0.97, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.97, opacity: 0, y: 8 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="relative bg-zinc-950 border-2 border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-white/8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center text-amber-400">
                            <FileSpreadsheet size={15} />
                        </div>
                        <h2 className="text-base font-bold text-white">Importar Nominados (CSV)</h2>
                    </div>
                    <button onClick={() => !importing && onClose(!!result?.created)} className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {result ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-white/3 rounded-xl border-2 border-white/8">
                                <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-white">Importación completada</p>
                                    <p className="text-xs text-emerald-400 mt-0.5">{result.created} nominado{result.created !== 1 ? "s" : ""} creado{result.created !== 1 ? "s" : ""} correctamente</p>
                                </div>
                            </div>
                            {result.errors.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                                        <XCircle size={12} /> {result.errors.length} fila{result.errors.length !== 1 ? "s" : ""} no importada{result.errors.length !== 1 ? "s" : ""}:
                                    </p>
                                    <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                                        {result.errors.map((err, i) => (
                                            <div key={i} className="flex items-start gap-2 px-3 py-2 bg-red-500/5 border border-red-500/15 rounded-lg text-xs">
                                                <span className="font-mono text-gray-500 shrink-0">F{err.row}</span>
                                                <span className="text-gray-300 truncate flex-1">{err.value || "—"}</span>
                                                <span className="text-red-400 shrink-0 text-right ml-2">{err.reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button onClick={() => onClose(!!result.created)} className="w-full py-2.5 bg-white/8 hover:bg-white/12 border-2 border-white/10 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer">
                                Cerrar
                            </button>
                        </div>
                    ) : !hasFile ? (
                        <div className="space-y-5">
                            <div className="p-4 bg-white/3 border-2 border-white/8 rounded-xl space-y-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Formato esperado</p>
                                <pre className="text-xs text-amber-300/80 font-mono bg-black/40 rounded-lg px-3 py-2 overflow-x-auto">{`nombre,imagen_url\n"Rayelus",""\n"Chaotic Loom","https://..."`}</pre>
                                <ul className="text-[11px] text-gray-500 space-y-1 mt-2">
                                    <li>• <strong className="text-gray-400">nombre</strong>: obligatorio, máx. 80 caracteres</li>
                                    <li>• <strong className="text-gray-400">imagen_url</strong>: opcional, URL de imagen</li>
                                </ul>
                            </div>
                            <a href="/csv/ejemplo_nominados.csv" download className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-2 border-white/10 rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors w-fit cursor-pointer">
                                <Download size={13} /> Descargar CSV de ejemplo
                            </a>
                            {parseError && (
                                <div className="flex items-start gap-2 px-3 py-2.5 bg-red-500/8 border-2 border-red-500/20 rounded-xl text-xs text-red-400">
                                    <AlertCircle size={13} className="shrink-0 mt-0.5" /><span>{parseError}</span>
                                </div>
                            )}
                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-10 border-2 border-dashed border-white/15 rounded-xl flex flex-col items-center gap-3 text-gray-500 hover:border-amber-500/30 hover:text-amber-400 transition-colors cursor-pointer group">
                                <Upload size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-semibold">Seleccionar archivo .csv</span>
                                <span className="text-xs">Haz clic o arrastra el archivo aquí</span>
                            </button>
                            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-emerald-400">{validRows.length} válidas</p>
                                        <p className="text-[10px] text-gray-500">listas para importar</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 p-3 border rounded-xl ${invalidRows.length > 0 ? "bg-red-500/5 border-red-500/15" : "bg-white/3 border-white/8"}`}>
                                    <XCircle size={16} className={invalidRows.length > 0 ? "text-red-400 shrink-0" : "text-gray-600 shrink-0"} />
                                    <div>
                                        <p className={`text-xs font-bold ${invalidRows.length > 0 ? "text-red-400" : "text-gray-500"}`}>{invalidRows.length} con errores</p>
                                        <p className="text-[10px] text-gray-500">no se importarán</p>
                                    </div>
                                </div>
                            </div>
                            {invalidRows.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">Errores de validación</p>
                                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                                        {invalidRows.map((r, i) => (
                                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/5 border border-red-500/10 rounded-lg text-xs">
                                                <span className="font-mono text-gray-600 shrink-0">F{r.rowIndex}</span>
                                                <span className="text-gray-400 truncate flex-1">{r.name || "—"}</span>
                                                <span className="text-red-400 shrink-0">{r.validationError}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {validRows.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Previsualización {validRows.length > 5 ? "(primeras 5)" : ""}
                                    </p>
                                    <div className="border-2 border-white/8 rounded-xl overflow-hidden">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-white/5 text-gray-500 uppercase text-[10px]">
                                                    <th className="px-3 py-2 text-left font-semibold">Nombre</th>
                                                    <th className="px-3 py-2 text-left font-semibold">Imagen URL</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {validRows.slice(0, 5).map((r, i) => (
                                                    <tr key={i} className="text-gray-300">
                                                        <td className="px-3 py-2 font-medium truncate max-w-[160px]">{r.name}</td>
                                                        <td className="px-3 py-2 text-gray-600 truncate max-w-[160px]">{r.imageUrl || "—"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => { setHasFile(false); setParsedRows([]); setParseError(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                    disabled={importing}
                                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border-2 border-white/10 rounded-xl text-sm font-semibold text-gray-300 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    Cambiar archivo
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={!validRows.length || importing}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-900/30"
                                >
                                    {importing
                                        ? <><RefreshCw size={14} className="animate-spin" /> Importando...</>
                                        : <><FileSpreadsheet size={14} /> Importar {validRows.length} nominado{validRows.length !== 1 ? "s" : ""}</>
                                    }
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
