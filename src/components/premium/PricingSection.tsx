"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { PLANS } from "@/lib/plans";
import CheckoutButton from "@/components/premium/CheckoutButton";
import ManageButton from "@/components/premium/ManageButton";

// Datos visuales de los planes
const PRICING_DATA = [
    {
        key: 'free',
        title: "Free",
        price: "GRATIS",
        description: "Prueba la experiencia sin compromiso.",
        features: ["1 Evento Activo", "5 Categorías máximo por evento", "12 Participantes máximo por evento", "Votación Anónima", "Resultados Modo Gala", "Sin publicidad"],
        priceId: null
    },
    {
        key: 'premium',
        title: "Premium",
        price: "4.99€",
        period: "/mes",
        description: "Para grupos de amigos activos.",
        features: ["5 Eventos Activos", "10 Categorías máximo por evento", "30 Participantes máximo por evento", "Estadísticas básicas", "Todo lo de Free"],
        priceId: PLANS.PREMIUM.priceId,
        highlight: true
    },
    {
        key: 'plus',
        title: "Unlimited",
        price: "12.99€",
        period: "/mes",
        description: "Para organizadores de eventos seriales.",
        features: ["Eventos ILIMITADOS", "50 Categorías máximo por evento", "150 Participantes máximo por evento", "Desactivación de voto anónimo", "Estadísticas Avanzadas", "Todo lo de Premium"],
        priceId: PLANS.PLUS.priceId
    }
];

// Variantes de animación
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
};

const cardVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 50, damping: 15 }
    }
};

export default function PricingSection({ currentPlanSlug }: { currentPlanSlug: string }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div className="max-w-7xl mx-auto text-center">

            {/* HERO TEXT ANIMADO */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-20"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/20 border border-indigo-500/40 mb-6 backdrop-blur-sm">
                    <Sparkles size={12} className="text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-300 tracking-widest uppercase">Upgrade your party</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white mb-6">
                    Elige tu nivel <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Premium</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Desbloquea todo el potencial de FOTY. Crea más eventos, invita a más amigos y gestiona múltiples galas simultáneamente.
                </p>
            </motion.div>

            {/* GRID DE TARJETAS */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-3 gap-6 relative"
                onMouseLeave={() => setHoveredIndex(null)} // Reset al salir del grid
            >
                {PRICING_DATA.map((plan, index) => {
                    const isCurrent = currentPlanSlug === plan.key;
                    const isHovered = hoveredIndex === index;
                    const isBlur = hoveredIndex !== null && hoveredIndex !== index;

                    return (
                        <motion.div
                            key={plan.key}
                            variants={cardVariants}
                            onMouseEnter={() => setHoveredIndex(index)}
                            className={clsx(
                                "cursor-pointer relative p-8 rounded-[2rem] flex flex-col transition-all duration-500 ease-out border max-h-[700px]",
                                // Estilos base vs Highlight
                                plan.highlight
                                    ? "bg-neutral-900 border-indigo-500/50 shadow-[0_0_40px_-10px_rgba(59,130,246,0.15)]"
                                    : "bg-black border-white/10",
                                // Efecto Focus / Blur
                                isBlur ? "scale-95 opacity-40 blur-[2px] grayscale-[0.5]" : "scale-100 opacity-100",
                                isHovered && "scale-[1.03] border-indigo-400 shadow-[0_0_60px_-10px_rgba(59,130,246,0.3)] z-10 bg-neutral-900"
                            )}
                        >
                            {/* Badge de "Popular" */}
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-indigo-400 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                                    Más Popular
                                </div>
                            )}

                            {/* Header de la Tarjeta */}
                            <div className="mb-8">
                                <h3 className={clsx("text-xl font-bold mb-2", plan.highlight ? "text-white" : "text-gray-300")}>
                                    {plan.title}
                                </h3>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className={clsx("text-5xl font-black tracking-tight", plan.highlight ? "text-indigo-300" : "text-gray-200")}>
                                        {plan.price}
                                    </span>
                                    {plan.period && <span className="text-sm text-gray-500 font-medium">{plan.period}</span>}
                                </div>
                                <p className="text-sm mt-4 text-gray-400 leading-relaxed">{plan.description}</p>
                            </div>

                            {/* Lista de Features */}
                            <ul className="space-y-4 mb-8 flex-1 text-left">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                        <div className={clsx(
                                            "mt-0.5 p-1 rounded-full",
                                            plan.highlight ? "bg-indigo-500/20 text-indigo-400" : "bg-white/10 text-gray-500"
                                        )}>
                                            <Check size={10} strokeWidth={3} />
                                        </div>
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {/* Botón de Acción */}
                            <div className="mt-auto">
                                {isCurrent ? (
                                    plan.priceId ? (
                                        <div className="animate-in zoom-in duration-300">
                                            <ManageButton />
                                        </div>
                                    ) : (
                                        <div className="w-full py-3 rounded-xl font-bold border border-green-500/30 text-green-400 bg-green-500/5 cursor-default flex items-center justify-center gap-2">
                                            <Check size={16} /> Plan Actual
                                        </div>
                                    )
                                ) : plan.priceId ? (
                                    <CheckoutButton priceId={plan.priceId} highlight={plan.highlight || false} />
                                ) : (
                                    <button className="w-full py-3 rounded-xl font-bold border border-white/10 text-gray-400 cursor-not-allowed bg-white/5">
                                        Incluido
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="mt-16 text-sm text-gray-600"
            >
                Pagos seguros procesados por Stripe. Puedes cancelar en cualquier momento.
            </motion.p>
        </div>
    );
}