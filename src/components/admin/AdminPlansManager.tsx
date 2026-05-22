"use client";

import { useState, useTransition } from "react";
import { Save, Trash2, Plus, Check, X, AlertTriangle, Loader2 } from "lucide-react";
import {
    updateSubscriptionPlan,
    createSubscriptionPlan,
    togglePlanActive,
    deleteSubscriptionPlan,
    type PlanFormInput,
} from "@/app/lib/plan-actions";

type PlanLimits = {
    pollsPerEvent?: number | null;
    participantsPerEvent?: number | null;
    collaboratorsPerEvent?: number | null;
    maxSharedEvents?: number | null;
};

export type AdminPlan = {
    id: string;
    name: string;
    slug: string;
    quota: number;
    price: number;
    stripePriceId: string | null;
    isActive: boolean;
    sortOrder: number;
    limits: PlanLimits;
    features: Record<string, unknown>;
    userCount: number;
};

const EMPTY_DRAFT = {
    name: "",
    slug: "",
    quota: 1,
    price: 0,
    stripePriceId: "",
    sortOrder: 99,
    isActive: true,
    pollsPerEvent: 5,
    participantsPerEvent: 12,
    collaboratorsPerEvent: 0,
    maxSharedEvents: "" as number | "",
    features: "{}",
};

export default function AdminPlansManager({ initialPlans }: { initialPlans: AdminPlan[] }) {
    const [creating, setCreating] = useState(false);

    return (
        <div className="space-y-5">
            {initialPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
            ))}

            {creating ? (
                <PlanCard onCancelCreate={() => setCreating(false)} />
            ) : (
                <button
                    onClick={() => setCreating(true)}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-white/15 text-gray-400 hover:border-blue-500/40 hover:text-white transition-colors cursor-pointer"
                >
                    <Plus size={18} /> Crear nuevo plan
                </button>
            )}
        </div>
    );
}

function num(v: number | null | undefined, fallback = 0) {
    return v === null || v === undefined ? fallback : v;
}

