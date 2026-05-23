"use client";

import Link from "next/link";
import { motion, Variants, AnimatePresence } from "framer-motion";
import {
    Trophy,
    Lock,
    Palette,
    ArrowRight,
    Plus,
    ListOrdered,
    CircleHelp,
    Wand2,
    Users,
    FileSpreadsheet,
    BarChart3,
    ChevronDown,
    ThumbsUp,
    ThumbsDown,
    Star,
    Check,
    Share2,
    Rocket,
    Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { LANDING_FAQ } from "@/components/home/faq-data";
// import LiquidGlass from 'liquid-glass-react'
// import { text } from "stream/consumers";
// import { AwardMockup3D } from "@/components/home/AwardMockup3D";
// import next from "next";
// import { is } from "date-fns/locale";

// --- DATOS DE ANIMACIÓN DEL TÍTULO ---
const WORDS = [
    {
        text: "Game Awards.",
        // Degradado de Texto
        gradient: "from-cyan-400 via-blue-500 to-indigo-600",
        // Degradado de la Sombra/Glow
        shadow: "from-cyan-500/50 via-blue-500/50 to-indigo-500/50",
        // Colores de los blobs del fondo (blob1, blob2, blob3)
        blobs: ["rgb(29 78 216)", "rgb(99 102 241)", "rgb(6 182 212)"]
    },
    {
        text: "Oscars.",
        gradient: "from-amber-200 via-yellow-400 to-orange-500",
        shadow: "from-amber-300/50 via-yellow-500/50 to-orange-500/50",
        blobs: ["rgb(217 119 6)", "rgb(249 115 22)", "rgb(251 191 36)"]
    },
    {
        text: "Grammys.",
        gradient: "from-pink-300 via-purple-500 to-indigo-500",
        shadow: "from-pink-500/50 via-purple-500/50 to-indigo-500/50",
        blobs: ["rgb(236 72 153)", "rgb(168 85 247)", "rgb(99 102 241)"]
    },
    {
        text: "ESLANDs.",
        gradient: "from-emerald-300 via-teal-500 to-cyan-600",
        shadow: "from-emerald-500/50 via-teal-500/50 to-cyan-500/50",
        blobs: ["rgb(16 185 129)", "rgb(20 184 166)", "rgb(6 182 212)"]
    },
    {
        text: "Tierlists.",
        gradient: "from-teal-300 via-emerald-500 to-green-600",
        shadow: "from-teal-500/50 via-emerald-500/50 to-green-500/50",
        blobs: ["rgb(20 184 166)", "rgb(16 185 129)", "rgb(34 197 94)"]
    }
];

const TITLES = [
    {
        text: "Crea tus propios"
    },
    {
        text: "Crea tus propias"
    },
]

// --- VARIANTES DE ANIMACIÓN ---

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2,
        },
    },
};

const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0, filter: "blur(8px)" },
    visible: {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 0.8, ease: "easeOut" },
    },
};

const itemFeatureVariants: Variants = {
    hidden: { y: 30, opacity: 0, filter: "blur(5px)" },
    visible: {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 0.3, ease: "easeInOut" },
    },
};

const featureContainerVariants: Variants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.2 }
    }
};

