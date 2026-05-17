import { prisma } from "@/lib/prisma";
import ExploreClient from "@/components/polls/ExploreClient";
import { auth } from "@/auth";

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

export default async function ExplorePage({ searchParams }: Props) {
    const params = await searchParams;
    const query = params?.q || "";
    const sort = params?.sort || "recent";
    const tag = params?.tag || "";
    const status = params?.status || "";
    const page = Math.max(1, parseInt(params?.page || "1", 10));

    const session = await auth();
    const userId = session?.user?.id || null;

    // Build where clause
    const where: any = { isPublic: true };
    const conditions: any[] = [];

    if (query) {
        conditions.push(
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } }
        );
    }

    if (tag) {
        where.tags = { has: tag };
    }

    // Filtro por estado del periodo de votación según la fecha de la gala
    if (status === "active") {
        where.galaDate = { gte: new Date() };
    } else if (status === "ended") {
        where.galaDate = { lt: new Date() };
    }

    if (conditions.length > 0) {
        where.OR = conditions;
    }

    // Fetch events with like/vote counts
    const events = await prisma.event.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { name: true, username: true, image: true } },
            _count: { select: { participants: true, polls: true, likes: true } },
            eventVotes: { select: { value: true, userId: true } },
        },
    });

    // Fetch current user's likes and votes
    let likedIds = new Set<string>();
    let userVoteMap = new Map<string, number>();

    if (userId) {
        const eventIds = events.map((e) => e.id);
        const [userLikes, userVotes] = await Promise.all([
            prisma.eventLike.findMany({
                where: { userId, eventId: { in: eventIds } },
                select: { eventId: true },
            }),
            prisma.eventVote.findMany({
                where: { userId, eventId: { in: eventIds } },
                select: { eventId: true, value: true },
            }),
        ]);
        likedIds = new Set(userLikes.map((l) => l.eventId));
        userVoteMap = new Map(userVotes.map((v) => [v.eventId, v.value]));
    }

    // Build serializable event data
    let eventsWithMeta = events.map((e) => ({
        id: e.id,
        slug: e.slug,
        title: e.title,
        description: e.description,
        tags: e.tags,
        createdAt: e.createdAt.toISOString(),
        galaDate: e.galaDate.toISOString(),
        user: e.user,
        _count: { participants: e._count.participants, polls: e._count.polls },
        likeCount: e._count.likes,
        voteScore: e.eventVotes.reduce((acc, v) => acc + v.value, 0),
        hasLiked: likedIds.has(e.id),
        userVote: (userVoteMap.get(e.id) ?? null) as 1 | -1 | null,
    }));

    // Sort server-side
    if (sort === "popular") {
        eventsWithMeta.sort((a, b) => b.likeCount - a.likeCount);
    } else if (sort === "top") {
        eventsWithMeta.sort((a, b) => b.voteScore - a.voteScore);
    } else if (sort === "worst") {
        eventsWithMeta.sort((a, b) => a.voteScore - b.voteScore);
    } else if (sort === "oldest") {
        eventsWithMeta.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }

    // Pagination
    const totalEvents = eventsWithMeta.length;
    const totalPages = Math.max(1, Math.ceil(totalEvents / EVENTS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginatedEvents = eventsWithMeta.slice(
        (currentPage - 1) * EVENTS_PER_PAGE,
        currentPage * EVENTS_PER_PAGE
    );

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
