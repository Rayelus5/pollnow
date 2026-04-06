"use client";

import { motion } from "framer-motion";
import SearchFilters from "@/components/polls/SearchFilters";
import PublicEventCard from "@/components/polls/PublicEventCard";

type EventData = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    createdAt: string;
    tags: string[];
    _count: { participants: number; polls: number };
    user: { name: string; username: string; image: string | null };
    likeCount: number;
    voteScore: number;
    hasLiked: boolean;
    userVote: 1 | -1 | null;
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.15 }
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

export default function ExploreClient({
    events,
    isLoggedIn,
    currentSort,
    currentTag,
}: {
    events: EventData[];
    isLoggedIn: boolean;
    currentSort: string;
    currentTag: string;
}) {
    return (
        <div className="max-w-7xl mx-auto relative z-10">

            {/* HEADER & SEARCH */}
            <motion.div
                variants={headerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center text-center mb-16 space-y-8"
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

                <div className="w-full max-w-2xl">
                    <SearchFilters currentSort={currentSort} currentTag={currentTag} />
                </div>
            </motion.div>

            {/* GRID RESULTADOS */}
            {events.length > 0 ? (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {events.map((event) => (
                        <PublicEventCard
                            key={event.id}
                            event={event}
                            isLoggedIn={isLoggedIn}
                        />
                    ))}
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-24 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm"
                >
                    <div className="text-4xl mb-4 grayscale opacity-50">🪐</div>
                    <h3 className="text-2xl font-bold text-white mb-2">Nada por aquí...</h3>
                    <p className="text-gray-400 mb-6">Parece que no hay eventos con esos criterios.</p>
                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors border-b-2 border-blue-500/30 hover:border-blue-400 pb-1"
                    >
                        Crea el primero tú mismo
                    </button>
                </motion.div>
            )}

        </div>
    );
}