export default function LandingClient({ session, showAds = true }: { session: any, showAds?: boolean }) {
    const [index, setIndex] = useState(0);

    const loggedIn = session?.user?.id ? true : false;

    // Rotación de palabras cada 3 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % WORDS.length);

        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const specificIndexes = [4]; // Indexes específicos
    const currentTitle = specificIndexes.includes(index) ? TITLES[1] : TITLES[0];
    const currentWord = WORDS[index];

    // const [showPopup, setShowPopup] = useState(false);

    // useEffect(() => {
    //     const AD_KEY = "ad_last_shown";
    //     const COOLDOWN = 60 * 60 * 1000; // 1 hora en ms

    //     const lastShown = localStorage.getItem(AD_KEY);
    //     const elapsed = lastShown ? Date.now() - parseInt(lastShown, 10) : Infinity;

    //     if (elapsed < COOLDOWN) return; // Todavía dentro del período de cooldown

    //     const timer = setTimeout(() => {
    //         setShowPopup(true);
    //         localStorage.setItem(AD_KEY, String(Date.now()));
    //     }, 3000);

    //     return () => clearTimeout(timer);
    // }, []);

    return (
        <div className="relative overflow-hidden bg-neutral-950">

            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">

                {/* Fondo Ambiental Hero (Optimizado "Aurora Effect") */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    {/* Blob 1 (Base) */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.05, 0.2, 0.05],
                            x: [0, 50, 0],
                            y: [0, 30, 0],
                            backgroundColor: currentWord.blobs[0]
                        }}
                        transition={{
                            scale: { duration: 15, repeat: Infinity, ease: "easeInOut" },
                            opacity: { duration: 15, repeat: Infinity, ease: "easeInOut" },
                            x: { duration: 15, repeat: Infinity, ease: "easeInOut" },
                            y: { duration: 15, repeat: Infinity, ease: "easeInOut" },
                            backgroundColor: { duration: 1.2, ease: "easeInOut" }
                        }}
                        className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full blur-[100px]"
                        style={{ willChange: "transform, opacity, background-color" }}
                    />

                    {/* Blob 2 (Acento) */}
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.15, 0.05, 0.15],
                            x: [0, -30, 0],
                            y: [0, 50, 0],
                            backgroundColor: currentWord.blobs[1]
                        }}
                        transition={{
                            scale: { duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 },
                            opacity: { duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 },
                            x: { duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 },
                            y: { duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 },
                            backgroundColor: { duration: 1.2, ease: "easeInOut" }
                        }}
                        className="absolute top-[10%] right-[20%] w-[500px] h-[500px] rounded-full blur-[100px]"
                        style={{ willChange: "transform, opacity, background-color" }}
                    />

                    {/* Blob 3 (Brillo sutil) */}
                    <motion.div
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.01, 0.1, 0.01],
                            rotate: [0, 45, 0],
                            backgroundColor: currentWord.blobs[2]
                        }}
                        transition={{
                            scale: { duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 },
                            opacity: { duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 },
                            rotate: { duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 },
                            backgroundColor: { duration: 1.2, ease: "easeInOut" }
                        }}
                        className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px]"
                        style={{ willChange: "transform, opacity, background-color" }}
                    />
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col items-center w-full"
                >
                    {/* Badge */}
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border-2 border-white/10 mb-8 backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-medium text-gray-300 tracking-wide">BETA ABIERTA</span>
                    </motion.div>

                    {/* Título con Animación Compleja */}
                    <div className="relative z-20 mb-6">
                        <motion.h1 variants={itemVariants} className="text-5xl md:text-8xl font-extrabold tracking-tighter text-white drop-shadow-xl">
                            {currentTitle.text} <br />

                            {/* Contenedor de la palabra cambiante */}
                            <div className="relative inline-block min-w-[500px] md:min-w-[900px] h-[1.2em]">
                                <AnimatePresence mode="wait">

                                    <motion.span
                                        key={index}
                                        initial={{ y: 40, opacity: 0, filter: "blur(10px)" }}
                                        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                                        exit={{ y: -40, opacity: 0, filter: "blur(10px)" }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        className={clsx(
                                            "absolute left-0 right-0 mx-auto bg-clip-text text-transparent bg-gradient-to-b pb-4 max-w-[800px]", // pb-4 para que no se corte la g o j
                                            currentWord.gradient
                                        )}
                                    >
                                        {currentWord.text}
                                    </motion.span>
                                </AnimatePresence>

                                {/* Sombra / Glow Trasero Circular en Movimiento */}
                                <div className="absolute m-auto inset-0 -z-10 pointer-events-none select-none flex justify-center items-center max-w-[300px] md:max-w-[500px]">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={`glow-${index}`}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1.2, rotate: 360 }}
                                            exit={{ opacity: 0, scale: 1.5 }}
                                            transition={{
                                                opacity: { duration: 0.5 },
                                                rotate: { duration: 10, repeat: Infinity, ease: "linear" } // Rotación continua
                                            }}
                                            className={clsx(
                                                "w-[120%] h-[150%] rounded-[100%] blur-[90px] opacity-40 bg-gradient-to-r",
                                                currentWord.shadow
                                            )}
                                            style={{ willChange: "transform, opacity" }}
                                        />
                                    </AnimatePresence>
                                </div>

                                {/* Destello / Shimmer sobre el texto */}
                                <motion.div
                                    key={`shimmer-${index}`}
                                    className="absolute bg-clip-text inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-12"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '200%' }}
                                    transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                                />
                            </div>
                        </motion.h1>
                    </div>

                    {/* Descripción */}
                    <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
                        La plataforma definitiva para organizar votaciones épicas entre amigos, comunidades o eventos. Crea <span className="text-gray-200 font-semibold">galas</span>, <span className="text-gray-200 font-semibold">tierlists</span>, <span className="text-gray-200 font-semibold">encuestas</span> y <span className="text-gray-200 font-semibold">concursos de dibujo</span>, con diseño premium y voto anónimo por defecto.
                    </motion.p>

                    {/* Botones */}
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 relative z-30">
                        <Link
                            href={loggedIn ? "/dashboard" : "/register"}
                            className="group px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            {loggedIn ? <Plus size={18} className="text-black" /> : <Sparkles size={18} className="text-black" />}
                            {loggedIn ? "Crear evento" : "Empezar Gratis"}
                        </Link>
                        <Link
                            href="/polls"
                            className="px-8 py-4 bg-white/5 border-2 border-white/10 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all  hover:border-white/20"
                        >
                            Explorar Eventos
                        </Link>
                    </motion.div>


                </motion.div>
            </section>

            {/* --- MODOS DE EVENTO (sección estrella) --- */}
            <section id="modos" className="relative py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <SectionHeading
                        eyebrow="Crea eventos"
                        title="Diferentes modos de evento"
                        subtitle="Un mismo lugar para galas de premios, tierlists, encuestas y concursos de dibujo. Elige el formato y deja que la comunidad decida."
                    />

                    <motion.div
                        variants={featureContainerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        className="grid sm:grid-cols-2 gap-6"
                    >
                        <EventModeCard
                            Icon={Trophy}
                            accent="text-amber-400"
                            glow="bg-amber-500/10"
                            border="group-hover:border-amber-500/40"
                            title="Gala"
                            desc="El formato estilo premios: categorías con nominados y resultados sellados hasta la fecha del evento. Vive la emoción del directo con confeti."
                            mockup={<GalaMockup />}
                        />
                        <EventModeCard
                            Icon={ListOrdered}
                            accent="text-blue-400"
                            glow="bg-blue-500/10"
                            border="group-hover:border-blue-500/40"
                            title="Tierlist"
                            desc="Define tus propios tiers y deja que el público arrastre cada nominado a su nivel. La clasificación se construye con los votos de todos."
                            badge
                            mockup={<TierlistMockup />}
                        />
                        <EventModeCard
                            Icon={CircleHelp}
                            accent="text-violet-400"
                            glow="bg-violet-500/10"
                            border="group-hover:border-violet-500/40"
                            title="Preguntas"
                            desc="Encuestas tipo formulario con opción única o múltiple, multipágina y resultados privados solo para ti. Ideal para sondeos y decisiones."
                            badge
                            mockup={<PreguntasMockup />}
                        />
                        <EventModeCard
                            Icon={Palette}
                            accent="text-pink-400"
                            glow="bg-pink-500/10"
                            border="group-hover:border-pink-500/40"
                            title="Dibujo"
                            desc="Un concurso inspirado en Gartic Phone: dibujar, votar y ver el ranking. Reacciona con me gusta, no me gusta o un superlike para coronar al mejor."
                            badge
                            mockup={<DibujoMockup />}
                        />
                    </motion.div>
                </div>
            </section>

            {/* --- BENTO DE CARACTERÍSTICAS --- */}
            <section className="relative py-24 px-6 bg-neutral-950">
                <div className="max-w-7xl mx-auto">
                    <SectionHeading
                        eyebrow="Todo incluido"
                        title="Nuestras herramientas"
                        subtitle="Te ofrecemos todas las funcionalidades necesarias para montar tu propio evento profesional, sin complicarte."
                    />

                    <motion.div
                        variants={featureContainerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        className="grid md:grid-cols-3 gap-5"
                    >
                        <BentoCard
                            span="md:col-span-2"
                            Icon={Lock}
                            accent="text-emerald-400"
                            title="Voto anónimo por defecto"
                            desc="Una huella digital anónima garantiza un voto por persona sin registros forzosos. En los planes superiores puedes desactivarlo para votación identificada."
                        />
                        <BentoCard
                            Icon={Wand2}
                            accent="text-fuchsia-400"
                            title="Crea imágenes con IA"
                            desc="Genera imágenes de nominados con IA o búscalas por internet, sin salir del panel."
                        />
                        <BentoCard
                            Icon={Users}
                            accent="text-sky-400"
                            title="Colaboración en tiempo real"
                            desc="Invita a tu equipo a gestionar el evento contigo, cada uno con acceso al panel."
                        />
                        <BentoCard
                            Icon={FileSpreadsheet}
                            accent="text-green-400"
                            title="Importa y exporta CSV"
                            desc="Carga nominados, categorías, tiers y preguntas desde un CSV, y exporta tus datos."
                        />
                        <BentoCard
                            Icon={BarChart3}
                            accent="text-orange-400"
                            title="Estadísticas claras"
                            desc="Sigue la participación y los resultados de tu evento con datos fáciles de leer."
                        />
                        <BentoCard
                            span="md:col-span-3"
                            Icon={Trophy}
                            accent="text-amber-400"
                            title="Resultados sellados y momento épico"
                            desc="En el modo Gala los resultados permanecen ocultos hasta la fecha del evento. Llegado el momento, se revelan en directo con confeti para vivir la emoción sin spoilers."
                        />
                    </motion.div>
                </div>
            </section>

            {/* --- CÓMO FUNCIONA --- */}
            <section className="relative py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <SectionHeading
                        eyebrow="En 3 pasos"
                        title="¿Cómo funciona?"
                        subtitle="De la idea al resultado en minutos. Sin curva de aprendizaje."
                    />

                    <motion.div
                        variants={featureContainerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        className="grid md:grid-cols-3 gap-6"
                    >
                        <StepCard
                            n="01"
                            Icon={Plus}
                            title="Crea tu evento"
                            desc="Elige uno de los 4 modos y añade tus categorías, nominados, tiers o preguntas."
                        />
                        <StepCard
                            n="02"
                            Icon={Share2}
                            title="Comparte el enlace"
                            desc="Tu gente vota desde el enlace, sin necesidad de registrarse ni instalar nada."
                        />
                        <StepCard
                            n="03"
                            Icon={Trophy}
                            title="Disfruta los resultados"
                            desc="Revela los ganadores en directo con confeti, o consulta los resultados en privado."
                        />
                    </motion.div>
                </div>
            </section>

            {/* --- BANDA DE PLANES --- */}
            <section className="relative py-16 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="max-w-5xl mx-auto relative overflow-hidden rounded-[2rem] border-2 border-indigo-600/30 bg-gradient-to-br from-indigo-900/30 via-neutral-950 to-blue-900/20 px-8 py-12 text-center"
                >
                    <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-600/20 blur-3xl" />
                    <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-blue-600/20 blur-3xl" />

                    <div className="relative">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                            Empieza gratis. <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-500 to-indigo-300">Mejora</span> <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-200 to-white">cuando</span> lo necesites.
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto mb-8">
                            Crea tu primer evento sin pagar nada. Cuando quieras más eventos, categorías,
                            nominados o el modo Dibujo, sube de plan: desde Premium hasta Enterprise.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/premium"
                                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full font-bold bg-white text-black hover:bg-gray-100 transition-colors"
                            >
                                <Sparkles size={16} />
                                Ver planes y precios
                            </Link>
                            <Link
                                href="/limits"
                                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full font-semibold text-white bg-white/5 border-2 border-white/15 hover:border-white/30 transition-colors"
                            >
                                Comparar límites
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* --- FAQ --- */}
            <section className="relative py-24 px-6">
                <div className="max-w-3xl mx-auto">
                    <SectionHeading
                        eyebrow="Dudas"
                        title="Preguntas frecuentes"
                        subtitle="Lo que la gente suele preguntarnos antes de empezar."
                    />
                    <div className="space-y-3">
                        {LANDING_FAQ.map((faq, i) => (
                            <FaqItem key={i} question={faq.question} answer={faq.answer} />
                        ))}
                    </div>
                </div>
            </section>

            {/* --- PRUEBA SOCIAL: EMPRESAS --- */}
            <LogoGrid />

            {/* --- CTA FINAL --- */}
            <section className="py-32 px-6 text-center relative">
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 to-blue-950/20 pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 max-w-3xl mx-auto"
                >
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                        ¿Listo para crear <br /> tu próximo evento?
                    </h2>
                    <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                        Galas, tierlists, encuestas o concursos de dibujo. Monta tu votación en minutos y deja que tu gente decida.
                    </p>
                    <Link
                        href={loggedIn ? "/dashboard" : "/register"}
                        className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full font-bold text-xl text-white shadow-lg shadow-blue-900/30 hover:scale-105 transition-transform group"
                    >
                        {loggedIn ? <Rocket size={20} /> : <Sparkles size={20} />}
                        {loggedIn ? "Ir a mi panel" : "Crear cuenta gratis"}
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </Link>

                </motion.div>

                <div className="absolute top-80 inset-0 bg-[radial-gradient(farthest-side,rgba(1,145,255,0.15),rgba(37,37,193,0.05))] blur-[200px] pointer-events-none" />
            </section>

        </div>
    );
}

