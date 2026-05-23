"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { clsx } from "clsx";
import { getPusherClient, userChannel, PUSHER_EVENTS } from "@/lib/pusher";
import CreateEventButton from "@/components/dashboard/CreateEventButton";
import CreateTicketButton from "@/components/dashboard/CreateTicketButton";
import DashboardEventCard from "@/components/dashboard/DashboardEventCard";
import {
    markAllUserNotificationsRead,
    markUserNotificationRead,
} from "@/app/lib/user-notification-actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { BookCheck, Users, Mail } from "lucide-react";
import ProfileForm from "@/components/dashboard/ProfileForm";
import SubscriptionCard from "@/components/dashboard/SubscriptionCard";
import PendingInviteCard from "@/components/dashboard/PendingInviteCard";
import DashboardGuidedTour from "@/components/dashboard/DashboardGuidedTour";

type EventRow = {
    id: string;
    title: string;
    description: string | null;
    isPublic: boolean;
    createdAt: Date;
    status: "DRAFT" | "PENDING" | "APPROVED" | "DENIED";
    mode?: "GALA" | "TIERLIST" | "PREGUNTAS" | "DIBUJO";
    _count: { polls: number; participants: number; tiers?: number; questions?: number; drawings?: number };
};

type DashboardTabsProps = {
    user: {
        id: string;
        name: string | null;
        email: string;
        username: string;
        image: string | null;
        subscriptionStatus: string | null;
        stripePriceId: string | null;
        subscriptionEndDate: Date | null;
        cancelAtPeriodEnd: boolean | null;
        stripeSubscriptionId: string | null;
        createdAt: Date;
        hasPassword: boolean;
        emailNotifications: boolean;
        emailCollaborations: boolean;
    };
    plan: {
        slug: string;
        name: string;
    };
    events: EventRow[];
    /** Eventos en los que el usuario es colaborador (no dueño) */
    sharedEvents: EventRow[];
    /** IDs de eventos propios que tienen al menos 1 colaborador */
    eventsWithCollaborators: string[];
    /** Invitaciones pendientes de responder */
    pendingInvitations: {
        invitationId: string;
        event: EventRow;
        invitedBy: { name: string; username: string; image: string | null };
    }[];
    notifications: {
        id: string;
        message: string;
        link: string | null;
        isRead: boolean;
        createdAt: Date;
        type: "SYSTEM" | "COLLABORATION";
        invitationId: string | null;
    }[];
    supportChats: {
        id: string;
        isClosed: boolean;
        createdAt: Date;
        lastMessageAt: Date;
    }[];
};

type TabId = "events" | "profile" | "notifications" | "support";

/* ========== CONFIG =========== */
const PAGE_SIZE = 6;