function PlanCard({ plan, onCancelCreate }: { plan?: AdminPlan; onCancelCreate?: () => void }) {
    const isNew = !plan;
    const [pending, startTransition] = useTransition();
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const [form, setForm] = useState({
        name: plan?.name ?? EMPTY_DRAFT.name,
        slug: plan?.slug ?? EMPTY_DRAFT.slug,
        quota: plan?.quota ?? EMPTY_DRAFT.quota,
        price: plan?.price ?? EMPTY_DRAFT.price,
        stripePriceId: plan?.stripePriceId ?? EMPTY_DRAFT.stripePriceId,
        sortOrder: plan?.sortOrder ?? EMPTY_DRAFT.sortOrder,
        isActive: plan?.isActive ?? EMPTY_DRAFT.isActive,
        pollsPerEvent: num(plan?.limits.pollsPerEvent, EMPTY_DRAFT.pollsPerEvent),
        participantsPerEvent: num(plan?.limits.participantsPerEvent, EMPTY_DRAFT.participantsPerEvent),
        collaboratorsPerEvent: num(plan?.limits.collaboratorsPerEvent, EMPTY_DRAFT.collaboratorsPerEvent),
        maxSharedEvents:
            plan?.limits.maxSharedEvents === null || plan?.limits.maxSharedEvents === undefined
                ? ("" as number | "")
                : plan.limits.maxSharedEvents,
        features: JSON.stringify(plan?.features ?? {}, null, 2),
    });

    const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
        setForm((f) => ({ ...f, [key]: value }));

    const buildPayload = (): PlanFormInput | null => {
        let features: Record<string, unknown> = {};
        try {
            features = form.features.trim() ? JSON.parse(form.features) : {};
        } catch {
            setMsg({ type: "err", text: "El campo features no es un JSON válido." });
            return null;
        }
        return {
            name: form.name,
            slug: form.slug,
            quota: Number(form.quota),
            price: Number(form.price),
            stripePriceId: form.stripePriceId || null,
            isActive: form.isActive,
            sortOrder: Number(form.sortOrder),
            limits: {
                pollsPerEvent: Number(form.pollsPerEvent),
                participantsPerEvent: Number(form.participantsPerEvent),
                collaboratorsPerEvent: Number(form.collaboratorsPerEvent),
                maxSharedEvents: form.maxSharedEvents === "" ? null : Number(form.maxSharedEvents),
            },
            features,
        };
    };

    const handleSave = () => {
        const payload = buildPayload();
        if (!payload) return;
        startTransition(async () => {
            const res = isNew
                ? await createSubscriptionPlan(payload)
                : await updateSubscriptionPlan(plan!.id, payload);
            if (res.ok) {
                setMsg({ type: "ok", text: isNew ? "Plan creado." : "Cambios guardados." });
                if (isNew) onCancelCreate?.();
            } else {
                setMsg({ type: "err", text: res.error || "Error desconocido." });
            }
        });
    };

    const handleDelete = () => {
        if (!plan) return;
        if (!confirm(`¿Eliminar el plan "${plan.name}"? Esta acción no se puede deshacer.`)) return;
        startTransition(async () => {
            const res = await deleteSubscriptionPlan(plan.id);
            if (!res.ok) setMsg({ type: "err", text: res.error || "No se pudo eliminar." });
        });
    };

    const handleToggle = () => {
        if (!plan) return;
        startTransition(async () => {
            await togglePlanActive(plan.id);
        });
    };

    return (
        <div
            className={`bg-neutral-900/50 border-2 rounded-2xl p-6 transition-colors ${
                form.isActive ? "border-white/10" : "border-white/5 opacity-70"
            }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white">{isNew ? "Nuevo plan" : plan!.name}</h3>
                    {!isNew && (
                        <span
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border-2 ${
                                plan!.isActive
                                    ? "bg-green-900/30 text-green-400 border-green-500/20"
                                    : "bg-white/5 text-gray-500 border-white/10"
                            }`}
                        >
                            {plan!.isActive ? "Activo" : "Inactivo"}
                        </span>
                    )}
                    {!isNew && plan!.userCount > 0 && (
                        <span className="text-[11px] text-gray-500">{plan!.userCount} usuario(s)</span>
                    )}
                </div>
                {!isNew ? (
                    <button
                        onClick={handleToggle}
                        disabled={pending}
                        className="text-xs font-bold text-gray-400 hover:text-white px-3 py-1.5 rounded-full border-2 border-white/10 hover:border-white/20 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {plan!.isActive ? "Desactivar" : "Activar"}
                    </button>
                ) : (
                    <button
                        onClick={onCancelCreate}
                        className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                        title="Cancelar"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Campos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Nombre">
                    <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Slug">
                    <input value={form.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Precio (€)">
                    <input type="number" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value as unknown as number)} className={inputCls} />
                </Field>
                <Field label="Orden">
                    <input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value as unknown as number)} className={inputCls} />
                </Field>

                <Field label="Eventos (quota)">
                    <input type="number" value={form.quota} onChange={(e) => set("quota", e.target.value as unknown as number)} className={inputCls} />
                </Field>
                <Field label="Categorías/evento">
                    <input type="number" value={form.pollsPerEvent} onChange={(e) => set("pollsPerEvent", e.target.value as unknown as number)} className={inputCls} />
                </Field>
                <Field label="Nominados/evento">
                    <input type="number" value={form.participantsPerEvent} onChange={(e) => set("participantsPerEvent", e.target.value as unknown as number)} className={inputCls} />
                </Field>
                <Field label="Colaboradores/evento">
                    <input type="number" value={form.collaboratorsPerEvent} onChange={(e) => set("collaboratorsPerEvent", e.target.value as unknown as number)} className={inputCls} />
                </Field>

                <Field label="Eventos compartidos máx.">
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={form.maxSharedEvents}
                            disabled={form.maxSharedEvents === ""}
                            onChange={(e) => set("maxSharedEvents", e.target.value as unknown as number)}
                            placeholder="∞"
                            className={`${inputCls} ${form.maxSharedEvents === "" ? "opacity-40" : ""}`}
                        />
                        <label className="flex items-center gap-1 text-[10px] text-gray-500 whitespace-nowrap cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.maxSharedEvents === ""}
                                onChange={(e) => set("maxSharedEvents", e.target.checked ? "" : 0)}
                            />
                            ∞
                        </label>
                    </div>
                </Field>
                <Field label="Stripe priceId" wide>
                    <input value={form.stripePriceId} onChange={(e) => set("stripePriceId", e.target.value)} placeholder="price_… o vacío" className={inputCls} />
                </Field>
            </div>

            {/* Features JSON */}
            <div className="mt-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Features (JSON)</label>
                <textarea
                    value={form.features}
                    onChange={(e) => set("features", e.target.value)}
                    rows={2}
                    className="mt-1 w-full p-3 rounded-xl bg-white/5 border-2 border-white/20 text-white font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            {/* Mensaje + acciones */}
            <div className="flex items-center justify-between mt-5">
                <div className="text-sm">
                    {msg && (
                        <span className={`flex items-center gap-1.5 ${msg.type === "ok" ? "text-green-400" : "text-red-400"}`}>
                            {msg.type === "ok" ? <Check size={14} /> : <AlertTriangle size={14} />}
                            {msg.text}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!isNew && (
                        <button
                            onClick={handleDelete}
                            disabled={pending}
                            className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 px-3 py-2 rounded-xl border-2 border-red-500/20 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <Trash2 size={14} /> Eliminar
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={pending}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold text-sm px-5 py-2 rounded-xl shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {pending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        {isNew ? "Crear plan" : "Guardar"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const inputCls =
    "w-full p-2.5 rounded-xl bg-white/5 border-2 border-white/20 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all";

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
    return (
        <div className={`space-y-1.5 ${wide ? "col-span-2" : ""}`}>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
            {children}
        </div>
    );
}
