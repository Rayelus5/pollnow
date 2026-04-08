"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Github, Globe, Heart, Star, Shield, ExternalLink, UserRound, Instagram } from "lucide-react";
import Image from "next/image";

// ─── Animaciones ──────────────────────────────────────────────────────────────

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const stagger: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
};

const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } },
};

// ─── Datos ────────────────────────────────────────────────────────────────────

// 👉 Sustituye los href="#" por las URLs reales de restonic4
const COLLAB = {
    handle: "restonic4",
    role: "Compañero de grado · DAW · Primera colaboración",
    description:
        "Fue la primera colaboración directa del proyecto en cuanto a publicidad. Compañero y buen amigo de clase en el Grado Superior de Desarrollo de Aplicaciones Web. Le ayudé de forma directa con el diseño y el desarrollo de su web, Chaotic Loom, y a cambio fue el primer escaparate real de POLLNOW.",
    links: [
        { icon: <Github size={15} />, label: "GitHub", href: "https://github.com/restonic4" },
        { icon: <Globe size={15} />, label: "Chaotic Loom", href: "https://chaotic-loom.com" },
    ],
};

const FRIENDS = [
    "Ramón Martín",
    "Marcos Ruíz",
    "Ismael Gallo",
    "Juan González",
    "Jesús García",
    "Antonio Lara",
    "Saúl Moreno",
    "Álvaro Liñán",
    "Salva",
    "Álvaro Poo",
    "Laura González",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreditsPage() {
    return (
        <main className="min-h-screen bg-black text-white selection:bg-amber-500/30 overflow-x-hidden">

            {/* ── 1. HERO ── */}
            <section className="relative pt-32 pb-24 px-6 min-h-[65vh] flex flex-col items-center justify-center text-center overflow-hidden">

                {/* Fondo ambiental amber */}
                <div className="absolute inset-0 pointer-events-none -z-10">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], x: [0, 40, 0] }}
                        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[-5%] left-[15%] w-[700px] h-[500px] bg-amber-500/15 rounded-full blur-[120px]"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2], x: [0, -30, 0] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute top-[20%] right-[10%] w-[500px] h-[400px] bg-orange-600/15 rounded-full blur-[100px]"
                    />
                    <motion.div
                        animate={{ opacity: [0.1, 0.2, 0.1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[200px] bg-yellow-500/10 rounded-full blur-[80px]"
                    />
                </div>

                {/* Partículas flotantes */}
                {[...Array(14)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-amber-400/30"
                        style={{
                            left: `${8 + (i * 6.5) % 84}%`,
                            top: `${12 + (i * 13) % 72}%`,
                        }}
                        animate={{ y: [0, -18, 0], opacity: [0.15, 0.6, 0.15] }}
                        transition={{
                            duration: 3 + (i % 4),
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.35,
                        }}
                    />
                ))}

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={stagger}
                    className="relative z-10 max-w-4xl"
                >
                    <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border-2 border-amber-500/20 mb-8">
                        <Heart size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-xs font-medium text-amber-300/80 tracking-widest uppercase">Con todo el cariño</span>
                        <Heart size={12} className="text-amber-400 fill-amber-400" />
                    </motion.div>

                    <motion.h1 variants={fadeInUp} className="text-6xl md:text-9xl font-extrabold tracking-tighter mb-6">
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-yellow-300 to-orange-600">
                            Gracias.
                        </span>
                    </motion.h1>

                    <motion.p variants={fadeInUp} className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
                        POLLNOW no sería lo que es sin las personas que lo rodean.
                        Este proyecto existe gracias a quienes me han apoyado en todo momento durante su desarrollo.
                    </motion.p>
                </motion.div>

                {/* Línea decorativa inferior */}
                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    whileInView={{ scaleX: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"
                />
            </section>


            {/* ── 2. PRIMERA COLABORACIÓN ── */}
            <section className="py-24 px-6 border-t-2 border-white/5">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={stagger}
                        className="space-y-10"
                    >
                        <motion.div variants={fadeInUp} className="text-center">
                            <span className="text-[11px] uppercase tracking-[0.2em] text-amber-500/60 font-semibold">
                                Primera Colaboración
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold mt-2 text-white">El primero en confiar.</h2>
                        </motion.div>

                        <motion.div
                            variants={fadeInUp}
                            whileHover={{ y: -4 }}
                            className="relative rounded-3xl border-2 border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-neutral-900/80 to-orange-950/20 p-8 md:p-12 overflow-hidden"
                        >
                            {/* Glows interiores */}
                            <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/8 rounded-full blur-[60px] pointer-events-none -ml-12 -mb-12" />
                            {/* Línea superior */}
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

                            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                                {/* Avatar */}
                                <div className="shrink-0">
                                    <div className="relative">
                                        <div className="absolute -inset-1.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full opacity-25 blur-md" />
                                        <div className="relative w-20 h-20 md:w-60 md:h-60 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/40 flex items-center justify-center">

                                            <Image
                                                src="/images/restonic4.webp"
                                                alt="Restonic4"
                                                width={220}
                                                height={220}
                                                className="rounded-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h3 className="text-2xl font-bold text-white">@{COLLAB.handle}</h3>
                                        <span className="text-[10px] uppercase tracking-wider text-amber-400 border-2 border-amber-500/30 bg-amber-500/10 rounded-full px-2 py-0.5">
                                            Colaborador
                                        </span>
                                    </div>
                                    <p className="text-xs text-amber-500/50 font-mono mb-4">{COLLAB.role}</p>
                                    <p className="text-gray-400 leading-relaxed">{COLLAB.description}</p>

                                    <div className="flex flex-wrap gap-3 mt-6">
                                        {COLLAB.links.map((link) => (
                                            <a
                                                key={link.label}
                                                href={link.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-amber-500/20 bg-amber-500/5 text-amber-300/80 hover:border-amber-500/50 hover:text-amber-200 hover:bg-amber-500/10 transition-all text-sm font-medium"
                                            >
                                                {link.icon}
                                                {link.label}
                                                <ExternalLink size={10} className="opacity-50" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>


            {/* ── 3. TESTERS ── */}
            <section className="py-24 px-6 border-t-2 border-white/5 bg-neutral-950/40">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={stagger}
                        className="text-center mb-14"
                    >
                        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border-2 border-orange-500/20 mb-6">
                            <Shield size={12} className="text-orange-400" />
                            <span className="text-xs font-medium text-orange-300/70 tracking-widest uppercase">Los que lo rompieron todo</span>
                        </motion.div>
                        <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Los Testers
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="text-gray-500 max-w-xl mx-auto leading-relaxed">
                            Han votado, hackeado, duplicado sesiones, intentado romper el sistema de mil formas distintas
                            y se lo han pasado genial haciéndolo. Gracias a ellos POLLNOW está más pulido que nunca.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={stagger}
                        className="flex flex-wrap justify-center gap-3"
                    >
                        {FRIENDS.map((name, i) => (
                            <motion.div
                                key={name}
                                variants={fadeInUp}
                                whileHover={{ scale: 1.06, y: -2 }}
                                transition={{ delay: i * 0.05 }}
                                className="px-5 py-2.5 rounded-full bg-white/4 border-2 border-white/8 text-gray-300 text-sm font-medium hover:border-orange-500/30 hover:text-orange-200 hover:bg-orange-500/5 transition-all cursor-default"
                            >
                                {name}
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>


            {/* ── 4. FAMILIA ── */}
            <section className="py-24 px-6 border-t-2 border-white/5">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={stagger}
                    >
                        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border-2 border-yellow-500/20 mb-6">
                            <UserRound size={12} className="text-yellow-400" />
                            <span className="text-xs font-medium text-yellow-300/70 tracking-widest uppercase">Los de siempre</span>
                        </motion.div>

                        <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Mi familia
                        </motion.h2>

                        <motion.p variants={fadeInUp} className="text-gray-400 text-lg leading-relaxed">
                            A mis padres y a toda mi familia, por todo lo que me han dado y siguen dándome a lo largo
                            de la vida. Su apoyo incondicional es el motor principal detrás de cada línea de código
                            de mis proyectos y de todo lo demás. Gracias por creer en mí siempre.
                        </motion.p>
                    </motion.div>
                </div>
            </section>


            {/* ── 5. LAURA — la más importante ── */}
            <section className="py-32 px-6 border-t-2 border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none -z-10">
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.35, 0.15] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-amber-500/15 rounded-full blur-[130px]"
                    />
                </div>

                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={stagger}
                    >
                        <motion.div variants={fadeInUp}>
                            <motion.div
                                animate={{ scale: [1, 1.12, 1] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-amber-500/15 border-2 border-amber-500/30 mb-8"
                            >
                                <Heart size={28} className="text-amber-400 fill-amber-400" />
                            </motion.div>
                        </motion.div>

                        <motion.p variants={fadeInUp} className="text-[11px] uppercase tracking-[0.25em] text-amber-500/60 font-semibold mb-4">
                            Y como agradecimiento especial, le dedico esto a
                        </motion.p>

                        <motion.h2
                            variants={fadeInUp}
                            className="text-5xl md:text-8xl font-extrabold tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-yellow-300 to-orange-400"
                        >
                            Laura.
                        </motion.h2>

                        <motion.p variants={fadeInUp} className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
                            Por estar siempre a mi lado. Por aguantarme y por apoyarme en absolutamente todo lo que hago sin pedir nada
                            a cambio.
                        </motion.p>

                        <motion.div variants={fadeIn} className="mt-12 flex items-center justify-center gap-4">
                            <div className="h-px w-24 bg-gradient-to-r from-transparent to-amber-500/40" />
                            <Star size={12} className="text-amber-500/60 fill-amber-500/40" />
                            <div className="h-px w-24 bg-gradient-to-l from-transparent to-amber-500/40" />
                        </motion.div>
                    </motion.div>
                </div>
            </section>


            {/* ── 6. CIERRE ── */}
            <section className="py-16 px-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="max-w-xl mx-auto text-center"
                >
                    <p className="text-zinc-300 text-sm leading-relaxed pb-2 border-b border-amber-400/20">
                        Hecho con cariño e ilusión por {" "}
                        <Link href="/about" className="text-amber-600/60 hover:text-amber-500/80 transition-colors">
                            Raimundo Palma Méndez
                        </Link>
                    </p>

                    <p className="text-zinc-400 text-xs leading-relaxed pt-2">
                        Puedes encontrar más proyectos míos en <Link href="https://github.com/Rayelus5" className="text-amber-600/60 hover:text-amber-500/80 transition-colors">
                            GitHub
                        </Link>. La monetización de este proyecto es principalmente para apoyarme y cubrir los gastos de los servidores y el dominio.
                    </p>
                </motion.div>
            </section>

        </main>
    );
}