export default function DashboardTabs({
    user,
    plan,
    events,
    sharedEvents,
    eventsWithCollaborators,
    pendingInvitations,
    notifications,
    supportChats,
}: DashboardTabsProps) {
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [pendingInviteCount, setPendingInviteCount] = useState(pendingInvitations.length);
    const router = useRouter();

    // Sincronizar badge cuando los datos del servidor se actualizan
    useEffect(() => {
        setPendingInviteCount(pendingInvitations.length);
    }, [pendingInvitations.length]);

    // Suscribirse al canal personal del usuario para notificaciones en tiempo real
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const pusher = getPusherClient();
            const ch = pusher.subscribe(userChannel(user.id));
            ch.bind(PUSHER_EVENTS.INVITATION_SENT, () => {
                setPendingInviteCount((prev) => prev + 1);
                router.refresh();
            });
        } catch {
            // Pusher no disponible
        }
        return () => {
            try { getPusherClient().unsubscribe(userChannel(user.id)); } catch { /* noop */ }
        };
    }, [user.id, router]);

    const tabs: { id: TabId; label: string; badge?: number }[] = [
        {
            id: "events",
            label: "Eventos",
            badge: pendingInviteCount || undefined,
        },
        {
            id: "notifications",
            label: "Notificaciones",
            badge: notifications.filter((n) => !n.isRead && n.type === "SYSTEM").length || undefined,
        },
        { id: "support", label: "Soporte" },
        { id: "profile", label: "Mi Cuenta" },
    ];

    // Hooks para manejar la URL
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const initialTab = (searchParams.get("tab") as TabId) || "events";
    const [activeTab, setActiveTab] = useState<TabId>(initialTab);

    // Pagination state per tab
    const [eventsPage, setEventsPage] = useState(1);
    const [notificationsPage, setNotificationsPage] = useState(1);
    const [supportPage, setSupportPage] = useState(1);

    // Sincronizar URL hacia el estado local (por ejemplo, si el usuario navega hacia atrás)
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && tab !== activeTab) {
            setActiveTab(tab as TabId);
        }
    }, [searchParams]);

    // Resetear la paginación al cambiar de tab
    useEffect(() => {
        setEventsPage(1);
        setNotificationsPage(1);
        setSupportPage(1);
    }, [activeTab]);

    // NUEVA FUNCIÓN: Maneja el clic en la pestaña y actualiza la URL
    const handleTabChange = (tabId: TabId) => {
        setActiveTab(tabId); // Actualiza la UI instantáneamente

        // Construye la nueva URL
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tabId);

        // Actualiza la URL en el navegador sin hacer scroll
        // Puedes cambiar 'replace' por 'push' si quieres que cada tab genere historial de navegación
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div>
            <DashboardGuidedTour />

            {/* Tabs */}
            <div className="tour-dashboard-tabs flex border-b-2 border-white/10 mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        data-tour-tab={tab.id}
                        // Usamos la nueva función en el onClick
                        onClick={() => handleTabChange(tab.id)}
                        className={clsx(
                            "relative px-5 py-3 text-sm font-bold transition-colors whitespace-nowrap cursor-pointer",
                            activeTab === tab.id
                                ? "text-blue-500"
                                : "text-gray-400 hover:text-white"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            {tab.label}
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span className="inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white">
                                    {tab.badge}
                                </span>
                            )}
                        </span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* Contenido */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === "events" && (
                    <EventsTab
                        events={events}
                        sharedEvents={sharedEvents}
                        eventsWithCollaborators={eventsWithCollaborators}
                        pendingInvitations={pendingInvitations}
                        planSlug={plan.slug}
                        user={user}
                        isCreating={isCreatingEvent}
                        onCreatingChange={setIsCreatingEvent}
                        page={eventsPage}
                        setPage={setEventsPage}
                    />
                )}

                {activeTab === "profile" && (
                    <ProfileTab user={user} plan={plan} />
                )}

                {activeTab === "notifications" && (
                    <NotificationsTab
                        initialNotifications={notifications}
                        page={notificationsPage}
                        setPage={setNotificationsPage}
                    />
                )}

                {activeTab === "support" && (
                    <SupportTab
                        supportChats={supportChats}
                        page={supportPage}
                        setPage={setSupportPage}
                    />
                )}
            </div>
        </div>
    );
}

// ========== TAB: EVENTOS ==========

type PendingInvite = DashboardTabsProps["pendingInvitations"][number];

type EventsTabProps = {
    events: DashboardTabsProps["events"];
    sharedEvents: DashboardTabsProps["sharedEvents"];
    eventsWithCollaborators: DashboardTabsProps["eventsWithCollaborators"];
    pendingInvitations: DashboardTabsProps["pendingInvitations"];
    planSlug: string;
    user: DashboardTabsProps["user"];
    isCreating: boolean;
    onCreatingChange: (v: boolean) => void;
    page: number;
    setPage: (n: number) => void;
};

