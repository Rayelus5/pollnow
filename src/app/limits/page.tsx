import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getActivePlans, getPlanFromUser } from "@/lib/user-plan";
import { planBadge } from "@/lib/plans";
import type { ResolvedPlan } from "@/lib/plans";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
    Trophy,
    ListOrdered,
    CircleHelp,
    Palette,
    Check,
    X,
    Layers,
    ArrowRight,
    Info,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Límites por plan — Qué puedes hacer en Pollnow",
    description:
        "Consulta todos los límites de Pollnow según tu plan de suscripción y el modo de evento: galas, tierlists, preguntas y dibujo. Eventos, categorías, nominados, colaboradores y más.",
    alternates: { canonical: "https://pollnow.es/limits" },
    openGraph: {
        url: "https://pollnow.es/limits",
        title: "Límites por plan — Pollnow",
        description:
            "Todos los límites de Pollnow según plan de suscripción y modo de evento, en una sola página.",
    },
};

// ─── Formateadores ────────────────────────────────────────────────────────────────
const INF = "Ilimitado";
const fmtNum = (n: number | null | undefined): string =>
    n == null ? INF : n === Infinity ? INF : n.toLocaleString("es-ES");
const fmtMaxSecs = (s: number | null): string => (s == null ? INF : `${s}s`);

function YesNo({ value }: { value: boolean }) {
    return value ? (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400">
            <Check size={14} strokeWidth={3} />
        </span>
    ) : (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/5 text-gray-600">
            <X size={14} strokeWidth={3} />
        </span>
    );
}

// ─── Definición de filas por sección ────────────────────────────────────────────────
type Row = { label: string; hint?: string; value: (p: ResolvedPlan) => ReactNode };

type Section = {
    id: string;
    title: string;
    description: string;
    Icon: typeof Trophy;
    color: string; // tinte del icono
    accent: string; // color de la barra del título
    rows: Row[];
};

const SECTIONS: Section[] = [
    {
        id: "general",
        title: "Límites generales",
        description: "Aplican a cualquier evento, independientemente del modo.",
        Icon: Layers,
        color: "text-gray-300",
        accent: "bg-gray-400",
        rows: [
            {
                label: "Eventos activos",
                hint: "Eventos que tienes creados a la vez (publicados o no). Los eliminados no cuentan.",
                value: (p) => fmtNum(p.quota),
            },
            {
                label: "Colaboradores por evento",
                hint: "Personas que puedes invitar a gestionar contigo cada evento.",
                value: (p) => fmtNum(p.limits.collaboratorsPerEvent),
            },
            {
                label: "Eventos como colaborador",
                hint: "Eventos de otras personas en los que puedes colaborar.",
                value: (p) => fmtNum(p.limits.maxSharedEvents),
            },
        ],
    },
    {
        id: "gala",
        title: "Modo Gala",
        description: "El formato clásico estilo premios: categorías con nominados y votación.",
        Icon: Trophy,
        color: "text-amber-400",
        accent: "bg-amber-400",
        rows: [
            {
                label: "Categorías por evento",
                hint: "Número de votaciones (categorías) que puede tener una gala.",
                value: (p) => fmtNum(p.limits.pollsPerEvent),
            },
            {
                label: "Nominados por evento",
                hint: "Total de nominados que puedes repartir entre las categorías.",
                value: (p) => fmtNum(p.limits.participantsPerEvent),
            },
        ],
    },
    {
        id: "tierlist",
        title: "Modo Tierlist",
        description: "Un único tema; el público arrastra los nominados a tus tiers.",
        Icon: ListOrdered,
        color: "text-blue-400",
        accent: "bg-blue-400",
        rows: [
            {
                label: "Tiers por evento",
                hint: "Niveles personalizables (S, A, B… o los que quieras) en los que clasificar.",
                value: (p) => fmtNum(p.limits.tierlistMaxTiers),
            },
            {
                label: "Nominados por evento",
                hint: "Elementos que el público puede ordenar entre los tiers.",
                value: (p) => fmtNum(p.limits.tierlistMaxOptions),
            },
        ],
    },
    {
        id: "preguntas",
        title: "Modo Preguntas",
        description: "Formularios tipo encuesta con respuestas de opción única o múltiple. Resultados privados.",
        Icon: CircleHelp,
        color: "text-violet-400",
        accent: "bg-violet-400",
        rows: [
            {
                label: "Preguntas por evento",
                value: (p) => fmtNum(p.limits.preguntasMaxQuestions),
            },
            {
                label: "Opciones por pregunta",
                hint: "Respuestas posibles en cada pregunta de opción única o múltiple.",
                value: (p) => fmtNum(p.limits.preguntasMaxOptions),
            },
            {
                label: "Preguntas por página",
                hint: "Cuántas preguntas se muestran juntas antes de pasar de página.",
                value: (p) => fmtNum(p.limits.preguntasMaxPerPage),
            },
        ],
    },
    {
        id: "dibujo",
        title: "Modo Dibujo",
        description: "Inspirado en Gartic Phone: dibujar → votar → resultados. Siempre privado.",
        Icon: Palette,
        color: "text-pink-400",
        accent: "bg-pink-400",
        rows: [
            {
                label: "Eventos de dibujo",
                hint: "Cuántos eventos de tipo Dibujo puedes tener. No disponible en el plan gratuito.",
                value: (p) =>
                    p.limits.drawingMaxEvents === 0 ? (
                        <span className="text-gray-600">No disponible</span>
                    ) : (
                        fmtNum(p.limits.drawingMaxEvents)
                    ),
            },
            {
                label: "Tiempo mín. por dibujo",
                hint: "Tiempo mínimo que puedes dar a cada participante para dibujar.",
                value: (p) =>
                    p.limits.drawingMaxEvents === 0
                        ? "—"
                        : p.limits.drawingMinTimeSecs == null
                        ? "—"
                        : `${p.limits.drawingMinTimeSecs}s`,
            },
            {
                label: "Tiempo máx. por dibujo",
                hint: "Tiempo máximo configurable por participante.",
                value: (p) =>
                    p.limits.drawingMaxEvents === 0 ? "—" : fmtMaxSecs(p.limits.drawingMaxTimeSecs),
            },
            {
                label: "Tiempo ilimitado",
                hint: "Permitir dibujar sin límite de tiempo.",
                value: (p) => <YesNo value={p.limits.drawingAllowUnlimited} />,
            },
        ],
    },
];