// Encabezado reutilizable de sección (eyebrow + h2 + subtítulo)
function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14 max-w-2xl mx-auto"
        >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border-2 border-white/10 mb-5">
                <Sparkles size={12} className="text-blue-400" />
                <span className="text-[11px] font-bold text-gray-300 tracking-widest uppercase">{eyebrow}</span>
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">{title}</h2>
            {subtitle && <p className="text-gray-400 mt-4 leading-relaxed">{subtitle}</p>}
        </motion.div>
    );
}

// Tarjeta de un modo de evento (icono + copy + mini-mockup en CSS)
function EventModeCard({
    Icon,
    accent,
    glow,
    border,
    title,
    desc,
    badge = false,
    mockup,
}: {
    Icon: typeof Trophy;
    accent: string;
    glow: string;
    border: string;
    title: string;
    desc: string;
    badge?: boolean;
    mockup: React.ReactNode;
}) {
    return (
        <motion.div
            variants={itemFeatureVariants}
            className={clsx(
                "group relative overflow-hidden rounded-3xl border-2 border-white/10 bg-white/[0.02] p-7 transition-colors duration-300 cursor-pointer hover:border-white/20 hover:bg-white/[0.04]",
                border
            )}
        >
            <div className={clsx("pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl opacity-60", glow)} />

            <div className="relative flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl border-2 border-white/10 bg-black/40">
                        <Icon size={24} className={accent} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{title}</h3>
                </div>
                {badge && (
                    <span className="flex items-center gap-1 shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border-2 border-blue-500/15 text-blue-400 bg-blue-500/15">
                        <Sparkles size={12} />
                        Nuevo
                    </span>
                )}
            </div>

            <p className="relative text-sm text-gray-400 leading-relaxed mb-6">{desc}</p>

            {/* Mini-mockup */}
            <div className="relative rounded-2xl border-2 border-white/10 bg-black/40 p-4 h-40 overflow-hidden">
                {mockup}
            </div>
        </motion.div>
    );
}

