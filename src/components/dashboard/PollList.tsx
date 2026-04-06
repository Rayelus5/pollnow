"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { createEventPoll, updateEventPoll, deleteEventPoll, reorderEventPolls } from "@/app/lib/event-actions";
import {
    GripVertical, Pencil, Trash2, X, Plus, Search,
    Lock, Star, Crown, AlertCircle, ListChecks, Check,
    Vote, Hash,
} from "lucide-react";
import { format, isValid } from "date-fns";
import { useFormStatus } from "react-dom";
import { Bouncy } from "ldrs/react";
import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { motion, AnimatePresence } from "framer-motion";

if (typeof window !== "undefined") {
    import("ldrs/bouncy");
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Participant = { id: string; name: string };

type Poll = {
    id: string;
    title: string;
    description: string | null;
    endAt: Date | null;
    isPublished: boolean;
    votingType: "SINGLE" | "MULTIPLE" | "LIMITED_MULTIPLE";
    maxOptions: number | null;
    _count: { votes: number };
    options: { participantId: string }[];
};

// ─── Submit button ────────────────────────────────────────────────────────────

function ModalSubmitButton({ isCreating }: { isCreating: boolean }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="flex-1 h-11 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-100 cursor-pointer flex justify-center items-center transition-colors disabled:opacity-50"
        >
            {pending
                ? <Bouncy size="20" speed="1.75" color="black" />
                : isCreating ? "Crear categoría" : "Guardar cambios"
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
            {pending
                ? <Bouncy size="16" speed="1.75" color="#f87171" />
                : <Trash2 size={15} />
            }
        </button>
    );
}

// ─── Voting type badge ────────────────────────────────────────────────────────

function VotingBadge({ type, maxOptions }: { type: Poll["votingType"]; maxOptions: number | null }) {
    const map = {
        SINGLE: { label: "Voto único", className: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
        MULTIPLE: { label: "Múltiple libre", className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
        LIMITED_MULTIPLE: { label: `Máx. ${maxOptions}`, className: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    };
    const { label, className } = map[type];
    return (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border-2 ${className}`}>
            {label}
        </span>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PollList({
    initialPolls,
    allParticipants,
    eventId,
    planSlug,
}: {
    initialPolls: Poll[];
    allParticipants: Participant[];
    eventId: string;
    planSlug: string;
}) {
    const [polls, setPolls] = useState(initialPolls);
    const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [title, setTitle] = useState("");
    const [votingType, setVotingType] = useState<Poll["votingType"]>("SINGLE");

    const planKey = planSlug.toUpperCase() as keyof typeof PLANS;
    const currentLimit = PLANS[planKey]?.limits?.pollsPerEvent || 5;
    const currentCount = polls.length;
    const isAtLimit = currentCount >= currentLimit;

    useEffect(() => { setPolls(initialPolls); }, [initialPolls]);

    const handleCreateClick = () => {
        if (isAtLimit) {
            setShowUpgradeModal(true);
        } else {
            setTitle("");
            setVotingType("SINGLE");
            setIsCreating(true);
        }
    };

    const openEdit = (poll: Poll) => {
        setTitle(poll.title);
        setVotingType(poll.votingType);
        setEditingPoll(poll);
    };

    const closeModal = () => {
        setEditingPoll(null);
        setIsCreating(false);
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const filteredPolls = polls.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination || searchQuery) return;
        const items = Array.from(polls);
        const [moved] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, moved);
        setPolls(items);
        await reorderEventPolls(items.map((item, i) => ({ id: item.id, order: i })), eventId);
    };

    const modalOpen = editingPoll !== null || isCreating;

    return (
        <>
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 tour-polls-section">
                <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Orden de Categorías
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
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar categoría..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-900 border-2 border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                    <button
                        onClick={handleCreateClick}
                        className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer"
                    >
                        <Plus size={14} /> Nueva
                    </button>
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
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none -mr-16 -mt-16" />
                            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                <Lock className="text-amber-500" /> Límite Alcanzado
                            </h2>
                            <p className="text-gray-400 text-sm mb-6">
                                Has creado el máximo de <strong>{currentLimit} categorías</strong> en tu plan actual.
                            </p>
                            <div className="bg-black/40 rounded-xl border-2 border-white/5 p-4 mb-8 space-y-3">
                                <div className="flex justify-between items-center text-sm border-b-2 border-white/5 pb-2">
                                    <span className="text-gray-500">Tu Plan ({PLANS[planKey].name})</span>
                                    <span className="font-mono text-red-400">{currentLimit} categorías</span>
                                </div>
                                {planSlug !== "premium" && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-blue-300"><Star size={12} /> Premium</span>
                                        <span className="font-mono text-white">{PLANS.PREMIUM.limits.pollsPerEvent} categorías</span>
                                    </div>
                                )}
                                {planSlug !== "plus" && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-purple-300"><Crown size={12} /> Plus</span>
                                        <span className="font-mono text-white">{PLANS.PLUS.limits.pollsPerEvent} categorías</span>
                                    </div>
                                )}
                                {planSlug !== "unlimited" && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="flex items-center gap-2 text-purple-300"><Crown size={12} /> Unlimited</span>
                                        <span className="font-mono text-white">{PLANS.UNLIMITED.limits.pollsPerEvent} categorías</span>
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

            {/* ── Poll list ── */}
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="polls" isDropDisabled={searchQuery.length > 0}>
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {filteredPolls.map((poll, index) => {
                                const endDate = poll.endAt ? new Date(poll.endAt) : null;
                                const dateString = endDate && isValid(endDate) ? format(endDate, "dd/MM/yyyy") : null;
                                const displayIndex = searchQuery
                                    ? polls.findIndex(p => p.id === poll.id)
                                    : index;

                                return (
                                    <Draggable
                                        key={poll.id}
                                        draggableId={poll.id}
                                        index={displayIndex}
                                        isDragDisabled={searchQuery.length > 0}
                                    >
                                        {(provided, snapshot) => (
                                            <motion.div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.04 }}
                                                className={`group flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all
                                                    ${snapshot.isDragging
                                                        ? "border-blue-500/60 bg-neutral-800 shadow-xl shadow-black/40"
                                                        : "bg-neutral-900/60 border-white/8 hover:border-white/15"
                                                    }`}
                                            >
                                                {/* Drag handle */}
                                                <div
                                                    {...provided.dragHandleProps}
                                                    className={`text-gray-700 hover:text-gray-400 transition-colors shrink-0
                                                        ${searchQuery ? "cursor-default opacity-20" : "cursor-grab active:cursor-grabbing"}`}
                                                >
                                                    <GripVertical size={16} />
                                                </div>

                                                {/* Index badge */}
                                                <div className="w-7 h-7 rounded-lg bg-white/5 border-2 border-white/8 flex items-center justify-center shrink-0">
                                                    <span className="text-[11px] font-mono font-bold text-gray-500">
                                                        {displayIndex + 1}
                                                    </span>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-100 text-sm truncate">{poll.title}</p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                        <VotingBadge type={poll.votingType} maxOptions={poll.maxOptions} />
                                                        <span className="text-[10px] font-mono text-gray-600">
                                                            {poll._count.votes} votos
                                                        </span>
                                                        {dateString && (
                                                            <span className="text-[10px] font-mono text-gray-600">
                                                                · cierra {dateString}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button
                                                        onClick={() => openEdit(poll)}
                                                        className="h-9 w-9 flex items-center justify-center text-blue-400/70 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all cursor-pointer"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <form action={deleteEventPoll.bind(null, poll.id, eventId)}>
                                                        <DeleteButton />
                                                    </form>
                                                </div>
                                            </motion.div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}

                            {filteredPolls.length === 0 && (
                                <div className="text-center py-12 border-2 border-dashed border-white/8 rounded-xl text-gray-600 text-sm flex flex-col items-center gap-2">
                                    <ListChecks size={28} className="text-gray-700" />
                                    {searchQuery ? "No se encontraron categorías." : "Aún no hay categorías. Pulsa \"Nueva\" para empezar."}
                                </div>
                            )}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* ── Create / Edit modal ── */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.97, opacity: 0, y: 8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.97, opacity: 0, y: 8 }}
                            transition={{ type: "spring", stiffness: 320, damping: 28 }}
                            className="relative bg-zinc-950 border-2 border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Top accent line */}
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-white/8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Vote size={15} />
                                    </div>
                                    <h2 className="text-base font-bold text-white">
                                        {isCreating ? "Nueva Categoría" : "Editar Categoría"}
                                    </h2>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Form */}
                            <form
                                action={async (fd) => {
                                    if (isCreating) await createEventPoll(eventId, fd);
                                    else if (editingPoll) await updateEventPoll(editingPoll.id, eventId, fd);
                                    closeModal();
                                }}
                                className="p-6 space-y-5"
                            >
                                {/* Título */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Título
                                    </label>
                                    <input
                                        name="title"
                                        value={title}
                                        maxLength={100}
                                        onChange={handleTitleChange}
                                        className="w-full bg-black border-2 border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-blue-500 outline-none placeholder-gray-600 transition-colors"
                                        placeholder="Ej: Mejor Actor..."
                                        required
                                        autoFocus
                                    />
                                </div>

                                {/* Descripción */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Descripción <span className="normal-case font-normal text-gray-600">(opcional)</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        defaultValue={editingPoll?.description || ""}
                                        rows={2}
                                        maxLength={150}
                                        className="w-full bg-black border-2 border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-blue-500 outline-none placeholder-gray-600 resize-none transition-colors"
                                        placeholder="Descripción breve de la categoría..."
                                    />
                                </div>

                                {/* Reglas de voto */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Reglas de Voto
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(["SINGLE", "MULTIPLE", "LIMITED_MULTIPLE"] as const).map((type) => {
                                            const labels = {
                                                SINGLE: { short: "Único", desc: "Solo 1 voto" },
                                                MULTIPLE: { short: "Múltiple", desc: "Sin límite" },
                                                LIMITED_MULTIPLE: { short: "Limitado", desc: "Con máximo" },
                                            };
                                            const selected = votingType === type;
                                            return (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setVotingType(type)}
                                                    className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all cursor-pointer
                                                        ${selected
                                                            ? "border-blue-500/60 bg-blue-500/10 text-white"
                                                            : "border-white/8 bg-white/3 text-gray-500 hover:border-white/15 hover:text-gray-300"
                                                        }`}
                                                >
                                                    {selected && (
                                                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                            <Check size={9} className="text-white" />
                                                        </div>
                                                    )}
                                                    <span className="text-xs font-bold">{labels[type].short}</span>
                                                    <span className="text-[10px] opacity-70">{labels[type].desc}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <input type="hidden" name="votingType" value={votingType} />

                                    <AnimatePresence>
                                        {votingType === "LIMITED_MULTIPLE" && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.18 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pt-2 space-y-1.5">
                                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                                        <Hash size={10} /> Máximo de opciones
                                                    </label>
                                                    <input
                                                        name="maxOptions"
                                                        type="number"
                                                        min="2"
                                                        defaultValue={editingPoll?.maxOptions || 2}
                                                        className="w-full bg-black border-2 border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                                                        required
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {votingType !== "LIMITED_MULTIPLE" && (
                                        <p className="text-[11px] text-gray-600 flex items-center gap-1 pt-1">
                                            <AlertCircle size={11} />
                                            {votingType === "SINGLE"
                                                ? "El votante elige exactamente un nominado."
                                                : "El votante puede marcar tantos nominados como quiera."}
                                        </p>
                                    )}
                                </div>

                                {/* Nominados */}
                                <div className="space-y-2 pt-1 border-t-2 border-white/5">
                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block pt-4">
                                        Nominados
                                    </label>
                                    <ParticipantSelector
                                        allParticipants={allParticipants}
                                        editingPoll={editingPoll}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="h-11 px-5 bg-white/5 hover:bg-white/10 border-2 border-white/10 rounded-xl text-gray-300 font-semibold text-sm transition-colors cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <ModalSubmitButton isCreating={isCreating} />
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ─── Participant selector ─────────────────────────────────────────────────────

function ParticipantSelector({
    allParticipants,
    editingPoll,
}: {
    allParticipants: Participant[];
    editingPoll: Poll | null;
}) {
    const [filter, setFilter] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>(() =>
        editingPoll ? editingPoll.options.map(o => o.participantId) : []
    );

    const filtered = allParticipants.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase())
    );

    const toggle = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const selectedCount = selectedIds.length;

    return (
        <>
            {/* Search + count */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 w-3 h-3" />
                    <input
                        type="text"
                        placeholder="Filtrar nominados..."
                        className="w-full bg-black border-2 border-white/10 rounded-lg text-xs py-2 pl-8 pr-3 text-white focus:border-blue-500 outline-none transition-colors"
                        onChange={(e) => setFilter(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                    />
                </div>
                {selectedCount > 0 && (
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 border-2 border-blue-500/20 rounded-full px-2 py-0.5 font-mono shrink-0">
                        {selectedCount} sel.
                    </span>
                )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {filtered.map(p => {
                    const isSelected = selectedIds.includes(p.id);
                    return (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => toggle(p.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer select-none transition-all text-left
                                ${isSelected
                                    ? "border-blue-500/50 bg-blue-500/10"
                                    : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"
                                }`}
                        >
                            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors
                                ${isSelected ? "bg-blue-500 border-blue-500" : "border-gray-600"}`}
                            >
                                {isSelected && <Check size={9} className="text-white" />}
                            </div>
                            <span className={`text-xs truncate ${isSelected ? "text-white font-medium" : "text-gray-400"}`}>
                                {p.name}
                            </span>
                        </button>
                    );
                })}
                {filtered.length === 0 && (
                    <p className="text-xs text-gray-600 col-span-2 text-center py-3">Sin resultados.</p>
                )}
            </div>

            {selectedIds.map(id => (
                <input key={id} type="hidden" name="participantIds" value={id} />
            ))}
        </>
    );
}
