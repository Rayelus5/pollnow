"use client";

import { motion } from "framer-motion";
import SearchFilters from "@/components/polls/SearchFilters";
import PublicEventCard from "@/components/polls/PublicEventCard";

type EventData = any; // Usamos el tipo inferido del componente Card para simplificar aquí

// Variantes del contenedor principal
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: "easeOut" }
    }
};

export default function ExploreClient({ events }: { events: EventData[] }) {
    return (
        <div className="max-w-7xl mx-auto relative z-10">

            {/* HEADER & SEARCH */}
            <motion.div
                variants={headerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center text-center mb-20 space-y-8"
            >
                <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
                        Explora Eventos
                    </h1>
                    <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
                        Descubre las mejores galas creadas por la comunidad. <br />
                        Vota, participa y crea tu propia tradición.
                    </p>
                </div>

                <div className="w-full max-w-lg">
                    <SearchFilters />
                </div>
            </motion.div>

            {/* GRID RESULTADOS */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {events.map((event) => (
                    <PublicEventCard key={event.id} event={event} />
                ))}
            </motion.div>

            {/* EMPTY STATE ANIMADO */}
            {events.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-24 border border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm"
                >
                    <div className="text-4xl mb-4 grayscale opacity-50">🪐</div>
                    <h3 className="text-2xl font-bold text-white mb-2">Nada por aquí...</h3>
                    <p className="text-gray-400 mb-6">Parece que no hay eventos con esos criterios.</p>
                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors border-b border-blue-500/30 hover:border-blue-400 pb-1"
                    >
                        Crea el primero tú mismo
                    </button>
                </motion.div>
            )}

        </div>
    );
}