function EventsTab({
    events,
    sharedEvents,
    eventsWithCollaborators,
    pendingInvitations: initialPending,
    planSlug,
    user,
    isCreating,
    onCreatingChange,
    page,
    setPage,
}: EventsTabProps) {
    const router = useRouter();
    const [pending, setPending] = useState<PendingInvite[]>(initialPending);

    const total = events.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const paged = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return events.slice(start, start + PAGE_SIZE);
    }, [events, page]);

    const collaboratorSet = useMemo(() => new Set(eventsWithCollaborators), [eventsWithCollaborators]);

    const handleAccepted = (invitationId: string) => {
        setPending((prev) => prev.filter((i) => i.invitationId !== invitationId));
        // Refrescar datos del servidor para que el evento aparezca en sharedEvents
        router.refresh();
    };

    const handleRejected = (invitationId: string) => {
        setPending((prev) => prev.filter((i) => i.invitationId !== invitationId));
    };

    return (
        <section className="tour-events-section">
            {/* Invitaciones pendientes */}
            {pending.length > 0 && (
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-5 h-5 text-amber-400" />
                        <h3 className="text-lg font-bold text-white">Invitaciones pendientes</h3>
                        <span className="ml-1 inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-black font-bold">
                            {pending.length}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-5">
                        Te han invitado a colaborar en estos eventos. Acepta o rechaza la invitación.
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pending.map((inv) => (
                            <PendingInviteCard
                                key={inv.invitationId}
                                invitationId={inv.invitationId}
                                event={inv.event}
                                invitedBy={inv.invitedBy}
                                onAccepted={() => handleAccepted(inv.invitationId)}
                                onRejected={() => handleRejected(inv.invitationId)}
                            />
                        ))}
                    </div>
                    <div className="border-b-2 border-white/8 mt-10" />
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Mis Eventos</h2>
                    <p className="text-gray-400 text-sm">
                        Gestiona tus galas y entregas de premios.
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {isCreating && (
                        <div className="flex items-center gap-2 text-xs text-blue-300">
                            <span className="inline-block w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                            Creando tu evento...
                        </div>
                    )}
                    <CreateEventButton
                        planSlug={planSlug}
                        user={user}
                        onCreatingChange={onCreatingChange}
                    />
                </div>
            </div>

            <div
                className={clsx(
                    "grid md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity",
                    isCreating && "opacity-60 pointer-events-none"
                )}
            >
                {paged.map((event) => (
                    <DashboardEventCard
                        key={event.id}
                        event={event}
                        hasCollaborators={collaboratorSet.has(event.id)}
                    />
                ))}

                {events.length === 0 && (
                    <div className="col-span-full py-16 border-2 border-dashed border-white/10 rounded-2xl text-center">
                        <p className="text-gray-500 mb-2">No tienes eventos activos.</p>
                        <p className="text-sm text-gray-600">¡Crea el primero para empezar la gala!</p>
                    </div>
                )}
            </div>

            {total > PAGE_SIZE && (
                <Pagination className="mt-8" page={page} setPage={setPage} totalPages={totalPages} />
            )}

            {/* Eventos compartidos (invitaciones aceptadas) */}
            {sharedEvents.length > 0 && (
                <div className="mt-12">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-bold text-white">Eventos en los que colaboras</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                        Eventos de otros usuarios donde has sido invitado como colaborador.
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sharedEvents.map((event) => (
                            <DashboardEventCard key={event.id} event={event} isShared />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

// ========== TAB: PERFIL ==========

function ProfileTab({
    user,
    plan,
}: {
    user: DashboardTabsProps["user"];
    plan: DashboardTabsProps["plan"];
}) {
    const profileUserData = {
        name: user.name,
        username: user.username,
        image: user.image,
        email: user.email,
        hasPassword: user.hasPassword,
        emailNotifications: user.emailNotifications,
        emailCollaborations: user.emailCollaborations,
    };

    const subData = {
        subscriptionStatus: user.subscriptionStatus,
        stripePriceId: user.stripePriceId,
        subscriptionEndDate: user.subscriptionEndDate,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd,
        stripeSubscriptionId: user.stripeSubscriptionId,
    };

    return (
        <section className="max-w-7xl space-y-8">
            {/* TARJETA DE SUSCRIPCIÓN */}
            <SubscriptionCard user={subData} />

            {/* FORMULARIOS DE PERFIL */}
            <ProfileForm user={profileUserData} />
        </section>
    );
}

// ========== TAB: NOTIFICACIONES ==========

function NotificationsTab({
    initialNotifications,
    page,
    setPage,
}: {
    initialNotifications: DashboardTabsProps["notifications"];
    page: number;
    setPage: (n: number) => void;
}) {
    const notifications = initialNotifications;

    if (notifications.length === 0) {
        return (
            <div className="py-10 text-center text-sm text-gray-500 border-2 border-dashed border-white/10 rounded-2xl">
                No tienes notificaciones por ahora.
            </div>
        );
    }

    const total = notifications.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const paged = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return notifications.slice(start, start + PAGE_SIZE);
    }, [notifications, page]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Mis Notificaciones</h2>
                    <p className="text-gray-400 text-sm">Revisa tus notificaciones y actualizaciones.</p>
                </div>
                <div className="flex justify-end">
                    <form action={markAllUserNotificationsRead}>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 cursor-pointer"
                        >
                            <BookCheck size={20} /> Marcar como leído
                        </button>
                    </form>
                </div>
            </div>

            <ul className="space-y-3">
                {paged.map((n) => {
                    const isCollaboration = n.type === "COLLABORATION";

                    return (
                        <li
                            key={n.id}
                            className={clsx(
                                "p-4 rounded-xl border-2 text-sm",
                                isCollaboration
                                    ? n.isRead
                                        ? "border-white/10 bg-neutral-900/60 text-gray-400"
                                        : "border-amber-500/30 bg-amber-500/5 text-gray-200"
                                    : n.isRead
                                        ? "border-white/10 bg-neutral-900/60 text-gray-300"
                                        : "border-blue-500/40 bg-blue-500/5 text-blue-100"
                            )}
                        >
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex-1 min-w-0">
                                    {isCollaboration && (
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Mail className="w-3.5 h-3.5 text-amber-400" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                                Invitación de colaboración
                                            </span>
                                        </div>
                                    )}
                                    <p>{n.message}</p>
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        {formatDistanceToNow(n.createdAt, { addSuffix: true, locale: es })}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    {/* Colaboración pendiente → redirigir a eventos */}
                                    {isCollaboration && !n.isRead && (
                                        <a
                                            href="/dashboard?tab=events"
                                            className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-2 whitespace-nowrap transition-colors"
                                        >
                                            Ver en Mis Eventos
                                        </a>
                                    )}
                                    {isCollaboration && n.isRead && (
                                        <span className="text-[11px] text-gray-600">Ya respondida</span>
                                    )}

                                    {/* Notificaciones de sistema */}
                                    {!isCollaboration && n.link && (
                                        <a href={n.link} className="text-xs text-blue-400 hover:text-blue-200 underline underline-offset-2 whitespace-nowrap">
                                            Ver detalle
                                        </a>
                                    )}
                                    {!isCollaboration && !n.isRead && (
                                        <form action={markUserNotificationRead.bind(null, n.id)}>
                                            <button
                                                type="submit"
                                                className="text-[11px] px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-100 border-2 border-white/20 cursor-pointer whitespace-nowrap"
                                            >
                                                Marcar como leída
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>

            {total > PAGE_SIZE && (
                <Pagination className="mt-6" page={page} setPage={setPage} totalPages={totalPages} />
            )}
        </div>
    );
}

// ========== TAB: SOPORTE ==========

function SupportTab({
    supportChats,
    page,
    setPage,
}: {
    supportChats: DashboardTabsProps["supportChats"];
    page: number;
    setPage: (n: number) => void;
}) {
    if (supportChats.length === 0) {
        return (
            <section className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">Chats de Soporte</h2>
                        <p className="text-gray-400 text-sm">
                            Contacta con nosotros si necesitas ayuda.
                        </p>
                    </div>
                    <div className="flex justify-end">
                        <CreateTicketButton />
                    </div>
                </div>
                <div className="py-10 text-center text-sm text-gray-500 border-2 border-dashed border-white/10 rounded-2xl">
                    No tienes tickets abiertos. Crea uno nuevo si necesitas ayuda.
                </div>
            </section>
        );
    }

    const total = supportChats.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const paged = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return supportChats.slice(start, start + PAGE_SIZE);
    }, [supportChats, page]);

    return (
        <section className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Chats de Soporte</h2>
                    <p className="text-gray-400 text-sm">
                        Contacta con nosotros si necesitas ayuda.
                    </p>
                </div>
                <div className="flex justify-end">
                    <CreateTicketButton />
                </div>
            </div>

            <div className="space-y-2">
                {paged.map((chat) => (
                    <a
                        key={chat.id}
                        href={`/dashboard/support/${chat.id}`}
                        className="block p-4 rounded-xl border-2 border-white/10 bg-neutral-900/60 hover:border-blue-500/40 hover:bg-neutral-900 transition-colors text-sm cursor-pointer"
                    >
                        <div className="flex justify-between items-center">
                            <div className="font-semibold">Ticket #{chat.id.slice(0, 8)}</div>
                            <span
                                className={clsx(
                                    "text-[11px] px-2 py-0.5 rounded-full border-2",
                                    chat.isClosed
                                        ? "border-red-500/40 text-red-300 bg-red-500/10"
                                        : "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                                )}
                            >
                                {chat.isClosed ? "Cerrado" : "Abierto"}
                            </span>
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">
                            Último mensaje{" "}
                            {formatDistanceToNow(chat.lastMessageAt, {
                                addSuffix: true,
                                locale: es,
                            })}
                        </p>
                    </a>
                ))}
            </div>

            {/* PAGINADOR */}
            {total > PAGE_SIZE && (
                <Pagination
                    className="mt-6"
                    page={page}
                    setPage={setPage}
                    totalPages={totalPages}
                />
            )}
        </section>
    );
}

/* =======================
   Reusable Pagination UI
   ======================= */
function Pagination({
    page,
    setPage,
    totalPages,
    className,
}: {
    page: number;
    setPage: (n: number) => void;
    totalPages: number;
    className?: string;
}) {
    const prev = () => setPage(Math.max(1, page - 1));
    const next = () => setPage(Math.min(totalPages, page + 1));

    return (
        <div className={clsx("flex items-center justify-center gap-3", className)}>
            <button
                onClick={prev}
                disabled={page <= 1}
                className={clsx(
                    "px-3 py-1 rounded-md text-sm border-2 transition-colors",
                    page <= 1 ? "text-gray-500 border-white/5 cursor-not-allowed" : "text-white border-white/20 hover:bg-white/5 cursor-pointer"
                )}
            >
                Anterior
            </button>

            <div className="text-sm text-gray-300">
                Page {page} / {totalPages}
            </div>

            <button
                onClick={next}
                disabled={page >= totalPages}
                className={clsx(
                    "px-3 py-1 rounded-md text-sm border-2 transition-colors",
                    page >= totalPages ? "text-gray-500 border-white/5 cursor-not-allowed" : "text-white border-white/20 hover:bg-white/5 cursor-pointer"
                )}
            >
                Siguiente
            </button>
        </div>
    );
}