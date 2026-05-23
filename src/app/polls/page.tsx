import { prisma } from "@/lib/prisma";
import ExploreClient from "@/components/polls/ExploreClient";
import { auth } from "@/auth";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";

const EVENTS_PER_PAGE = 6;

type Props = {
    searchParams?: Promise<{
        q?: string;
        sort?: string;
        tag?: string;
        status?: string;
        page?: string;
    }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const params = await searchParams;
    const canonical = "https://pollnow.es/polls";
    if (params?.tag) {
        return {
            title: `Galas con etiqueta "${params.tag}"`,
            description: `Explora eventos y galas digitales de la categoría "${params.tag}" en Pollnow.`,
            alternates: { canonical },
        };
    }
    if (params?.q) {
        return {
            title: `Resultados para "${params.q}"`,
            description: `Resultados de búsqueda para "${params.q}" en el directorio de galas de Pollnow.`,
            alternates: { canonical },
        };
    }
    return {
        title: "Explorar Galas",
        description: "Descubre galas digitales y eventos de votación públicos en Pollnow. Vota por tus favoritos en tiempo real.",
        alternates: { canonical },
    };
}

type PublicEvent = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    tags: string[];
    createdAt: string;
    galaDate: string;
    user: { name: string; username: string; image: string | null };
    mode: "GALA" | "TIERLIST" | "PREGUNTAS" | "DIBUJO";
    _count: { participants: number; polls: number; tiers: number; questions: number };
    likeCount: number;
    voteScore: number;
};

/**
 * Listado público de eventos (sin datos por-usuario), cacheado con unstable_cache.
 * Bajo carga, 100 requests con los mismos filtros comparten 1 sola query a BD por
 * ventana de 60s. Se invalida con revalidateTag("events-public") en mutaciones.
 */
const getPublicEventsData = unstable_cache(
    async (query: string, tag: string, status: string): Promise<PublicEvent[]> => {
        // DIBUJO es siempre privado; nunca debe listarse en la comunidad.
        const where: any = { isPublic: true, mode: { not: "DIBUJO" } };
        const conditions: any[] = [];

        if (query) {
            conditions.push(
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } }
            );
        }
        if (tag) where.tags = { has: tag };
        if (status === "active") where.galaDate = { gte: new Date() };
        else if (status === "ended") where.galaDate = { lt: new Date() };
        if (conditions.length > 0) where.OR = conditions;

        const events = await prisma.event.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true, username: true, image: true } },
                _count: { select: { participants: true, polls: true, likes: true, tiers: true, questions: true } },
            },
        });

        const eventIds = events.map((e) => e.id);
        const scoreGroups = eventIds.length
            ? await prisma.eventVote.groupBy({
                  by: ["eventId"],
                  where: { eventId: { in: eventIds } },
                  _sum: { value: true },
              })
            : [];
        const scoreMap = new Map(scoreGroups.map((g) => [g.eventId, g._sum.value ?? 0]));

        return events.map((e) => ({
            id: e.id,
            slug: e.slug,
            title: e.title,
            description: e.description,
            tags: e.tags,
            createdAt: e.createdAt.toISOString(),
            galaDate: e.galaDate.toISOString(),
            user: e.user,
            mode: e.mode,
            _count: {
                participants: e._count.participants,
                polls: e._count.polls,
                tiers: e._count.tiers,
                questions: e._count.questions,
            },
            likeCount: e._count.likes,
            voteScore: scoreMap.get(e.id) ?? 0,
        }));
    },
    ["public-events"],
    { tags: ["events-public"], revalidate: 60 }
);

export default async function ExplorePage({ searchParams }: Props) {
    const params = await searchParams;
    const query = params?.q || "";
    const sort = params?.sort || "recent";
    const tag = params?.tag || "";
    const status = params?.status || "";
    const page = Math.max(1, parseInt(params?.page || "1", 10));

    const session = await auth();
    const userId = session?.user?.id || null;

    // Listado público cacheado (sin datos por-usuario)
    const baseEvents = await getPublicEventsData(query, tag, status);

    // Orden en memoria (barato; no afecta a la caché)
    const sorted = [...baseEvents];
    if (sort === "popular") sorted.sort((a, b) => b.likeCount - a.likeCount);
    else if (sort === "top") sorted.sort((a, b) => b.voteScore - a.voteScore);
    else if (sort === "worst") sorted.sort((a, b) => a.voteScore - b.voteScore);
    else if (sort === "oldest") sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    // Paginación
    const totalEvents = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalEvents / EVENTS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const pageSlice = sorted.slice((currentPage - 1) * EVENTS_PER_PAGE, currentPage * EVENTS_PER_PAGE);

    // Datos por-usuario (dinámicos) solo para los eventos visibles de la página
    let likedIds = new Set<string>();
    let userVoteMap = new Map<string, number>();
    if (userId && pageSlice.length > 0) {
        const ids = pageSlice.map((e) => e.id);
        const [userLikes, userVotes] = await Promise.all([
            prisma.eventLike.findMany({ where: { userId, eventId: { in: ids } }, select: { eventId: true } }),
            prisma.eventVote.findMany({ where: { userId, eventId: { in: ids } }, select: { eventId: true, value: true } }),
        ]);
        likedIds = new Set(userLikes.map((l) => l.eventId));
        userVoteMap = new Map(userVotes.map((v) => [v.eventId, v.value]));
    }

    const paginatedEvents = pageSlice.map((e) => ({
        ...e,
        hasLiked: likedIds.has(e.id),
        userVote: (userVoteMap.get(e.id) ?? null) as 1 | -1 | null,
    }));

    return (
        <main className="min-h-screen bg-black text-white pt-32 pb-24 px-6 relative selection:bg-blue-500/30">
            {/* Background blobs — isolated so they don't clip child scrolling */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-blue-900/10 rounded-[100%] blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-900/10 rounded-[100%] blur-[120px]" />
            </div>
            <ExploreClient
                events={paginatedEvents}
                isLoggedIn={!!userId}
                currentTag={tag}
                currentSort={sort}
                currentStatus={status}
                currentPage={currentPage}
                totalPages={totalPages}
                totalEvents={totalEvents}
            />
        </main>
    );
}
