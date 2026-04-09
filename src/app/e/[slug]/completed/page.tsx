import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CompletedView from "@/components/CompletedView";
import { getCurrentUserPlan } from "@/lib/user-plan";

type Props = {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ key?: string }>
}

export const dynamic = "force-dynamic";

export default async function EventCompletedPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const { key } = await searchParams;

    // Buscar evento para obtener su fecha
    const event = await prisma.event.findUnique({
        where: { slug },
        select: { galaDate: true, slug: true, isPublic: true, accessKey: true }
    });

    if (!event) notFound();

    // Si no hay fecha configurada, usamos una por defecto lejana
    const galaDate = event.galaDate || new Date('2030-01-01');

    const plan = await getCurrentUserPlan();
    const showAds = plan.slug === "free" || plan.slug === "premium"; // solo UNLIMITED NO ven anuncios

    const lobbyKey = !event.isPublic ? (key || event.accessKey || undefined) : undefined;

    return <CompletedView targetDate={galaDate} eventSlug={event.slug} showAds={showAds} accessKey={lobbyKey} />;
}