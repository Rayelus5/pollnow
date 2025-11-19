import { prisma } from "@/lib/prisma";
import { createParticipant, deleteParticipant } from "../actions";
import ParticipantList from "@/components/dashboard/ParticipantList";

export const dynamic = 'force-dynamic';

export default async function ParticipantsAdmin() {
    const participants = await prisma.participant.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="max-w-5xl mx-auto">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white">Participantes</h1>
                    <p className="text-gray-400 mt-1">La base de datos de tus amigos.</p>
                </div>
                <div className="text-sm text-gray-500 font-mono">{participants.length} Registrados</div>
            </header>

            <div className="grid lg:grid-cols-3 gap-10">
                {/* --- FORMULARIO DE CREACIÓN --- */}
                <div className="lg:col-span-1">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 sticky top-10">
                        <h2 className="text-lg font-bold text-white mb-4">Nuevo Participante</h2>
                        <form action={createParticipant} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Nombre</label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="Ej: Alejandro"
                                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Foto URL</label>
                                <input
                                    name="imageUrl"
                                    type="url"
                                    placeholder="https://..."
                                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                                />
                            </div>
                            <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-indigo-50 transition-colors">
                                Añadir Amigo
                            </button>
                        </form>
                    </div>
                </div>

                {/* --- LISTA DE PARTICIPANTES --- */}
                <div className="lg:col-span-2 space-y-3">
                    <ParticipantList initialData={participants} />
                </div>
            </div>
        </div>
    );
}