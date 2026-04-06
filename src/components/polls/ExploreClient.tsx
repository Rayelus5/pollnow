"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

const headerVariants: Variants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: "easeOut" },
    },
};

export default function ExploreClient({
    events,
    isLoggedIn,
    currentSort,
    currentTag,
    currentPage,
    totalPages,
    totalEvents,
}: {
    events: EventData[];
    isLoggedIn: boolean;
    currentSort: string;
    currentTag: string;
    currentPage: number;
    totalPages: number;
    totalEvents: number;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams);
        if (page === 1) params.delete("page");
        else params.set("page", String(page));
        router.push(`${pathname}?${params.toString()}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

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
            <AnimatePresence mode="wait">
                {events.length > 0 ? (
                    <motion.div
                        key={`grid-p${currentPage}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
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
                        key="empty"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.3 }}
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
            </AnimatePresence>

            {/* PAGINACIÓN */}
            {totalPages > 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mt-14 flex flex-col items-center gap-4"
                >
                    <p className="text-xs text-gray-600 font-mono">
                        Página {currentPage} de {totalPages} · {totalEvents} eventos
                    </p>
                    <div className="flex items-center gap-2">
                        {/* Prev */}
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-white/10 bg-white/5 text-sm font-semibold text-gray-400 hover:border-white/25 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronLeft size={15} />
                            Anterior
                        </button>

                        {/* Page numbers */}
                        <div className="flex items-center gap-1">
                            {getPageNumbers(currentPage, totalPages).map((p, i) =>
                                p === "..." ? (
                                    <span key={`ellipsis-${i}`} className="px-2 text-gray-600 text-sm select-none">
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => goToPage(p as number)}
                                        className={`w-9 h-9 rounded-full text-sm font-bold transition-all cursor-pointer ${
                                            currentPage === p
                                                ? "bg-blue-600 text-white border-2 border-blue-500 shadow-lg shadow-blue-900/30"
                                                : "border-2 border-white/10 bg-white/5 text-gray-400 hover:border-white/25 hover:text-white"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                        </div>

                        {/* Next */}
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-white/10 bg-white/5 text-sm font-semibold text-gray-400 hover:border-white/25 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Siguiente
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | "...")[] = [1];

    if (current > 3) pages.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push("...");

    pages.push(total);
    return pages;
}