// ── Mini-mockups en CSS por modo ──────────────────────────────────────────────
function GalaMockup() {
    const bars = [
        { h: "h-16", medal: "🥈", ring: "ring-gray-300/40" },
        { h: "h-24", medal: "🥇", ring: "ring-amber-400/50" },
        { h: "h-12", medal: "🥉", ring: "ring-amber-700/40" },
    ];
    return (
        <div className="flex items-end justify-center gap-3 h-full pt-2">
            {bars.map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className="text-lg">{b.medal}</span>
                    <div className={clsx("w-12 rounded-t-lg bg-gradient-to-t from-amber-500/20 to-amber-400/40 ring-2", b.h, b.ring)} />
                </div>
            ))}
        </div>
    );
}

function TierlistMockup() {
    const rows = [
        { label: "S", color: "bg-red-500/80", n: 3 },
        { label: "A", color: "bg-orange-500/80", n: 4 },
        { label: "B", color: "bg-amber-500/80", n: 2 },
    ];
    return (
        <div className="flex flex-col gap-2 h-full justify-center">
            {rows.map((r) => (
                <div key={r.label} className="flex items-center gap-2">
                    <div className={clsx("flex items-center justify-center w-8 h-8 rounded-md text-black font-black text-sm shrink-0", r.color)}>
                        {r.label}
                    </div>
                    <div className="flex gap-1.5">
                        {Array.from({ length: r.n }).map((_, i) => (
                            <div key={i} className="w-8 h-8 rounded-md bg-white/10 border border-white/10" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function PreguntasMockup() {
    const opts = [
        { t: "Opción A", on: false },
        { t: "Opción B", on: true },
        { t: "Opción C", on: false },
    ];
    return (
        <div className="flex flex-col gap-2.5 h-full justify-center">
            <div className="h-2.5 w-2/3 rounded-full bg-white/15 mb-1" />
            {opts.map((o) => (
                <div
                    key={o.t}
                    className={clsx(
                        "flex items-center gap-2.5 rounded-lg border-2 px-3 py-2",
                        o.on ? "border-violet-500/50 bg-violet-500/10" : "border-white/10 bg-white/[0.03]"
                    )}
                >
                    <span className={clsx("flex items-center justify-center w-4 h-4 rounded-full border-2", o.on ? "border-violet-400" : "border-white/30")}>
                        {o.on && <span className="w-2 h-2 rounded-full bg-violet-400" />}
                    </span>
                    <span className="text-xs text-gray-300">{o.t}</span>
                </div>
            ))}
        </div>
    );
}

function DibujoMockup() {
    return (
        <div className="flex flex-col gap-3 h-full justify-center">
            <div className="flex-1 rounded-xl bg-gradient-to-br from-pink-500/20 via-purple-500/15 to-sky-500/20 border-2 border-white/10 flex items-center justify-center">
                <Palette size={28} className="text-pink-300/70" />
            </div>
            <div className="flex items-center justify-center gap-2">
                <span className="flex items-center gap-1 rounded-lg bg-emerald-500/15 text-emerald-400 px-2.5 py-1 text-xs font-bold">
                    <ThumbsUp size={12} />
                </span>
                <span className="flex items-center gap-1 rounded-lg bg-red-500/15 text-red-400 px-2.5 py-1 text-xs font-bold">
                    <ThumbsDown size={12} />
                </span>
                <span className="flex items-center gap-1 rounded-lg bg-amber-500/15 text-amber-400 px-2.5 py-1 text-xs font-bold">
                    <Star size={12} />
                </span>
            </div>
        </div>
    );
}

// Tarjeta del bento de características
function BentoCard({
    Icon,
    accent,
    title,
    desc,
    span,
}: {
    Icon: typeof Trophy;
    accent: string;
    title: string;
    desc: string;
    span?: string;
}) {
    return (
        <motion.div
            variants={itemFeatureVariants}
            className={clsx(
                "group rounded-3xl border-2 border-white/10 bg-white/[0.02] p-7 hover:border-white/20 hover:bg-white/[0.04] transition-colors duration-300 cursor-pointer",
                span
            )}
        >
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl border-2 border-white/10 bg-black/40 mb-2">
                <Icon size={22} className={accent} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
        </motion.div>
    );
}

// Paso del "Cómo funciona"
function StepCard({ n, Icon, title, desc }: { n: string; Icon: typeof Trophy; title: string; desc: string }) {
    return (
        <motion.div
            variants={itemFeatureVariants}
            className="relative rounded-3xl border-2 border-white/10 bg-white/[0.02] p-7 cursor-pointer hover:border-white/20 hover:bg-white/[0.04] transition-colors duration-300"
        >
            <span className="absolute top-6 right-7 text-5xl font-black text-white/5 select-none">{n}</span>
            <div className="mb-5 flex items-center justify-center w-12 h-12 rounded-2xl border-2 border-blue-500/30 bg-blue-500/10 text-blue-400">
                <Icon size={22} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
        </motion.div>
    );
}

// Item de FAQ (acordeón accesible)
function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-2xl border-2 border-white/10 bg-white/[0.02] overflow-hidden">
            <button
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
                <span className="text-sm md:text-base font-semibold text-white">{question}</span>
                <ChevronDown
                    size={18}
                    className={clsx("shrink-0 text-gray-400 transition-transform duration-300", open && "rotate-180")}
                />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <p className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Subcomponente para la sección de logos
function LogoGrid() {
    const companies = [
        { name: "Rayelus", logo: "/logos/rayelus_logo.webp" }, // Sustituir por tus rutas
        { name: "Chaotic Loom", logo: "/logos/chaotic-loom_logo.webp" },
        { name: "TCG Shop Finder", logo: "/logos/tcg-shop-finder_logo.webp" },
        { name: "Arandor", logo: "/logos/arandor_logo.webp" },
        { name: "Raimusic", logo: "/logos/raimusic_logo.webp" },
        { name: "Tu empresa", logo: "/logos/empresa_logo.webp" },
    ];

    return (
        <section className="py-24 px-6 relative overflow-hidden">
            <div className="max-w-5xl mx-auto rounded-[2rem] border-2 border-white/10 bg-white/[0.02] px-6 py-12 md:px-12">
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-gray-500 text-xs font-medium uppercase tracking-[0.2em] mb-10"
                >
                    Empresas y proyectos que confían en nosotros
                </motion.p>

                <motion.div
                    variants={featureContainerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-6 items-center"
                >
                    {companies.map((company, i) => (
                        <motion.div
                            key={i}
                            variants={itemFeatureVariants}
                            whileHover={{ scale: 1.1, filter: "brightness(1.1)" }}
                            className="flex justify-center items-center py-4 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-transform duration-200 cursor-pointer"
                        >
                            <img
                                src={company.logo}
                                alt={company.name}
                                loading="lazy"
                                decoding="async"
                                className="h-7 md:h-10 w-auto object-contain"
                            />
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-12 pt-10 border-t-2 border-white/10 flex flex-col items-center gap-5 text-center"
                >
                    <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        ¿Te gustaría colaborar con nosotros?
                    </h3>
                    <p className="text-sm text-gray-400 max-w-md">
                        Adaptamos POLLNOW a las necesidades de tu empresa, comunidad o evento.
                    </p>
                    <a
                        href="https://pollnow.es/empresas"
                        className="inline-flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full font-bold text-base text-white shadow-lg shadow-orange-900/30 hover:scale-105 transition-transform group"
                    >
                        Soluciones para Empresas
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                </motion.div>
            </div>

            {/* Adorno visual: línea sutil debajo */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
        </section>
    );
}