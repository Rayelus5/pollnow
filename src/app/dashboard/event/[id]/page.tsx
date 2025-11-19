import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import EventTabs from "@/components/dashboard/EventTabs";
import EventSettings from "@/components/dashboard/EventSettings";

// --- CAMBIO DE IMPORTS AQUÍ ---
import ParticipantList from "@/components/dashboard/ParticipantList";
import PollList from "@/components/dashboard/PollList";
// ------------------------------

type Props = {
    params: Promise<{ id: string }>
}

export default async function EventDashboardPage({ params }: Props) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) redirect("/login");

    // 1. Buscar el evento y verificar propiedad
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            participants: { orderBy: { createdAt: 'desc' } },
            polls: {
                orderBy: { order: 'asc' },
                include: {
                    _count: { select: { votes: true } },
                    options: { select: { participantId: true } }
                }
            }
        }
    });

    // Seguridad: Si no existe o no es tuyo -> 404
    if (!event || event.userId !== session.user.id) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-black text-white">

            {/* Header del Evento */}
            <header className="border-b border-white/10 bg-neutral-900/30">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Link href="/dashboard" className="hover:text-white transition-colors">Mis Eventos</Link>
                        <span>/</span>
                        <span>{event.title}</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">{event.title}</h1>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <EventTabs
                    // TAB 1: Configuración
                    settings={<EventSettings event={event} />}

                    // TAB 2: Participantes
                    participants={
                        <div className="max-w-4xl">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold">Roster del Evento</h2>
                                <p className="text-sm text-gray-400">Gestiona los amigos nominables para este evento.</p>
                            </div>
                            {/* Pasamos el eventId obligatorio */}
                            <ParticipantList initialData={event.participants} eventId={event.id} />
                        </div>
                    }

                    // TAB 3: Encuestas
                    polls={
                        <div className="max-w-5xl">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold">Categorías de Votación</h2>
                                <p className="text-sm text-gray-400">Crea, edita y reordena los premios.</p>
                            </div>
                            {/* Pasamos el eventId obligatorio */}
                            <PollList initialPolls={event.polls} allParticipants={event.participants} eventId={event.id} />
                        </div>
                    }
                />
            </div>
        </main>
    );
}