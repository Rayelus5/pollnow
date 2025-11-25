"use client";

import { motion } from "framer-motion";
import { X, Clock, Laptop } from "lucide-react";

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: "easeOut" }
    }
};

const stagger = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.15
        }
    }
};



export default function AdminLayoutError() {

    return (
        <main className="flex lg:hidden min-h-screen bg-black text-white flex items-center justify-center px-6 selection:bg-blue-500/30 overflow-hidden">
            {/* Glows animados con Framer Motion */}
            <div className="pointer-events-none fixed inset-0">
                <motion.div
                    initial={{ 
                        opacity: 0.15,
                        x: -500,
                        y: -100,
                        scale: 1,
                        rotate: 0
                    }}
                    animate={{
                        opacity: [0.15, 0.25, 0.15],
                        x: [-500, -400, -450, -400, -500],
                        y: [-100, -90, -40, -20, -100],
                        scale: [1, 1.5, 1],
                        rotate: [0, 8, -6, 3, 0]
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="
                        absolute -top-40 left-1/2 -translate-x-1/2 
                        w-[700px] h-[450px]
                        bg-gradient-to-br from-red-500/90 to-orange-500/20 
                        rounded-[100%] blur-[150px]
                    "
                />

                <motion.div
                    initial={{ 
                        opacity: 0.15,
                        x: 500,
                        y: 1000,
                        scale: 1,
                        rotate: 0
                    }}
                    animate={{
                        opacity: [0.15, 0.25, 0.15],
                        x: [500, 400, 450, 400, 500],
                        y: [1000, 900, 800, 900, 1000],
                        scale: [1, 1.5, 1],
                        rotate: [0, 8, -6, 3, 0]
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="
                        absolute -top-40 left-1/2 -translate-x-1/2 
                        w-[500px] h-[450px]
                        bg-gradient-to-br from-amber-500/30 to-red-500/90 
                        rounded-[100%] blur-[150px]
                    "
                />
            </div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="relative z-10 max-w-xl w-full"
            >
                {/* Badge */}
                <motion.div
                    variants={fadeInUp}
                    className="flex justify-center mb-6"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                        <span className="text-[11px] font-medium text-gray-300 tracking-[0.25em] uppercase">
                            Panel de Administración
                        </span>
                    </div>
                </motion.div>

                {/* Tarjeta principal */}
                <motion.div
                    variants={fadeInUp}
                    className="bg-neutral-900/60 border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl"
                >
                    <div className="flex flex-col items-center text-center gap-5 mb-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500/15 rounded-full flex items-center justify-center text-red-300">
                            <X size={36} />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                                Acceso Denegado
                            </h1>
                            <p className="text-sm md:text-base text-gray-400 max-w-md mx-auto leading-relaxed">
                                El panel de administración solo está disponible para ordenador, la vista para móvil no está disponible por el momento.
                            </p>
                        </div>
                    </div>

                    {/* Bloque informativo */}
                    <div className="mb-8 rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-gray-300 flex flex-col gap-2">
                        <div className="flex items-center justify-center gap-2 text-gray-200 text-sm">
                            <Laptop size={16} className="text-red-300" />
                            <span>Only on Desktop</span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-400">
                            Para acceder al panel de administración, por favor utilice un dispositivo de escritorio.
                        </p>
                    </div>
                </motion.div>

                <motion.p
                    variants={fadeInUp}
                    className="mt-6 text-center text-[11px] text-gray-500"
                >
                    POLLNOW · Mejorando la experiencia para tu próximo evento
                </motion.p>
            </motion.div>
        </main>
    );
}