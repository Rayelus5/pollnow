import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import GlobalResultsClient from "@/components/GlobalResultsClient";
import { getCurrentUserPlan } from "@/lib/user-plan";

type Props = {
    params: Promise<{ slug: string }>
}

export const dynamic = "force-dynamic";

export default async function EventGalaPage({ params }: Props) {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
        where: { slug },
        include: {
            polls: {
                where: { isPublished: true },
                orderBy: { order: 'asc' },
                select: { id: true, title: true }
            },
            _count: { select: { likes: true } },
            eventVotes: { select: { value: true } },
        }
    });

    if (!event) notFound();

    const galaDate = event.galaDate || new Date('2030-01-01');
    const now = new Date();

    const plan = await getCurrentUserPlan();
    const showAds = plan.slug === "free" || plan.slug === "premium";

    if (now < galaDate) {
        redirect(`/e/${slug}`);
    }

    const likeCount = event._count.likes;
    const voteScore = event.eventVotes.reduce((acc, v) => acc + v.value, 0);
    const upvotes = event.eventVotes.filter(v => v.value === 1).length;
    const downvotes = event.eventVotes.filter(v => v.value === -1).length;

    const lobbyHref = event.isPublic
        ? `/e/${slug}`
        : `/e/${slug}?key=${event.accessKey}`;

    return (
        <GlobalResultsClient
            polls={event.polls}
            eventSlug={slug}
            lobbyHref={lobbyHref}
            showAds={showAds}
            eventStats={{ likeCount, voteScore, upvotes, downvotes }}
        />
    );
}
