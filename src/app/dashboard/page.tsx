import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CreateEventButton from "@/components/dashboard/CreateEventButton"; // Lo crearemos ahora
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default async function Dashboard() {
    const session = await auth();
    if (!session?.user) return null; // Middleware ya protege, pero por TS

    // Buscar eventos de ESTE usuario
    const events = await prisma.event.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { polls: true, participants: true } } }
    });

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Mis Eventos</h1>
                        <p className="text-gray-400">Gestiona tus galas y entregas de premios.</p>
                    </div>
                    <CreateEventButton />
                </header>

                {/* Grid de Eventos */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <Link
                            key={event.id}
                            href={`/dashboard/event/${event.id}`}
                            className="group block bg-neutral-900/50 border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-neutral-900 transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${event.isPublic ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                    {event.isPublic ? 'Público' : 'Privado'}
                                </div>
                                <span className="text-gray-500 text-xs">
                                    {formatDistanceToNow(event.createdAt, { addSuffix: true, locale: es })}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                {event.title}
                            </h3>
                            <p className="text-sm text-gray-400 mb-6 line-clamp-2">
                                {event.description || "Sin descripción"}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-gray-500 font-mono border-t border-white/5 pt-4">
                                <div className="flex items-center gap-1">
                                    <span className="text-white font-bold">{event._count.polls}</span> Categorías
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-white font-bold">{event._count.participants}</span> Nominados
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Empty State */}
                    {events.length === 0 && (
                        <div className="col-span-full py-20 border border-dashed border-white/10 rounded-2xl text-center">
                            <p className="text-gray-500 mb-4">No tienes eventos activos.</p>
                            <p className="text-sm text-gray-600">¡Crea el primero para empezar la fiesta!</p>
                        </div>
                    )}
                </div>

            </div>
        </main>
    );
}