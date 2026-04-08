"use client";

import { useState, useRef } from "react";
import { updateEventParticipant, deleteEventParticipant, createEventParticipant } from "@/app/lib/event-actions";
import {
    Pencil, Trash2, Save, X, Plus, Search, Upload, Wand2,
    Lock, Star, Crown, ChevronLeft, ChevronRight, Sparkles,
    RefreshCw, User, Link2, AlertCircle
} from "lucide-react";
import { useFormStatus } from 'react-dom';
import Link from "next/link";
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

type InputMode = "manual" | "ai";

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
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border-2 border-white/8 w-fit">
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

    return (
        <div className="relative shrink-0 group" onClick={!isAi && !isGenerating ? onUploadClick : undefined}>
            {/* Glow ring for AI mode */}
            {isAi && !isEditMode && (
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 opacity-40 blur-sm animate-pulse pointer-events-none" />
            )}

            <div className={`relative ${size} rounded-full overflow-hidden border-2 flex items-center justify-center transition-all
                ${isAi
                    ? "border-violet-500/50 bg-violet-950/50"
                    : "border-blue-500/30 bg-gray-900 cursor-pointer hover:border-blue-500"
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
                        ) : !isAi ? (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={isEditMode ? 12 : 16} className="text-white" />
                            </div>
                        ) : null}
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        {isAi
                            ? <Sparkles size={isEditMode ? 14 : 22} className="text-violet-400" />
                            : <Upload size={isEditMode ? 14 : 22} className="text-blue-400" />
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
}: {
    initialName?: string;
    initialImage?: string;
    onSubmit: (formData: FormData) => Promise<void>;
    onCancel: () => void;
    isEditMode?: boolean;
    planSlug: string;
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

                    {!isAi && (
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
}: {
    initialData: Participant[];
    eventId: string;
    planSlug: string;
    canManageNominees?: boolean;
}) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; // nominados por página

    const planKey = planSlug.toUpperCase() as keyof typeof PLANS;
    const currentLimit = PLANS[planKey]?.limits?.participantsPerEvent || 12;
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
                                Has alcanzado el máximo de <strong>{currentLimit} participantes</strong> en tu plan actual.
                            </p>
                            <div className="bg-black/40 rounded-xl border-2 border-white/5 p-4 mb-8 space-y-3">
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
                                    <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-white/10 bg-neutral-800">
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
        </div>
    );
}