// ─── Tabla de una sección ───────────────────────────────────────────────────────────
function SectionTable({
    section,
    plans,
    currentSlug,
}: {
    section: Section;
    plans: ResolvedPlan[];
    currentSlug: string;
}) {
    const { Icon } = section;
    return (
        <section className="mb-12">
            <div className="flex items-start gap-3 mb-5">
                <div className="mt-0.5 flex items-center justify-center w-10 h-10 rounded-xl border-2 border-white/10 bg-white/[0.03] shrink-0">
                    <Icon size={20} className={section.color} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className={`w-1 h-4 rounded-full ${section.accent}`} />
                        {section.title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border-2 border-white/10">
                <table className="w-full min-w-[640px] text-sm border-collapse">
                    <thead>
                        <tr className="bg-white/[0.03]">
                            <th className="text-left font-semibold text-gray-400 px-4 py-3 w-[34%]">
                                Característica
                            </th>
                            {plans.map((p) => {
                                const badge = planBadge(p.slug);
                                const isCurrent = p.slug === currentSlug;
                                return (
                                    <th
                                        key={p.slug}
                                        className={`px-4 py-3 text-center font-semibold ${
                                            isCurrent ? "bg-indigo-500/10" : ""
                                        }`}
                                    >
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] ${badge.className}`}
                                        >
                                            {p.name}
                                        </span>
                                        {isCurrent && (
                                            <span className="block text-[10px] font-medium text-indigo-300 mt-1">
                                                Tu plan
                                            </span>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {section.rows.map((row, ri) => (
                            <tr
                                key={row.label}
                                className={ri % 2 === 0 ? "" : "bg-white/[0.015]"}
                            >
                                <td className="px-4 py-3 align-top">
                                    <span className="text-gray-200 font-medium">{row.label}</span>
                                    {row.hint && (
                                        <span className="block text-xs text-gray-600 mt-0.5 leading-snug">
                                            {row.hint}
                                        </span>
                                    )}
                                </td>
                                {plans.map((p) => {
                                    const isCurrent = p.slug === currentSlug;
                                    return (
                                        <td
                                            key={p.slug}
                                            className={`px-4 py-3 text-center font-mono font-bold text-white tabular-nums ${
                                                isCurrent ? "bg-indigo-500/[0.07]" : ""
                                            }`}
                                        >
                                            {row.value(p)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

// ─── Página ─────────────────────────────────────────────────────────────────────────
export default async function LimitsPage() {
    const session = await auth();
    const plans = await getActivePlans();

    let currentSlug = "free";
    if (session?.user?.id) {
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (user) currentSlug = (await getPlanFromUser(user)).slug;
    }

    return (
        <main className="min-h-screen bg-black text-white pt-24 pb-24 px-6 relative overflow-hidden">
            {/* Fondo ambiental */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-900/10 rounded-[100%] blur-[120px] pointer-events-none" />

            <div className="max-w-5xl mx-auto relative">
                {/* Hero */}
                <header className="text-center mb-14">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/20 border-2 border-indigo-600/40 mb-5">
                        <Info size={12} className="text-indigo-400" />
                        <span className="text-[11px] font-bold text-indigo-300 tracking-widest uppercase">
                            Aclaración de límites
                        </span>
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                        Qué puedes hacer{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">
                            según tu plan
                        </span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Todos los límites de Pollnow en un solo sitio, organizados por plan de
                        suscripción y por modo de evento. Así sabes exactamente qué desbloqueas con
                        cada plan antes de empezar.
                    </p>
                </header>

                {/* Tablas por sección */}
                {SECTIONS.map((section) => (
                    <SectionTable
                        key={section.id}
                        section={section}
                        plans={plans}
                        currentSlug={currentSlug}
                    />
                ))}

                {/* Notas */}
                <div className="mt-4 rounded-2xl border-2 border-white/10 bg-white/[0.02] p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-indigo-500 rounded-full" />
                        Notas importantes
                    </h3>
                    <ul className="space-y-3 text-xs text-gray-500 leading-relaxed">
                        <li>
                            <strong className="text-gray-400">Ilimitado</strong> significa sin tope
                            práctico para el uso normal; el plan <span className="text-gray-300">Enterprise</span>{" "}
                            mantiene un máximo de 150 eventos activos.
                        </li>
                        <li>
                            <strong className="text-gray-400">Modo Dibujo</strong> no está disponible
                            en el plan gratuito y los eventos de dibujo son siempre privados.
                        </li>
                        <li>
                            <strong className="text-gray-400">Modo Preguntas:</strong> los resultados
                            solo son visibles para quien crea el evento.
                        </li>
                        <li>
                            Los límites son la fuente de verdad de tu cuenta y pueden actualizarse;
                            esta página siempre refleja los valores vigentes.
                        </li>
                    </ul>
                </div>

                {/* CTA */}
                <div className="mt-12 text-center">
                    <Link
                        href="/premium"
                        className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold bg-white text-black hover:bg-gray-100 transition-colors"
                    >
                        Ver planes y precios
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </main>
    );
}
