"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Vote, ArrowRight, Heart, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { DotPulse } from 'ldrs/react';
import { LineSpinner } from 'ldrs/react';
import 'ldrs/react/DotPulse.css';
import 'ldrs/react/LineSpinner.css';

type EventSummary = {
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

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 50, damping: 15 }
    }
};

export default function PublicEventCard({
    event,
    isLoggedIn,
}: {
    event: EventSummary;
    isLoggedIn: boolean;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(false);

    // Like state
    const [liked, setLiked] = useState(event.hasLiked);
    const [likeCount, setLikeCount] = useState(event.likeCount);
    const [likeLoading, setLikeLoading] = useState(false);

    // Vote state
    const [userVote, setUserVote] = useState<1 | -1 | null>(event.userVote);
    const [voteScore, setVoteScore] = useState(event.voteScore);
    const [voteLoading, setVoteLoading] = useState(false);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (loading) { e.preventDefault(); return; }
        setLoading(true);
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoggedIn || likeLoading) return;

        // Optimistic update
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(c => c + (newLiked ? 1 : -1));
        setLikeLoading(true);

        try {
            const res = await fetch(`/api/events/${event.id}/like`, { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                setLiked(data.liked);
                setLikeCount(data.count);
            } else {
                // Revert on error
                setLiked(!newLiked);
                setLikeCount(c => c + (newLiked ? -1 : 1));
            }
        } catch {
            setLiked(!newLiked);
            setLikeCount(c => c + (newLiked ? -1 : 1));
        } finally {
            setLikeLoading(false);
        }
    };

    const handleVote = async (e: React.MouseEvent, value: 1 | -1) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoggedIn || voteLoading) return;

        const prevVote = userVote;
        const prevScore = voteScore;

        // Optimistic update
        let newScore = voteScore;
        let newVote: 1 | -1 | null;
        if (userVote === value) {
            // Toggle off
            newScore -= value;
            newVote = null;
        } else {
            if (userVote !== null) newScore -= userVote;
            newScore += value;
            newVote = value;
        }
        setUserVote(newVote);
        setVoteScore(newScore);
        setVoteLoading(true);

        try {
            const res = await fetch(`/api/events/${event.id}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ value }),
            });
            if (res.ok) {
                const data = await res.json();
                setUserVote(data.userVote);
                setVoteScore(data.score);
            } else {
                setUserVote(prevVote);
                setVoteScore(prevScore);
            }
        } catch {
            setUserVote(prevVote);
            setVoteScore(prevScore);
        } finally {
            setVoteLoading(false);
        }
    };

    const handleTagClick = (e: React.MouseEvent, tag: string) => {
        e.preventDefault();
        e.stopPropagation();
        const params = new URLSearchParams(searchParams);
        params.set("tag", tag);
        params.delete("q");
        router.push(`${pathname}?${params.toString()}`);
    };

    const scoreColor = voteScore > 0 ? "text-emerald-400" : voteScore < 0 ? "text-red-400" : "text-gray-500";

    return (
        <motion.div variants={cardVariants} layout>
            <Link
                href={`/e/${event.slug}`}
                onClick={handleClick}
                className={`group relative flex flex-col h-full bg-neutral-900/40 border-2 border-white/15 rounded-3xl overflow-hidden hover:border-blue-500/40 transition-colors duration-500 ${loading ? "opacity-80 pointer-events-none" : ""}`}
            >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 via-transparent to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-sky-600/10 transition-all duration-500 ease-out" />

                {/* Loading overlay */}
                {loading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-[5px]">
                        <DotPulse size="60" speed="1.3" color="white" />
                    </div>
                )}

                <div className="p-7 flex-1 relative z-10 flex flex-col">

                    {/* Header: Autor y Fecha */}
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden relative border-2 border-white/10 shrink-0">
                            {event.user.image ? (
                                <img
                                    src={event.user.image}
                                    alt={event.user.name?.charAt(0)}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                                    {event.user.name?.[0] || "?"}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium min-w-0">
                            <div className="flex flex-col items-start min-w-0">
                                <span className="text-gray-300 truncate">{event.user.name || "Anónimo"}</span>
                                <span className="text-gray-600 text-[11px] truncate">@{event.user.username || "username"}</span>
                            </div>
                            <span className="w-1 h-1 rounded-full bg-gray-700 shrink-0" />
                            <span className="text-[11px] bg-white/5 px-3 py-1 rounded-full shrink-0">
                                {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: es })
                                    .replace(/alrededor de /i, "")
                                    .replace(/^./, (c) => c.toUpperCase())}
                            </span>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-1 tracking-tight">
                        {event.title}
                    </h3>

                    <p className="text-sm text-gray-400 mb-5 line-clamp-2 flex-1 leading-relaxed">
                        {event.description || "Sin descripción disponible para este evento."}
                    </p>

                    {/* Stats badges */}
                    <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-4">
                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border-2 border-white/5">
                            <Users size={12} className="text-blue-400" />
                            <span>{event._count.participants} Nominados</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border-2 border-white/5">
                            <Vote size={12} className="text-purple-400" />
                            <span>{event._count.polls} Categorías</span>
                        </div>
                    </div>

                    {/* Tags + Like/Vote + Arrow */}
                    <div className="mt-auto space-y-3 pt-4 border-t-2 border-white/10">

                        {/* Tags */}
                        {event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {event.tags.slice(0, 3).map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={(e) => handleTagClick(e, tag)}
                                        className="text-[10px] text-blue-400/70 font-medium bg-blue-500/8 hover:bg-blue-500/20 hover:text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                                    >
                                        #{tag}
                                    </button>
                                ))}
                                {event.tags.length > 3 && (
                                    <span className="text-[10px] text-gray-600 self-center">+{event.tags.length - 3}</span>
                                )}
                            </div>
                        )}

                        {/* Like / Vote / Arrow row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                {/* Like button */}
                                <motion.button
                                    onClick={handleLike}
                                    whileTap={isLoggedIn ? { scale: 0.85 } : {}}
                                    title={isLoggedIn ? (liked ? "Quitar me gusta" : "Me gusta") : "Inicia sesión para dar like"}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all text-[11px] font-semibold ${
                                        liked
                                            ? "bg-rose-500/15 border-rose-500/40 text-rose-400"
                                            : "bg-white/5 border-white/10 text-gray-500 hover:border-rose-500/30 hover:text-rose-400"
                                    } ${!isLoggedIn ? "opacity-50 cursor-default" : "cursor-pointer"}`}
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={liked ? "liked" : "unliked"}
                                            initial={{ scale: 0.7 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                        >
                                            <Heart
                                                size={12}
                                                className={liked ? "fill-rose-400 text-rose-400" : ""}
                                            />
                                        </motion.span>
                                    </AnimatePresence>
                                    <span>{likeCount}</span>
                                </motion.button>

                                {/* Vote score */}
                                <div className="flex items-center gap-0.5">
                                    <motion.button
                                        onClick={(e) => handleVote(e, 1)}
                                        whileTap={isLoggedIn ? { scale: 0.85 } : {}}
                                        title={isLoggedIn ? "Upvote" : "Inicia sesión para votar"}
                                        className={`p-1.5 rounded-full border transition-all ${
                                            userVote === 1
                                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                                                : "bg-white/5 border-white/10 text-gray-500 hover:border-emerald-500/30 hover:text-emerald-400"
                                        } ${!isLoggedIn ? "opacity-50 cursor-default" : "cursor-pointer"}`}
                                    >
                                        <ThumbsUp size={11} className={userVote === 1 ? "fill-emerald-400" : ""} />
                                    </motion.button>

                                    <span className={`text-[11px] font-bold font-mono px-1 min-w-[24px] text-center ${scoreColor}`}>
                                        {voteScore > 0 ? `+${voteScore}` : voteScore}
                                    </span>

                                    <motion.button
                                        onClick={(e) => handleVote(e, -1)}
                                        whileTap={isLoggedIn ? { scale: 0.85 } : {}}
                                        title={isLoggedIn ? "Downvote" : "Inicia sesión para votar"}
                                        className={`p-1.5 rounded-full border transition-all ${
                                            userVote === -1
                                                ? "bg-red-500/15 border-red-500/40 text-red-400"
                                                : "bg-white/5 border-white/10 text-gray-500 hover:border-red-500/30 hover:text-red-400"
                                        } ${!isLoggedIn ? "opacity-50 cursor-default" : "cursor-pointer"}`}
                                    >
                                        <ThumbsDown size={11} className={userVote === -1 ? "fill-red-400" : ""} />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 transform group-hover:scale-110 group-hover:-rotate-45 shrink-0">
                                {loading ? (
                                    <LineSpinner size="40" stroke="3" speed="1.5" color="white" />
                                ) : (
                                    <ArrowRight size={18} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
