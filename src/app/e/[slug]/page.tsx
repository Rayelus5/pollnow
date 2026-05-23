import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import HomeHero from "@/components/HomeHero";
import TierlistVotingClient from "@/components/TierlistVotingClient";
import TierlistResultsClient from "@/components/TierlistResultsClient";
import PreguntasVotingClient from "@/components/PreguntasVotingClient";
import DrawingVotingClient from "@/components/DrawingVotingClient";
import { computeDrawingPhase } from "@/lib/event-modes";
import { getModeStats } from "@/app/lib/stats-actions";
import { Lock } from "lucide-react";
import { getCurrentUserPlan } from "@/lib/user-plan";
import type { Metadata } from "next";

const BASE = "https://pollnow.es";

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ key?: string }>; // Capturamos query params
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const event = await prisma.event.findUnique({
        where: { slug },
        select: {
            title: true,
            description: true,
            isPublic: true,
            status: true,
            user: { select: { name: true } },
        },
    });

    // Eventos privados o no aprobados → noindex
    if (!event || !event.isPublic || event.status !== "APPROVED") {
        return { robots: { index: false, follow: false } };
    }

    const description =
        event.description?.slice(0, 155) ||
        `Gala digital organizada por ${event.user.name} en Pollnow. Vota por tus favoritos.`;
    const canonical = `${BASE}/e/${slug}`;

    return {
        title: event.title,
        description,
        alternates: { canonical },
        openGraph: { type: "website", url: canonical, title: event.title, description },
        twitter: { card: "summary_large_image", title: event.title, description },
    };
}

export default async function EventLobbyPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const { key } = await searchParams;

    const event = await prisma.event.findUnique({
        where: { slug },
        include: {
            polls: {
                where: { isPublished: true },
                orderBy: { order: 'asc' },
                take: 1,
                select: { id: true }
            }
        }
    });

    const plan = await getCurrentUserPlan();
    const showAds = plan.slug === "free" || plan.slug === "premium"; // solo UNLIMITED NO ven anuncios

    if (!event) notFound();

    // --- LÓGICA DE SEGURIDAD ---
    // Si es privado Y la clave no coincide...
    if (!event.isPublic && event.accessKey !== key) {
        return (
            <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center selection:bg-red-500/30">
                <div className="bg-neutral-900/50 border-2 border-red-500/20 p-10 rounded-3xl backdrop-blur-md max-w-md w-full">
                    <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Evento Privado</h1>
                    <p className="text-gray-400 mb-6">
                        Necesitas un enlace de invitación válido para acceder a esta gala.
                    </p>
                    <div className="text-xs text-gray-600 font-mono">
                        Error: Invalid Access Key
                    </div>
                </div>
            </main>
        );
    }
    // ---------------------------

    // ─── RUTEO POR MODO DE EVENTO (v3.0) ───
    if (event.mode === "TIERLIST") {
        const tiers = await prisma.tierlistTier.findMany({ where: { eventId: event.id }, orderBy: { order: "asc" } });
        const ended = new Date() >= (event.galaDate ?? new Date("2999-01-01"));

        if (ended) {
            // Resultados: tierlist agregada por consenso
            const stats = await getModeStats(event.id, "TIERLIST");
            const tlStats = stats && stats.mode === "TIERLIST" ? stats : null;
            return (
                <TierlistResultsClient
                    event={{ title: event.title, description: event.description }}
                    tiers={tiers}
                    totalVotes={tlStats?.totalVotes ?? 0}
                    participants={tlStats?.participants ?? []}
                />
            );
        }

        const participants = await prisma.participant.findMany({
            where: { eventId: event.id },
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true, imageUrl: true },
        });
        return (
            <TierlistVotingClient
                event={{ id: event.id, title: event.title, description: event.description }}
                tiers={tiers}
                participants={participants}
            />
        );
    }

    if (event.mode === "PREGUNTAS") {
        const closed = new Date() >= (event.galaDate ?? new Date("2999-01-01"));
        if (closed) {
            return (
                <main className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
                    <div className="bg-neutral-900/50 border-2 border-white/10 p-10 rounded-3xl max-w-md">
                        <h1 className="text-2xl font-bold mb-2">Formulario cerrado</h1>
                        <p className="text-gray-400">Este formulario ya no admite respuestas.</p>
                    </div>
                </main>
            );
        }
        const questions = await prisma.question.findMany({
            where: { eventId: event.id },
            orderBy: { order: "asc" },
            include: { options: { orderBy: { order: "asc" } } },
        });
        return (
            <PreguntasVotingClient
                event={{ id: event.id, title: event.title, description: event.description }}
                questions={questions}
            />
        );
    }

    if (event.mode === "DIBUJO") {
        const phase = computeDrawingPhase(event);
        // Persistir la fase si cambió (best-effort; la fuente de verdad es el cálculo por fecha)
        if (event.drawingPhase && phase !== event.drawingPhase) {
            prisma.event.update({ where: { id: event.id }, data: { drawingPhase: phase } }).catch(() => {});
        }
        const cookieStore = await cookies();
        const voterId = cookieStore.get("voter_id")?.value ?? "";
        const [mySub, superCount] = await Promise.all([
            voterId
                ? prisma.drawingSubmission.findUnique({
                      where: { eventId_voterHash: { eventId: event.id, voterHash: voterId } },
                      select: { imageUrl: true },
                  })
                : Promise.resolve(null),
            voterId
                ? prisma.drawingReaction.count({ where: { eventId: event.id, voterHash: voterId, type: "SUPERLIKE" } })
                : Promise.resolve(0),
        ]);
        return (
            <DrawingVotingClient
                event={{
                    id: event.id,
                    title: event.title,
                    description: event.description,
                    drawingPrompt: event.drawingPrompt,
                    drawingTimeLimit: event.drawingTimeLimit,
                }}
                phase={phase}
                alreadySubmitted={!!mySub}
                myImageUrl={mySub?.imageUrl ?? null}
                superlikeUsed={superCount > 0}
            />
        );
    }
    // ─── GALA (formato original) ───

    const galaDate = event.galaDate || new Date('2030-01-01');
    const now = new Date();
    const isGalaTime = now >= galaDate;
    const firstPollId = event.polls[0]?.id;

    // JSON-LD del evento (solo públicos aprobados) para rich results
    const eventJsonLd =
        event.isPublic && event.status === "APPROVED"
            ? {
                  "@context": "https://schema.org",
                  "@type": "Event",
                  name: event.title,
                  description: event.description || undefined,
                  url: `${BASE}/e/${event.slug}`,
                  startDate: galaDate.toISOString(),
                  eventStatus: "https://schema.org/EventScheduled",
                  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
                  location: { "@type": "VirtualLocation", url: `${BASE}/e/${event.slug}` },
                  organizer: { "@type": "Organization", name: "POLLNOW", url: BASE },
              }
            : null;

    return (
        <>
            {eventJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
                />
            )}
            <HomeHero
                firstPollId={firstPollId}
                isGalaTime={isGalaTime}
                galaDate={galaDate}
                title={event.title}
                description={event.description || ""}
                eventId={event.id}
                slug={event.slug}
                showAds={showAds}
            />
        </>
    );
}