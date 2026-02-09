"use client";

import Link from "next/link";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { Trophy, Lock, Palette, ArrowRight, Sparkles, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
// import LiquidGlass from 'liquid-glass-react'
// import { text } from "stream/consumers";
// import { AwardMockup3D } from "@/components/home/AwardMockup3D";
// import next from "next";
// import { is } from "date-fns/locale";
import { CustomAdBanner } from "../ads/CustomAdBanner";
import { CustomPollnowBanner } from "../ads/CustomPollnowBanner";

// --- DATOS DE ANIMACIÓN DEL TÍTULO ---
const WORDS = [
    {
        text: "Game Awards.",
        // Degradado de Texto
        gradient: "from-cyan-400 via-blue-500 to-indigo-600",
        // Degradado de la Sombra/Glow
        shadow: "from-cyan-500/50 via-blue-500/50 to-indigo-500/50"
    },
    {
        text: "Oscars.",
        gradient: "from-amber-200 via-yellow-400 to-orange-500",
        shadow: "from-amber-300/50 via-yellow-500/50 to-orange-500/50"
    },
    {
        text: "Grammys.",
        gradient: "from-pink-300 via-purple-500 to-indigo-500",
        shadow: "from-pink-500/50 via-purple-500/50 to-indigo-500/50"
    },
    {
        text: "ESLANDs.",
        gradient: "from-emerald-300 via-teal-500 to-cyan-600",
        shadow: "from-emerald-500/50 via-teal-500/50 to-cyan-500/50"
    },
    {
        text: "Tierlists.",
        gradient: "from-teal-300 via-emerald-500 to-green-600",
        shadow: "from-teal-500/50 via-emerald-500/50 to-green-500/50"
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

export default function LandingClient( { session, showAds=true } : { session: any, showAds?: boolean } ) {
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

    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        // en 3 segundos se muestra el anuncio
        const timer = setTimeout(() => {
            setShowPopup(true);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative overflow-hidden bg-neutral-950">

            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">

                {/* Fondo Ambiental Hero */}
                <motion.div
                    animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/20 rounded-[100%] blur-[120px] pointer-events-none -z-10"
                />

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col items-center w-full"
                >
                    {/* Badge */}
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-medium text-gray-300 tracking-wide">Ahora disponible para todos</span>
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
                        POLLNOW es la plataforma definitiva para organizar votaciones épicas entre amigos, comunidades o eventos. Diseño premium, votos anónimos por defecto y con modo "Gala".
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
                            className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all  hover:border-white/20"
                        >
                            Explorar Eventos
                        </Link>
                    </motion.div>

                    
                </motion.div>
            </section>

            {/* --- FEATURES SECTION --- */}
            <section className="py-10 bg-neutral-950 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        variants={featureContainerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid md:grid-cols-3 gap-8"
                    >
                        
                        <FeatureCard
                            icon={<Trophy className="text-yellow-400" size={32} />}
                            title="Modo Gala"
                            desc="Resultados sellados hasta la fecha del evento. Vive la emoción del directo sin spoilers y con confeti."
                        />
                        <FeatureCard
                            icon={<Lock className="text-green-400" size={32} />}
                            title="Voto Anónimo"
                            desc="Tecnología de huella digital para garantizar un voto por persona sin necesidad de registros forzosos."
                        />
                        <FeatureCard
                            icon={<Palette className="text-purple-400" size={32} />}
                            title="Diseño Premium"
                            desc="Una interfaz oscura, limpia y animada con Framer Motion que hará que tu evento parezca una producción de TV."
                        />
                    </motion.div>
                </div>
            </section>

            {/* --- NUEVA SECCIÓN DE LOGOS --- */}
            <LogoGrid />

            {/* --- POPUP DE PUBLICIDAD --- */}
            <AnimatePresence>
                {showPopup && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-10">
                        {/* Backdrop: Fondo oscurecido */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPopup(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />

                        {/* Contenedor del Anuncio */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-5xl z-10"
                        >
                            {/* Botón de Cerrar (X) arriba a la izquierda */}
                            <button
                                onClick={() => setShowPopup(false)}
                                className="absolute -top-12 left-0 text-white/70 hover:text-white transition-colors flex items-center gap-2 group cursor-pointer"
                            >
                                <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-all">
                                    <Plus className="rotate-45" size={24} /> 
                                </div>
                                <span className="text-sm font-medium tracking-wide">Cerrar</span>
                            </button>

                            {/* Banner */}
                            <div className="relative rounded-3xl border border-white/20 bg-black overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] shadow-blue-500/20">
                                {showAds ? (
                                    <CustomAdBanner />
                                ) : (
                                    <CustomPollnowBanner />
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
                        ¿Listo para organizar <br /> tu evento?
                    </h2>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full font-bold text-xl text-white shadow-lg shadow-blue-900/30 hover:scale-105 transition-transform group"
                    >
                        Crear Cuenta Gratis
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    
                </motion.div>

                <div className="absolute top-80 inset-0 bg-[radial-gradient(farthest-side,rgba(150,150,255,0.7),rgba(100,100,200,0.1))] blur-[100px] pointer-events-none" />
            </section>

        </div>
    );
}

// Subcomponente para las tarjetas
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <motion.div
            variants={itemFeatureVariants}
            whileHover={{ y: -10 }}
            className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-colors duration-300 group cursor-pointer"
        >
            <div className="mb-6 p-4 bg-black/50 rounded-2xl w-fit border border-white/5 group-hover:border-white/20 transition-colors">
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{desc}</p>
        </motion.div>
    )
}

// Subcomponente para la sección de logos
function LogoGrid() {
    const companies = [
        { name: "Empresa 1", logo: "/logos/rayelus_logo.webp" }, // Sustituir por tus rutas
        { name: "Empresa 2", logo: "/logos/chaotic-loom_logo.webp" },
        { name: "Empresa 3", logo: "/logos/tcg-shop-finder_logo.webp" },
        { name: "Empresa 4", logo: "/logos/arandor_logo.webp" },
        { name: "Empresa 5", logo: "https://placehold.co/800x200" },
        { name: "Empresa 6", logo: "https://placehold.co/800x200" },
    ];

    return (
        <section className="py-40 px-6 relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-gray-500 text-sm font-medium uppercase tracking-[0.2em] mb-12"
                >
                    Empresas que confían en nosotros
                </motion.p>
                
                <motion.div 
                    variants={featureContainerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8 items-center"
                >
                    {companies.map((company, i) => (
                        <motion.div
                            key={i}
                            variants={itemFeatureVariants}
                            whileHover={{ scale: 1.2, filter: "brightness(1.1)" }}
                            className="flex justify-center items-center py-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-transform duration-200 cursor-pointer"
                        >
                            {/* Aquí puedes usar el componente <Image /> de Next.js */}
                            <img 
                                src={company.logo} 
                                alt={company.name} 
                                className="h-8 md:h-15 w-auto object-contain"
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
            
            {/* Adorno visual: línea sutil debajo */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
        </section>
    );
}