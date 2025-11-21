"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};

export default function LegalLayout({ title, date, children }: { title: string, date: string, children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-black text-gray-300 selection:bg-blue-500/30 pt-24 pb-20 px-6">

            {/* Fondo Ambiental Sutil */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-900/10 rounded-[100%] blur-[120px] pointer-events-none z-0" />

            <div className="max-w-3xl mx-auto relative z-10">

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                >
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Volver al inicio
                    </Link>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        {title}
                    </motion.h1>

                    <motion.p variants={itemVariants} className="text-sm text-gray-500 mb-12 border-b border-white/10 pb-8">
                        Última actualización: {date}
                    </motion.p>

                    <motion.div variants={itemVariants} className="prose prose-invert prose-headings:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-strong:text-white prose-li:text-gray-300 text-gray-300 leading-relaxed">
                        {children}
                    </motion.div>
                </motion.div>

            </div>
        </main>
    );
}