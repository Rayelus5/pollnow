"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Scale, Shield, Cookie } from "lucide-react";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.4, ease: "easeOut" },
    },
};

interface LegalLayoutProps {
    title: string;
    date: string;
    children: React.ReactNode;
}

export default function LegalLayout({ title, date, children }: LegalLayoutProps) {
    return (
        <main className="min-h-screen bg-black text-gray-300 selection:bg-blue-500/30 pt-24 pb-20 px-4 md:px-6">
            {/* Glow de fondo */}
            <div className="fixed inset-x-0 top-[-200px] h-[500px] bg-gradient-to-b from-blue-900/30 via-blue-900/5 to-transparent blur-3xl pointer-events-none z-0" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Volver atrás */}
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8"
                >
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors group"
                    >
                        <ArrowLeft
                            size={16}
                            className="group-hover:-translate-x-1 transition-transform"
                        />
                        Volver al inicio
                    </Link>
                </motion.div>

                {/* Tarjeta principal */}
                <motion.section
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="bg-gradient-to-b from-white/10 via-white/[0.03] to-white/[0.02] border border-white/10 rounded-3xl shadow-[0_0_60px_rgba(15,23,42,0.8)] backdrop-blur-2xl px-6 py-8 md:px-10 md:py-10"
                >
                    {/* Cabecera legal */}
                    <motion.header
                        variants={itemVariants}
                        className="mb-8 md:mb-10 border-b border-white/10 pb-6"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-blue-300/80 mb-3">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/40">
                                        <Shield size={14} />
                                    </span>
                                    Documentación legal
                                </p>
                                <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">
                                    {title}
                                </h1>
                            </div>

                            <div className="flex flex-col items-start lg:items-end text-xs text-gray-400 gap-1">
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    <span className="font-medium text-gray-200">
                                        POLLNOW &middot; Legal
                                    </span>
                                </span>
                                <span className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                                    Última actualización: {date}
                                </span>
                            </div>
                        </div>
                    </motion.header>

                    {/* Cuerpo legal */}
                    <motion.div
                        variants={itemVariants}
                        className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-strong:text-white prose-li:text-gray-300 text-gray-300 leading-relaxed"
                    >
                        {children}
                    </motion.div>

                    {/* Navegación entre documentos legales */}
                    <motion.footer
                        variants={itemVariants}
                        className="mt-10 pt-6 border-t border-white/10"
                    >
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-3">
                            Otros documentos de POLLNOW
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/legal/terms"
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-gray-300 hover:border-blue-500/60 hover:text-white transition-colors"
                            >
                                <Scale size={14} />
                                Términos de uso
                            </Link>
                            <Link
                                href="/legal/privacy"
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-gray-300 hover:border-blue-500/60 hover:text-white transition-colors"
                            >
                                <Shield size={14} />
                                Política de privacidad
                            </Link>
                            <Link
                                href="/legal/cookies"
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-gray-300 hover:border-blue-500/60 hover:text-white transition-colors"
                            >
                                <Cookie size={14} />
                                Política de cookies
                            </Link>
                        </div>
                    </motion.footer>
                </motion.section>
            </div>
        </main>
    );
}