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
import { PLANS } from "@/lib/plans";

type PlanLimits = {
    pollsPerEvent?: number | null;
    participantsPerEvent?: number | null;
    collaboratorsPerEvent?: number | null;
    maxSharedEvents?: number | null;
    // TIERLIST
    tierlistMaxTiers?: number | null;
    tierlistMaxOptions?: number | null;
    // PREGUNTAS
    preguntasMaxQuestions?: number | null;
    preguntasMaxOptions?: number | null;
    preguntasMaxPerPage?: number | null;
    // DIBUJO
    drawingMaxEvents?: number | null;
    drawingMinTimeSecs?: number | null;
    drawingMaxTimeSecs?: number | null;
    drawingAllowUnlimited?: boolean | null;
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
    // TIERLIST
    tierlistMaxTiers: 5,
    tierlistMaxOptions: 10,
    // PREGUNTAS
    preguntasMaxQuestions: 8,
    preguntasMaxOptions: 5,
    preguntasMaxPerPage: 4,
    // DIBUJO
    drawingMaxEvents: 0,
    drawingMinTimeSecs: "" as number | "",
    drawingMaxTimeSecs: "" as number | "",
    drawingAllowUnlimited: false,
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

    // Fallback por SLUG a los límites hardcodeados: si el JSON de BD aún no tiene los
    // campos nuevos, el formulario muestra los valores correctos del plan (no los de FREE).
    const fb = plan ? Object.values(PLANS).find((p) => p.slug === plan.slug)?.limits : undefined;
    const timeInit = (dbv: number | null | undefined, fbv: number | null | undefined): number | "" => {
        if (dbv === undefined) return fbv === null || fbv === undefined ? "" : fbv;
        return dbv === null ? "" : dbv;
    };

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
        // TIERLIST
        tierlistMaxTiers: num(plan?.limits.tierlistMaxTiers, fb?.tierlistMaxTiers ?? EMPTY_DRAFT.tierlistMaxTiers),
        tierlistMaxOptions: num(plan?.limits.tierlistMaxOptions, fb?.tierlistMaxOptions ?? EMPTY_DRAFT.tierlistMaxOptions),
        // PREGUNTAS
        preguntasMaxQuestions: num(plan?.limits.preguntasMaxQuestions, fb?.preguntasMaxQuestions ?? EMPTY_DRAFT.preguntasMaxQuestions),
        preguntasMaxOptions: num(plan?.limits.preguntasMaxOptions, fb?.preguntasMaxOptions ?? EMPTY_DRAFT.preguntasMaxOptions),
        preguntasMaxPerPage: num(plan?.limits.preguntasMaxPerPage, fb?.preguntasMaxPerPage ?? EMPTY_DRAFT.preguntasMaxPerPage),
        // DIBUJO
        drawingMaxEvents: num(plan?.limits.drawingMaxEvents, fb?.drawingMaxEvents ?? EMPTY_DRAFT.drawingMaxEvents),
        drawingMinTimeSecs: timeInit(plan?.limits.drawingMinTimeSecs, fb?.drawingMinTimeSecs),
        drawingMaxTimeSecs: timeInit(plan?.limits.drawingMaxTimeSecs, fb?.drawingMaxTimeSecs),
        drawingAllowUnlimited: plan?.limits.drawingAllowUnlimited ?? fb?.drawingAllowUnlimited ?? EMPTY_DRAFT.drawingAllowUnlimited,
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
                tierlistMaxTiers: Number(form.tierlistMaxTiers),
                tierlistMaxOptions: Number(form.tierlistMaxOptions),
                preguntasMaxQuestions: Number(form.preguntasMaxQuestions),
                preguntasMaxOptions: Number(form.preguntasMaxOptions),
                preguntasMaxPerPage: Number(form.preguntasMaxPerPage),
                drawingMaxEvents: Number(form.drawingMaxEvents),
                drawingMinTimeSecs: form.drawingMinTimeSecs === "" ? null : Number(form.drawingMinTimeSecs),
                drawingMaxTimeSecs: form.drawingMaxTimeSecs === "" ? null : Number(form.drawingMaxTimeSecs),
                drawingAllowUnlimited: form.drawingAllowUnlimited,
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

            {/* TIERLIST */}
            <ModeHeader label="Modo Tierlist" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Tiers máx.">
                    <input type="number" value={form.tierlistMaxTiers} onChange={(e) => set("tierlistMaxTiers", e.target.value as unknown as number)} className={inputCls} />
                </Field>
                <Field label="Nominados máx.">
                    <input type="number" value={form.tierlistMaxOptions} onChange={(e) => set("tierlistMaxOptions", e.target.value as unknown as number)} className={inputCls} />
                </Field>
            </div>

            {/* PREGUNTAS */}
            <ModeHeader label="Modo Preguntas" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Preguntas máx.">
                    <input type="number" value={form.preguntasMaxQuestions} onChange={(e) => set("preguntasMaxQuestions", e.target.value as unknown as number)} className={inputCls} />
                </Field>
                <Field label="Opciones/pregunta">
                    <input type="number" value={form.preguntasMaxOptions} onChange={(e) => set("preguntasMaxOptions", e.target.value as unknown as number)} className={inputCls} />
                </Field>
                <Field label="Preguntas/página">
                    <input type="number" value={form.preguntasMaxPerPage} onChange={(e) => set("preguntasMaxPerPage", e.target.value as unknown as number)} className={inputCls} />
                </Field>
            </div>

            {/* DIBUJO */}
            <ModeHeader label="Modo Dibujo" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Eventos dibujo máx. (0 = no)">
                    <input type="number" value={form.drawingMaxEvents} onChange={(e) => set("drawingMaxEvents", e.target.value as unknown as number)} className={inputCls} />
                </Field>
                <Field label="Tiempo mín. (s)">
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={form.drawingMinTimeSecs}
                            disabled={form.drawingMinTimeSecs === ""}
                            onChange={(e) => set("drawingMinTimeSecs", e.target.value as unknown as number)}
                            placeholder="—"
                            className={`${inputCls} ${form.drawingMinTimeSecs === "" ? "opacity-40" : ""}`}
                        />
                        <label className="flex items-center gap-1 text-[10px] text-gray-500 whitespace-nowrap cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.drawingMinTimeSecs === ""}
                                onChange={(e) => set("drawingMinTimeSecs", e.target.checked ? "" : 10)}
                            />
                            n/a
                        </label>
                    </div>
                </Field>
                <Field label="Tiempo máx. (s)">
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={form.drawingMaxTimeSecs}
                            disabled={form.drawingMaxTimeSecs === ""}
                            onChange={(e) => set("drawingMaxTimeSecs", e.target.value as unknown as number)}
                            placeholder="∞"
                            className={`${inputCls} ${form.drawingMaxTimeSecs === "" ? "opacity-40" : ""}`}
                        />
                        <label className="flex items-center gap-1 text-[10px] text-gray-500 whitespace-nowrap cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.drawingMaxTimeSecs === ""}
                                onChange={(e) => set("drawingMaxTimeSecs", e.target.checked ? "" : 180)}
                            />
                            ∞
                        </label>
                    </div>
                </Field>
                <Field label="Permite tiempo ilimitado">
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer h-[42px] px-3 rounded-xl bg-white/5 border-2 border-white/20">
                        <input
                            type="checkbox"
                            checked={form.drawingAllowUnlimited}
                            onChange={(e) => set("drawingAllowUnlimited", e.target.checked)}
                        />
                        {form.drawingAllowUnlimited ? "Sí" : "No"}
                    </label>
                </Field>
            </div>

            {/* Features JSON — también alimenta la página /premium */}
            <div className="mt-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Features (JSON)</label>
                <p className="text-[10px] text-gray-600 ml-1 mt-0.5 mb-1 leading-relaxed">
                    Controla cómo se ve este plan en <span className="text-gray-400">/premium</span>. Claves soportadas:{" "}
                    <code className="text-blue-400">featureList</code> (array de textos),{" "}
                    <code className="text-blue-400">tagline</code> (string),{" "}
                    <code className="text-blue-400">period</code> (ej. &quot;/mes&quot;),{" "}
                    <code className="text-blue-400">highlight</code> (bool, badge &quot;Más popular&quot;),{" "}
                    <code className="text-blue-400">enterpriseLike</code> (bool, tarjeta ancha),{" "}
                    <code className="text-blue-400">originalPrice</code> (número, para mostrar descuento). Si se dejan vacías, /premium usa textos por defecto.
                </p>
                <textarea
                    value={form.features}
                    onChange={(e) => set("features", e.target.value)}
                    rows={4}
                    placeholder={`{\n  "tagline": "Para grupos de amigos activos.",\n  "featureList": ["5 Eventos Activos", "Generación con IA"],\n  "highlight": true\n}`}
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

function ModeHeader({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 mt-5 mb-3">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">{label}</span>
            <div className="flex-1 h-px bg-white/10" />
        </div>
    );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
    return (
        <div className={`space-y-1.5 ${wide ? "col-span-2" : ""}`}>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
            {children}
        </div>
    );
}
