import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Vote } from "lucide-react";

type EventSummary = {
    slug: string;
    title: string;
    description: string | null;
    createdAt: Date;
    tags: string[];
    _count: {
        participants: number;
        polls: number;
    };
    user: {
        name: string | null;
        image: string | null;
    };
};

export default function PublicEventCard({ event }: { event: EventSummary }) {
    return (
        <Link
            href={`/e/${event.slug}`}
            className="group relative flex flex-col bg-neutral-900/40 border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1"
        >
            {/* Efecto de gradiente en hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-purple-600/10 transition-all duration-500" />

            <div className="p-6 flex-1 relative z-10">
                {/* Header: Autor y Fecha */}
                <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                    <div className="w-5 h-5 rounded-full bg-gray-700 overflow-hidden relative">
                        {event.user.image ? (
                            <img src={event.user.image} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">
                                {event.user.name?.[0] || "?"}
                            </div>
                        )}
                    </div>
                    <span className="text-gray-400">{event.user.name || "Anónimo"}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(event.createdAt, { addSuffix: true, locale: es })}</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">
                    {event.title}
                </h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2 min-h-[2.5em]">
                    {event.description || "Sin descripción disponible."}
                </p>

                {/* Stats */}
                <div className="flex gap-4 mb-6 text-xs text-gray-500 font-mono">
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                        <Users size={12} className="text-blue-400" />
                        <span>{event._count.participants} Nominados</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                        <Vote size={12} className="text-purple-400" />
                        <span>{event._count.polls} Categorías</span>
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                    {event.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-gray-500 border border-white/10 px-2 py-0.5 rounded-full">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        </Link>
    );
}