import { prisma } from "@/lib/prisma";
import { createPoll, deletePoll } from "../actions";
import { format } from "date-fns";
import PollList from "@/components/dashboard/PollList";

export const dynamic = 'force-dynamic';

export default async function PollsAdmin() {
    // Obtenemos encuestas y participantes para el formulario
    // Importante: Añadir orderBy: { order: 'asc' }
    const polls = await prisma.poll.findMany({
        orderBy: { order: 'asc' },
        include: { 
            _count: { select: { votes: true } },
            options: { select: { participantId: true } } // Necesario para saber quién está nominado
        }
    });

    const participants = await prisma.participant.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-white">Encuestas (Categorías)</h1>
                <p className="text-gray-400 mt-1">Gestión de los premios FOTY.</p>
            </header>

            <div className="grid xl:grid-cols-2 gap-12">

                {/* --- FORMULARIO DE CREACIÓN --- */}
                <section className="bg-neutral-900 border border-white/10 rounded-2xl p-8 h-fit">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Nueva Categoría
                    </h2>

                    <form action={createPoll} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Título</label>
                                <input name="title" type="text" required placeholder="Ej: El más fiestero" className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Descripción</label>
                                <textarea name="description" rows={2} placeholder="Descripción corta del premio..." className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Fecha Fin (Gala)</label>
                                <input name="endAt" type="datetime-local" required className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none dark-calendar" />
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-3">Nominados (Selecciona)</label>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {participants.map(p => (
                            <label key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                                <input type="checkbox" name="participantIds" value={p.id} className="w-4 h-4 accent-blue-500 rounded" />
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden">
                                        {p.imageUrl && <img src={p.imageUrl} className="w-full h-full object-cover"/>}
                                    </div>
                                    <span className="text-sm text-gray-300">{p.name}</span>
                                </div>
                            </label>
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-500 text-black font-bold py-4 rounded-xl hover:bg-blue-400 transition-transform active:scale-95">
                    Crear Encuesta
                    </button>
                    </form>
                </section>

                {/* LISTA DE ENCUESTAS (DRAGGABLE) */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white mb-4">Gestionar Orden ({polls.length})</h2>
                    {/* USAMOS EL NUEVO COMPONENTE */}
                    <PollList initialPolls={polls} allParticipants={participants} />
                </section>
            </div>
        </div>
    );
}