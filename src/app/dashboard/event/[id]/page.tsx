import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import { getPlanFromUser } from "@/lib/user-plan";
import { getEventStats } from "@/app/lib/stats-actions";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import EventTabs from "@/components/dashboard/EventTabs";
import EventSettings from "@/components/dashboard/EventSettings";
import ParticipantList from "@/components/dashboard/ParticipantList";
import PollList from "@/components/dashboard/PollList";
import EventStatistics from "@/components/dashboard/EventStatistics";
import TeamTab from "@/components/dashboard/TeamTab";
import { Folders, UsersRound } from "lucide-react";
import clsx from "clsx";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function EventDashboardPage({ params }: Props) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) redirect("/login");

    const isAdmin =
        session.user.role === "ADMIN" || session.user.role === "MODERATOR";

    // 1. Buscar evento (incluye todos los campos escalares para permisos)
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            participants: { orderBy: { createdAt: "desc" } },
            polls: {
                orderBy: { order: "asc" },
                include: {
                    _count: { select: { votes: true } },
                    options: { select: { participantId: true } },
                },
            },
        },
    });

    if (!event) notFound();

    const isOwner = event.userId === session.user.id;

    // Verificar si es colaborador (con todos los campos de permisos)
    const collaborator = !isOwner
        ? await prisma.eventCollaborator.findUnique({
              where: { eventId_userId: { eventId: id, userId: session.user.id } },
          })
        : null;

    // Acceso: dueño, admin del sistema, o colaborador
    if (!isOwner && !isAdmin && !collaborator) {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border-2 border-white/10 flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-7 h-7 text-gray-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Sin acceso a este evento</h1>
                    <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                        No tienes permiso para ver este evento. Es posible que hayas sido eliminado como colaborador o que el enlace no sea válido.
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/8 hover:bg-white/12 border-2 border-white/10 text-sm font-semibold text-white transition-all"
                    >
                        Volver al dashboard
                    </Link>
                </div>
            </main>
        );
    }

    // 2. Obtener usuario y plan
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });
    const plan = user ? await getPlanFromUser(user) : { slug: "free", name: "Free", limits: PLANS.FREE.limits };

    const collaboratorLimit = plan.limits.collaboratorsPerEvent;

    // 3. Calcular permisos efectivos para colaboradores
    const permissions = {
        canEditSettings: true,
        canDeleteEvent: true,
        canRegenerateKey: true,
        canManageNominees: true,
        canManagePolls: true,
        canViewStats: true,
    };

    if (!isOwner && !isAdmin && collaborator) {
        permissions.canEditSettings = collaborator.canEditSettings ?? event.defaultCanEditSettings;
        permissions.canDeleteEvent = collaborator.canDeleteEvent ?? event.defaultCanDeleteEvent;
        permissions.canRegenerateKey = collaborator.canRegenerateKey ?? event.defaultCanRegenerateKey;
        permissions.canManageNominees = collaborator.canManageNominees ?? event.defaultCanManageNominees;
        permissions.canManagePolls = collaborator.canManagePolls ?? event.defaultCanManagePolls;
        permissions.canViewStats = collaborator.canViewStats ?? event.defaultCanViewStats;
    }

    // 4. Obtener estadísticas del evento
    const stats = await getEventStats(event.id);

    return (
        <main className="min-h-screen bg-black text-white">
            <header className="border-b-2 border-white/10 bg-neutral-900/30">
                <div className="max-w-7xl mx-auto px-6 py-8 tour-event-header">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Link
                            href="/dashboard"
                            className="hover:text-white transition-colors"
                        >
                            Dashboard
                        </Link>
                        <span>/</span>
                        <span className="truncate max-w-50">{event.title}</span>
                        {/* Badge de Plan */}
                        <span
                            className={clsx(
                                "ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                plan.slug === "enterprise"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : plan.slug === "unlimited"
                                        ? "bg-purple-500/10 text-purple-400"
                                        : plan.slug === "plus"
                                            ? "bg-blue-500/10 text-blue-400"
                                            : plan.slug === "premium"
                                                ? "bg-indigo-500/10 text-indigo-400"
                                                : "bg-white/10 text-gray-400"
                            )}
                        >
                            {plan.slug === "enterprise" ? "⭐ " : ""}Plan {plan.name}
                        </span>
                        {/* Badge colaborador */}
                        {!isOwner && collaborator && (
                            <span className="ml-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-500/10 text-green-400">
                                Colaborador
                            </span>
                        )}
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight truncate">
                        {event.title}
                    </h1>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <EventTabs
                    eventId={event.id}
                    currentUserId={session.user.id}
                    settings={
                        <EventSettings
                            event={event}
                            planSlug={plan.slug}
                            permissions={permissions}
                        />
                    }
                    participants={
                        <div className="max-w-7xl tour-participants-section">
                            <div className="mb-6 flex gap-2 items-center">
                                <UsersRound className="w-6 h-6 text-gray-400" />
                                <h2 className="text-xl font-bold">Participantes del Evento</h2>
                            </div>
                            <ParticipantList
                                initialData={event.participants}
                                eventId={event.id}
                                planSlug={plan.slug}
                                canManageNominees={permissions.canManageNominees}
                            />
                        </div>
                    }
                    polls={
                        <div className="max-w-7xl tour-polls-section">
                            <div className="mb-6 flex gap-2 items-center">
                                <Folders className="w-6 h-6 text-gray-400" />
                                <h2 className="text-xl font-bold">Categorías del Evento</h2>
                            </div>
                            <PollList
                                initialPolls={event.polls}
                                allParticipants={event.participants}
                                eventId={event.id}
                                planSlug={plan.slug}
                                canManagePolls={permissions.canManagePolls}
                            />
                        </div>
                    }
                    stats={
                        <EventStatistics
                            stats={stats}
                            planSlug={plan.slug}
                            isAdmin={isAdmin}
                            canViewStats={permissions.canViewStats}
                        />
                    }
                    team={
                        <TeamTab
                            eventId={event.id}
                            eventTitle={event.title}
                            planSlug={plan.slug}
                            collaboratorLimit={collaboratorLimit}
                            isOwner={isOwner}
                            currentUserId={session.user.id}
                        />
                    }
                />
            </div>
        </main>
    );
}
