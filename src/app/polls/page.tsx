import { prisma } from "@/lib/prisma";
import SearchFilters from "@/components/polls/SearchFilters";
import PublicEventCard from "@/components/polls/PublicEventCard";

type Props = {
    searchParams?: Promise<{
        q?: string;
        tag?: string;
    }>;
};

export const dynamic = "force-dynamic";

export default async function ExplorePage({ searchParams }: Props) {
    const params = await searchParams;
    const query = params?.q || "";

    // Consulta a la DB
    const events = await prisma.event.findMany({
        where: {
            isPublic: true, // Solo públicos
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                // Búsqueda básica en tags (si escribes el tag exacto)
                { tags: { has: query } }
            ]
        },
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { name: true, image: true } },
            _count: { select: { participants: true, polls: true } }
        }
    });

    return (
        <main className="min-h-screen bg-black text-white pt-12 pb-24 px-6">
            <div className="max-w-7xl mx-auto">

                {/* Hero Search */}
                <div className="flex flex-col items-center text-center mb-16 space-y-6">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
                        Explora Eventos
                    </h1>
                    <p className="text-gray-400 max-w-xl">
                        Descubre votaciones públicas creadas por la comunidad. <br />
                        Desde premios de amigos hasta rankings globales.
                    </p>

                    <SearchFilters />
                </div>

                {/* Grid Resultados */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <PublicEventCard key={event.id} event={event} />
                    ))}
                </div>

                {/* Empty State */}
                {events.length === 0 && (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                        <p className="text-2xl mb-2">🤷‍♂️</p>
                        <h3 className="text-xl font-bold text-white mb-2">No se encontraron eventos</h3>
                        <p className="text-gray-500">Prueba con otro término o crea tú el primero.</p>
                    </div>
                )}

            </div>
        </main>
    );
}