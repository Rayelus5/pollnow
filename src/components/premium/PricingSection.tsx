"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";
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
        features: ["1 Evento Activo", "5 Categorías máximo por evento", "12 Nominados máximo por evento", "Votación Anónima", "Resultados Modo Gala", "Con publicidad"],
        priceId: null
    },
    {
        key: 'premium',
        title: "Premium",
        price: "2.99€",
        period: "/mes",
        description: "Para grupos de amigos activos.",
        features: ["5 Eventos Activos", "10 Categorías máximo por evento", "30 Nominados máximo por evento", "Generación de imágenes con IA", "Colaboración en tiempo real*", "Estadísticas básicas"],
        priceId: PLANS.PREMIUM.priceId,
        highlight: true
    },
    {
        key: 'plus',
        title: "Plus",
        price: "5.99€",
        period: "/mes",
        description: "Para disfrutar de eventos sin anuncios.",
        features: ["10 Eventos Activos", "15 Categorías máximo por evento", "50 Nominados máximo por evento", "Generación de imágenes con IA", "Colaboración en tiempo real*", "Estadísticas Avanzadas", "Sin publicidad"],
        priceId: PLANS.PLUS.priceId
    },
    {
        key: 'unlimited',
        title: "Unlimited",
        price: "12.99€",
        period: "/mes",
        description: "Para organizadores de eventos serios. Aumenta tus límites al máximo nivel, incluyendo desactivación de voto anónimo.",
        features: ["20 Eventos Activos", "30 Categorías máximo por evento", "100 Nominados máximo por evento", "Generación de imágenes con IA", "Colaboración en tiempo real*", "Estadísticas Avanzadas", "Creación de nominados con CSV", "Creación de categorías con CSV", "Sin publicidad", "Desactivación de voto anónimo"],
        priceId: PLANS.UNLIMITED.priceId,
        enterpriseLike: true
    },
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
        <div className="max-w-7xl mx-auto text-center w-full">

            {/* HERO TEXT ANIMADO */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-20"
            >
                {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/20 border-2 border-indigo-600/40 mb-6 backdrop-blur-sm">
                    <Sparkles size={12} className="text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-300 tracking-widest uppercase">Upgrade your party</span>
                </div> */}

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white mb-6">
                    Actualiza a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Premium</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Desbloquea todo el potencial de POLLNOW. Crea más eventos, invita a más amigos y gestiona múltiples galas simultáneamente.
                </p>
            </motion.div>

            {/* GRID DE TARJETAS */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-3 gap-6 relative w-full"
                onMouseLeave={() => setHoveredIndex(null)}
            >
                {PRICING_DATA.map((plan, index) => {
                    const isCurrent = currentPlanSlug === plan.key;
                    const isHovered = hoveredIndex === index;
                    const isBlur = hoveredIndex !== null && hoveredIndex !== index;
                    const isLastItem = index === PRICING_DATA.length - 1;
                    const isEnterpriseLike = !!plan.enterpriseLike;

                    // Si es enterprise-like, dale md:col-span-3 para que ocupe el ancho full del grid
                    const colSpanClass = isEnterpriseLike ? "md:col-span-3" : "md:col-span-1";

                    // RENDER "enterprise-style" INLINE dentro del map
                    if (isEnterpriseLike) {
                        return (
                            <motion.div
                                key={plan.key}
                                variants={cardVariants}
                                onMouseEnter={() => setHoveredIndex(index)}
                                className={clsx(
                                    "relative p-1 rounded-[2rem] transition-transform duration-500 ease-out min-w-0",
                                    colSpanClass
                                )}
                            >
                                <div className="relative overflow-hidden rounded-[2rem] border-2 border-blue-600/40 bg-gradient-to-r from-blue-900/60 via-black to-indigo-400/70 p-[1px] cursor-pointer hover:scale-102 transition-all duration-300">
                                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 px-8 py-12 md:py-20 bg-black/80 rounded-[2rem]">
                                        {/* Glow decorativo */}
                                        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-blue-600/20 blur-3xl" />
                                        <div className="pointer-events-none absolute right-0 bottom-0 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />

                                        {/* Texto principal */}
                                        <div className="relative text-left max-w-2xl">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border-2 border-blue-600/40 mb-4">
                                                <Sparkles size={12} className="text-blue-300" />
                                                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-blue-200">
                                                    Perfecto para profesionales
                                                </span>
                                            </div>

                                            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                                                Plan {plan.title}
                                            </h3>

                                            <p className="text-sm md:text-base text-gray-300 mb-4">
                                                {plan.description}
                                            </p>

                                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-8 text-gray-300">
                                                {plan.features.map((f, i) => (
                                                    <li key={i} className="flex items-center gap-2">
                                                        <div className="mt-0.5 p-1 rounded-full bg-blue-600/20 text-blue-400">
                                                            <Check size={10} strokeWidth={3} />
                                                        </div>
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Precio + CTA */}
                                        <div className="relative flex flex-col items-center md:items-end gap-4 ">
                                            {/* Price block (recommended: numeric fields) */}
                                            <div className="text-center md:text-right">
                                                <span className="block text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-1 flex flex-col items-center md:items-end">
                                                    Precio
                                                    <span className="text-lg font-bold text-blue-400 tracking-[0.05em] mb-1">¡Oferta de salida!</span>
                                                </span>

                                                <div className="flex flex-wrap items-center gap-3 justify-start md:justify-end mt-5 md:mt-0">
                                                    {/* Original price (tached) */}
                                                    <div className="flex flex-col justify-end p-2 rounded-xl bg-blue-950/40 border-2 border-blue-400/30">
                                                        <span
                                                            className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs md:text-sm justify-center font-semibold bg-blue-600 text-white"
                                                            aria-hidden="true"
                                                        >
                                                            -{Math.round((1 - 12.99 / 24.99) * 100)}%
                                                        </span>

                                                        <span
                                                            className="text-md md:text-xl text-gray-400 line-through opacity-80"
                                                            aria-hidden="true"
                                                        >
                                                            €{24.99.toFixed(2)}
                                                        </span>

                                                    </div>

                                                    {/* Discounted price (prominent) */}
                                                    <div className="text-5xl md:text-6xl font-extrabold text-blue-300">
                                                        {plan.price}
                                                        {plan.period && <span className="text-sm text-gray-400 font-medium ml-2">{plan.period}</span>}
                                                    </div>
                                                </div>

                                                {/* Hidden accessibility text describing the offer for screen readers */}
                                                <span className="sr-only">
                                                    Original price 24.99€. Now {plan.price}€.
                                                </span>
                                            </div>


                                            {/* CTA: si es current muestra Manage, si tiene priceId muestra Checkout, si no es priceId (ej enterprise) link a contacto */}
                                            {isCurrent ? (
                                                plan.priceId ? (
                                                    <ManageButton />
                                                ) : (
                                                    <div className="w-full py-3 px-8rounded-xl font-bold border-2 border-green-500/30 text-green-400 bg-green-500/5 cursor-default flex items-center justify-center gap-2">
                                                        <Check size={16} /> Plan Actual
                                                    </div>
                                                )
                                            ) : plan.priceId ? (
                                                <CheckoutButton priceId={plan.priceId} highlight={plan.highlight || false} />
                                            ) : (
                                                <Link
                                                    href="/about#contact"
                                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm md:text-base bg-white text-black hover:bg-gray-100 transition-colors border-2 border-white/10"
                                                >
                                                    Contactar
                                                    <ArrowRight size={16} />
                                                </Link>
                                            )}

                                            <span className="text-[11px] text-gray-500 max-w-xs text-center md:text-right">
                                                {isCurrent ? "Gracias por confiar en nosotros." : "Elije el máximo nivel de creación de eventos en Pollnow."}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }

                    // RENDER NORMAL (los demás planes)
                    return (
                        <motion.div
                            key={plan.key}
                            variants={cardVariants}
                            onMouseEnter={() => setHoveredIndex(index)}
                            className={clsx(
                                "cursor-pointer relative p-5 md:p-8 rounded-[2rem] flex flex-col transition-transform duration-500 ease-out border-2 max-h-[700px] min-w-0",
                                colSpanClass,
                                plan.highlight
                                    ? "bg-neutral-900 border-indigo-600/50 shadow-[0_0_40px_-10px_rgba(59,130,246,0.15)]"
                                    : "bg-black border-white/20",
                                isBlur ? "scale-95 opacity-40 blur-[1px] grayscale-[0.5]" : "scale-100 opacity-100",
                                isHovered && "scale-[1.03] border-indigo-400 z-10 bg-neutral-900"
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
                                <div className="flex items-baseline justify-center gap-1 flex-wrap">
                                    <span className={clsx("text-4xl md:text-5xl font-black tracking-tight", plan.highlight ? "text-indigo-300" : "text-gray-200")}>
                                        {plan.price}
                                    </span>
                                    {plan.period && <span className="text-sm text-gray-500 font-medium">{plan.period}</span>}
                                </div>
                                <p className="text-sm mt-4 text-gray-400 leading-relaxed">{plan.description}</p>
                            </div>

                            {/* Lista de Features */}
                            <ul className={clsx(
                                "space-y-4 mb-8 flex-1",
                                isLastItem ? "grid grid-cols-1 lg:text-center text-left md:m-auto pb-10 max-w-[700px]" : "text-left"
                            )}>
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                        <div className={clsx(
                                            "mt-0.5 p-1 rounded-full flex-shrink-0",
                                            plan.highlight ? "bg-indigo-600/20 text-indigo-400" : "bg-white/10 text-gray-500"
                                        )}>
                                            <Check size={10} strokeWidth={3} />
                                        </div>
                                        <span className="text-left">{f}</span>
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
                                        <div className="w-full py-3 rounded-xl font-bold border-2 border-green-500/30 text-green-400 bg-green-500/5 cursor-default flex items-center justify-center gap-2">
                                            <Check size={16} /> Plan Actual
                                        </div>
                                    )
                                ) : plan.priceId ? (
                                    <CheckoutButton priceId={plan.priceId} highlight={plan.highlight || false} />
                                ) : (
                                    <button className="w-full py-3 rounded-xl font-bold border-2 border-white/10 text-gray-400 cursor-not-allowed bg-white/5">
                                        Incluido
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* TARJETA ENTERPRISE FULL-WIDTH (OPCIONAL - puedes mantenerla si quieres) */}
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="mt-10 w-full"
            >
                <div className="relative overflow-hidden rounded-[2rem] border-2 border-indigo-600/40 bg-gradient-to-r from-indigo-900/60 via-black to-indigo-400/70 p-[1px] cursor-pointer hover:scale-102 transition-all duration-300 ">
                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 px-8 py-12 md:py-20 bg-black/80 rounded-[2rem]">
                        {/* Glow decorativo */}
                        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-600/20 blur-3xl" />
                        <div className="pointer-events-none absolute right-0 bottom-0 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />

                        {/* Texto principal */}
                        <div className="relative text-left max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/40 border-2 border-indigo-600/40 mb-4">
                                <Sparkles size={12} className="text-indigo-300" />
                                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-indigo-200">
                                    Para empresas y grandes creadores
                                </span>
                            </div>

                            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                                Plan Enterprise
                            </h3>

                            <p className="text-sm md:text-base text-gray-300 mb-4">
                                Eventos ilimitados, máxima personalización y soporte prioritario. Diseñamos contigo la solución perfecta para tus galas y comunidades.
                            </p>

                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-8 text-gray-300">
                                <li className="flex items-center gap-2">
                                    <div className="mt-0.5 p-1 rounded-full bg-indigo-600/20 text-indigo-400">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    Eventos ilimitadas*
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="mt-0.5 p-1 rounded-full bg-indigo-600/20 text-indigo-400">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    Hasta 1000 nominados por evento
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="mt-0.5 p-1 rounded-full bg-indigo-600/20 text-indigo-400">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    Integraciones y features custom
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="mt-0.5 p-1 rounded-full bg-indigo-600/20 text-indigo-400">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    Soporte prioritario 1:1
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="mt-0.5 p-1 rounded-full bg-indigo-600/20 text-indigo-400">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    Sin publicidad o personalizada
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="mt-0.5 p-1 rounded-full bg-indigo-600/20 text-indigo-400">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    Todo lo de UNLIMITED
                                </li>
                            </ul>
                        </div>

                        {/* Precio + CTA */}
                        <div className="relative flex flex-col items-center md:items-end gap-4">
                            <div className="text-center md:text-right">
                                <span className="block text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-1">
                                    Precio
                                </span>
                                <div className="flex items-baseline gap-2 justify-start md:justify-end">
                                    <span className="text-4xl md:text-6xl font-black text-indigo-200">
                                        HABLEMOS
                                    </span>
                                </div>
                            </div>

                            <Link
                                href="/about#contact"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm md:text-base bg-white text-black hover:bg-gray-100 transition-colors border-2 border-white/10"
                            >
                                Hablar sobre Enterprise
                                <ArrowRight size={16} />
                            </Link>

                            <span className="text-[11px] text-gray-500 max-w-xs text-center md:text-right">
                                Cuéntanos tu caso y adaptamos POLLNOW a las necesidades de tu empresa o comunidad.
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="mt-16 text-sm text-zinc-600"
            >
                Pagos seguros procesados por Stripe. Puedes cancelar en cualquier momento.
            </motion.p> */}


            {/* SECCIÓN DE ACLARACIONES MEJORADA */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 1 }}
                className="mt-15 pt-10 text-left"
            >
                <div className="grid md:grid-cols-2 gap-8 px-4">
                    {/* Columna 1: Colaboración y Límites */}
                    <div>
                        <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                            Uso y Colaboración
                        </h4>
                        <ul className="space-y-3 text-xs text-justify text-zinc-500 leading-relaxed">
                            <li>
                                <strong className="text-zinc-400">*Colaboración en tiempo real:</strong> La capacidad de invitación varía según el plan:
                                <span className="text-zinc-300"> Premium</span> (1 invitado),
                                <span className="text-zinc-300"> Plus</span> (hasta 5) y
                                <span className="text-zinc-300"> Unlimited</span> (hasta 15).
                                Los usuarios con cuenta <span className="text-zinc-300">Gratuita</span> pueden unirse como colaboradores a un máximo de 2 eventos.
                            </li>
                            <li>
                                <strong className="text-zinc-400">*Eventos ilimitados:</strong> Los eventos ilimitados solo están disponibles para el plan <span className="text-zinc-300">Enterprise</span>. Y son un máximo exacto de 150 eventos activos.
                            </li>
                            <li>
                                <strong>Límites de Eventos:</strong> Se consideran "Eventos Activos" aquellos que están publicados o no. Los eventos que se hayan eliminado no computan para el límite del plan.
                            </li>
                            <li>
                                <strong>Monetización:</strong> Pollnow ofrece modelos de suscripción para que los usuarios puedan acceder a funciones y herramientas exclusivas. Los pagos realizados irán destinados completamente en apoyar directamente al desarrollador y mantener el proyecto.
                            </li>
                        </ul>
                    </div>

                    {/* Columna 2: Pagos y Legal */}
                    <div>
                        <h4 className="text-white text-sm text-justify font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                            Suscripción y Pagos
                        </h4>
                        <ul className="space-y-3 text-xs text-zinc-500 leading-relaxed">
                            <li>
                                <strong>Procesamiento Seguro:</strong> Todos los pagos se realizan a través de <strong>Stripe</strong>. POLLNOW no almacena datos de tu tarjeta de crédito.
                            </li>
                            <li>
                                <strong>Impuestos:</strong> Los precios mostrados incluyen el IVA aplicable según tu residencia, a menos que se indique lo contrario durante el checkout.
                            </li>
                            <li>
                                <strong>Política de Cancelación:</strong> Puedes cancelar tu suscripción en cualquier momento desde tu panel de gestión de <strong>Stripe</strong>. Mantendrás el acceso a las funciones Premium hasta el final del periodo de facturación actual.
                            </li>
                            <li>
                                <strong>Generación por IA:</strong> El uso de herramientas de IA está sujeto a políticas de uso justo y disponibilidad del proveedor del modelo.
                            </li>
                            <li>
                                <strong>Aceptación de los Términos:</strong> Al suscribirte a un plan Premium, aceptas los <a href="/legal/terms" className="text-indigo-500 hover:text-indigo-400">Términos de Servicio</a> y la <a href="/legal/privacy" className="text-indigo-500 hover:text-indigo-400">Política de Privacidad</a> de POLLNOW.
                            </li>
                        </ul>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
