import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getPlanFromUser } from "@/lib/user-plan";
import DashboardTabs from "@/components/dashboard/DashboardTabs";

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user) redirect("/login");

    const plan = await getPlanFromUser(user);

    const [events, notifications, supportChats, collaborations, pendingInvites] = await Promise.all([
        // Eventos propios
        prisma.event.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { polls: true, participants: true, collaborators: true, tiers: true, questions: true, drawings: true } },
            },
        }),
        // Notificaciones (sistema + colaboración)
        prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                message: true,
                link: true,
                isRead: true,
                createdAt: true,
                type: true,
                invitationId: true,
            },
        }),
        // Chats de soporte
        prisma.supportChat.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        }),
        // Colaboraciones aceptadas (eventos ajenos donde el usuario colabora)
        prisma.eventCollaborator.findMany({
            where: { userId: session.user.id },
            include: {
                event: {
                    include: {
                        _count: { select: { polls: true, participants: true, tiers: true, questions: true, drawings: true } },
                    },
                },
            },
        }),
        // Invitaciones pendientes de responder
        prisma.collaboratorInvitation.findMany({
            where: { invitedUserId: session.user.id, status: "PENDING" },
            include: {
                event: {
                    include: {
                        _count: { select: { polls: true, participants: true, tiers: true, questions: true, drawings: true } },
                    },
                },
                invitedBy: {
                    select: { name: true, username: true, image: true },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    // Eventos ajenos (colaboraciones aceptadas)
    const sharedEvents = collaborations.map((c) => c.event);

    // Invitaciones pendientes formateadas
    const pendingInvitations = pendingInvites.map((inv) => ({
        invitationId: inv.id,
        event: inv.event,
        invitedBy: {
            name: inv.invitedBy.name,
            username: inv.invitedBy.username,
            image: inv.invitedBy.image,
        },
    }));

    // IDs de eventos propios que tienen al menos 1 colaborador
    // (derivado del _count ya traído, sin query extra)
    const eventsWithCollaborators = events
        .filter((e) => e._count.collaborators > 0)
        .map((e) => e.id);

    const dashboardUser = {
        id: user.id,
        name: user.name,
        email: user.email!,
        username: user.username || "",
        image: user.image,
        subscriptionStatus: user.subscriptionStatus,
        stripePriceId: user.stripePriceId,
        subscriptionEndDate: user.subscriptionEndDate,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        stripeSubscriptionId: user.stripeSubscriptionId,
        createdAt: user.createdAt,
        hasPassword: !!user.passwordHash,
        emailNotifications: user.emailNotifications,
        emailCollaborations: user.emailCollaborations,
    };

    return (
        <main className="min-h-screen bg-black text-white px-6 md:px-12 py-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 tour-dashboard-header">
                    <h1 className="text-3xl font-bold tracking-tight">Panel de control</h1>
                    <p className="text-gray-400 text-sm">
                        Gestiona tu perfil, tus eventos y la comunicación con el equipo.
                    </p>
                </header>

                <DashboardTabs
                    user={dashboardUser}
                    plan={plan}
                    events={events}
                    sharedEvents={sharedEvents}
                    eventsWithCollaborators={eventsWithCollaborators}
                    pendingInvitations={pendingInvitations}
                    notifications={notifications}
                    supportChats={supportChats}
                />
            </div>
        </main>
    );
}
