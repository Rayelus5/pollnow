"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Plus, Pencil, Trash2, Save, X, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/plans";
import { createTier, updateTier, deleteTier, reorderTiers } from "@/app/lib/tierlist-actions";

type Tier = { id: string; label: string; color: string; order: number };

const PRESET_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b"];

export default function TierlistManager({
    initialTiers,
    eventId,
    planSlug,
    canManage = true,
}: {
    initialTiers: Tier[];
    eventId: string;
    planSlug: string;
    canManage?: boolean;
}) {
    const router = useRouter();
    const [tiers, setTiers] = useState<Tier[]>([...initialTiers].sort((a, b) => a.order - b.order));
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setTiers([...initialTiers].sort((a, b) => a.order - b.order));
    }, [initialTiers]);

    const planKey = planSlug.toUpperCase() as keyof typeof PLANS;
    const limit = PLANS[planKey]?.limits?.tierlistMaxTiers ?? 5;
    const atLimit = tiers.length >= limit;

    async function handleCreate(formData: FormData) {
        setError(null);
        const res = await createTier(eventId, formData);
        if (res?.error) { setError(res.error); return; }
        setIsCreating(false);
        router.refresh();
    }

    async function handleUpdate(tierId: string, formData: FormData) {
        setError(null);
        const res = await updateTier(tierId, eventId, formData);
        if (res?.error) { setError(res.error); return; }
        setEditingId(null);
        router.refresh();
    }

    async function handleDelete(tierId: string) {
        await deleteTier(tierId, eventId);
        router.refresh();
    }

    async function onDragEnd(result: DropResult) {
        if (!result.destination || result.destination.index === result.source.index) return;
        const reordered = Array.from(tiers);
        const [moved] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, moved);
        setTiers(reordered);
        await reorderTiers(reordered.map((t, i) => ({ id: t.id, order: i })), eventId);
        router.refresh();
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Tiers (Categorías)</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border-2 font-mono ${atLimit ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-gray-500 border-gray-700"}`}>
                        {tiers.length} / {limit}
                    </span>
                </div>
                {canManage && (
                    <button
                        onClick={() => (atLimit ? setError(`Has alcanzado el límite de ${limit} tiers de tu plan.`) : setIsCreating(true))}
                        className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <Plus size={14} /> Nuevo tier
                    </button>
                )}
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border-2 border-red-500/30 rounded-xl text-red-300 text-sm">{error}</div>
            )}

            {isCreating && (
                <TierForm
                    onSubmit={handleCreate}
                    onCancel={() => setIsCreating(false)}
                    suggestedColor={PRESET_COLORS[tiers.length % PRESET_COLORS.length]}
                />
            )}

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="tiers">
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                            {tiers.map((tier, index) => (
                                <Draggable key={tier.id} draggableId={tier.id} index={index} isDragDisabled={!canManage || editingId === tier.id}>
                                    {(prov) => (
                                        <div
                                            ref={prov.innerRef}
                                            {...prov.draggableProps}
                                            className="bg-neutral-900/60 border-2 border-white/8 rounded-xl overflow-hidden"
                                        >
                                            {editingId === tier.id ? (
                                                <div className="p-3">
                                                    <TierForm
                                                        initialLabel={tier.label}
                                                        initialColor={tier.color}
                                                        onSubmit={(fd) => handleUpdate(tier.id, fd)}
                                                        onCancel={() => setEditingId(null)}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 p-3">
                                                    {canManage && (
                                                        <span {...prov.dragHandleProps} className="text-gray-600 hover:text-gray-300 cursor-grab">
                                                            <GripVertical size={16} />
                                                        </span>
                                                    )}
                                                    <div
                                                        className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-black/80 text-sm shrink-0"
                                                        style={{ backgroundColor: tier.color }}
                                                    >
                                                        {tier.label.slice(0, 3)}
                                                    </div>
                                                    <span className="flex-1 font-semibold text-white truncate">{tier.label}</span>
                                                    {canManage && (
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => setEditingId(tier.id)} className="h-9 w-9 flex items-center justify-center text-blue-400/70 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg cursor-pointer">
                                                                <Pencil size={15} />
                                                            </button>
                                                            <button onClick={() => handleDelete(tier.id)} className="h-9 w-9 flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg cursor-pointer">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {tiers.length === 0 && !isCreating && (
                <div className="text-center py-12 border-2 border-dashed border-white/8 rounded-xl text-gray-600 text-sm flex flex-col items-center gap-2">
                    <Layers size={28} className="text-gray-700" />
                    Aún no hay tiers. Crea el primero (S, A, B…).
                </div>
            )}
        </div>
    );
}

function TierForm({
    initialLabel = "",
    initialColor = PRESET_COLORS[0],
    suggestedColor,
    onSubmit,
    onCancel,
}: {
    initialLabel?: string;
    initialColor?: string;
    suggestedColor?: string;
    onSubmit: (formData: FormData) => void | Promise<void>;
    onCancel: () => void;
}) {
    const [label, setLabel] = useState(initialLabel);
    const [color, setColor] = useState(suggestedColor ?? initialColor);

    return (
        <form
            action={onSubmit}
            className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border-2 border-blue-500/30 bg-blue-950/10"
        >
            <input type="hidden" name="color" value={color} />
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-lg bg-transparent border-2 border-white/15 cursor-pointer"
                    title="Color del tier"
                />
                <div className="hidden sm:flex gap-1">
                    {PRESET_COLORS.map((c) => (
                        <button key={c} type="button" onClick={() => setColor(c)} className="w-5 h-5 rounded-full border border-white/20 cursor-pointer" style={{ backgroundColor: c }} />
                    ))}
                </div>
            </div>
            <input
                name="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={50}
                required
                autoFocus
                placeholder="Nombre del tier (S, A, Top…)"
                className="flex-1 bg-black border-2 border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
            />
            <div className="flex gap-2">
                <button type="submit" className="h-10 px-4 bg-white text-black rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-gray-100 cursor-pointer">
                    <Save size={14} /> Guardar
                </button>
                <button type="button" onClick={onCancel} className="h-10 px-3 bg-white/5 border-2 border-white/10 text-gray-400 rounded-lg hover:bg-white/10 cursor-pointer">
                    <X size={14} />
                </button>
            </div>
        </form>
    );
}
