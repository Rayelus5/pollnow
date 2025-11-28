"use client";

import { useState } from "react";
import { clsx } from "clsx";
import CreateEventButton from "@/components/dashboard/CreateEventButton";
import CreateTicketButton from "@/components/dashboard/CreateTicketButton";
import DashboardEventCard from "@/components/dashboard/DashboardEventCard";
import {
    markAllUserNotificationsRead,
    markUserNotificationRead,
} from "@/app/lib/user-notification-actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { BookCheck } from "lucide-react";

type DashboardTabsProps = {
    user: {
        id: string;
        name: string | null;
        email: string;
        username: string;
        subscriptionStatus: string | null;
        createdAt: Date;
    };
    plan: {
        slug: string;
        name: string;
    };
    events: {
        id: string;
        title: string;
        description: string | null;
        isPublic: boolean;
        createdAt: Date;
        status: "DRAFT" | "PENDING" | "APPROVED" | "DENIED";
        _count: {
            polls: number;
            participants: number;
        };
    }[];
    notifications: {
        id: string;
        message: string;
        link: string | null;
        isRead: boolean;
        createdAt: Date;
    }[];
    supportChats: {
        id: string;
        isClosed: boolean;
        createdAt: Date;
        lastMessageAt: Date;
    }[];
};

type TabId = "events" | "profile" | "notifications" | "support";

export default function DashboardTabs({
    user,
    plan,
    events,
    notifications,
    supportChats,
}: DashboardTabsProps) {
    const [activeTab, setActiveTab] = useState<TabId>("events");
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);

    const tabs: { id: TabId; label: string; badge?: number }[] = [
        { id: "events", label: "Eventos" },
        {
            id: "notifications",
            label: "Notificaciones",
            badge: notifications.filter((n) => !n.isRead).length || undefined,
        },
        { id: "support", label: "Soporte" },
        // { id: "profile", label: "Perfil" },
    ];

    return (
        <div>
            {/* Tabs */}
            <div className="flex border-b border-white/10 mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
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

                <Link href="/dashboard/profile">
                    <button
                        className={clsx(
                            "relative px-5 py-3 text-sm font-bold transition-colors whitespace-nowrap cursor-pointer text-gray-400 hover:text-white"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            Mi Cuenta
                        </span>
                    </button>
                </Link>
            </div>

            {/* Contenido */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === "events" && (
                    <EventsTab
                        events={events}
                        planSlug={plan.slug}
                        user={user}
                        isCreating={isCreatingEvent}
                        onCreatingChange={setIsCreatingEvent}
                    />
                )}

                {/* {activeTab === "profile" && (
                    
                    <ProfileTab user={user} plan={plan} />
                )} */}

                {activeTab === "notifications" && (
                    <NotificationsTab notifications={notifications} />
                )}

                {activeTab === "support" && (
                    <SupportTab supportChats={supportChats} />
                )}
            </div>
        </div>
    );
}

// ========== TAB: EVENTOS ==========

type EventsTabProps = {
    events: DashboardTabsProps["events"];
    planSlug: string;
    user: DashboardTabsProps["user"];
    isCreating: boolean;
    onCreatingChange: (v: boolean) => void;
};

function EventsTab({
    events,
    planSlug,
    user,
    isCreating,
    onCreatingChange,
}: EventsTabProps) {
    return (
        <section>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Mis Eventos</h2>
                    <p className="text-gray-400 text-sm">
                        Gestiona tus galas y entregas de premios.
                    </p>
                </div>

                {/* Botón de crear evento con loader global */}
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
                        // ✨ nuevo prop opcional para controlar loader desde dentro del botón
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
                {events.map((event) => (
                    <DashboardEventCard key={event.id} event={event} />
                ))}

                {events.length === 0 && (
                    <div className="col-span-full py-16 border border-dashed border-white/10 rounded-2xl text-center">
                        <p className="text-gray-500 mb-2">No tienes eventos activos.</p>
                        <p className="text-sm text-gray-600">
                            ¡Crea el primero para empezar la fiesta!
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

// ========== TAB: PERFIL ==========

// function ProfileTab({
//     user,
//     plan,
// }: {
//     user: DashboardTabsProps["user"];
//     plan: DashboardTabsProps["plan"];
// }) {
//     return (
//         <section className="grid md:grid-cols-2 gap-6">
//             <div className="p-6 rounded-2xl border border-white/10 bg-neutral-900/60">
//                 <h2 className="text-lg font-bold mb-4">Información de perfil</h2>
//                 <dl className="space-y-2 text-sm">
//                     <div className="flex justify-between">
//                         <dt className="text-gray-400">Nombre</dt>
//                         <dd className="text-white">{user.name}</dd>
//                     </div>
//                     <div className="flex justify-between">
//                         <dt className="text-gray-400">Usuario</dt>
//                         <dd className="text-white">@{user.username}</dd>
//                     </div>
//                     <div className="flex justify-between">
//                         <dt className="text-gray-400">Email</dt>
//                         <dd className="text-white">{user.email}</dd>
//                     </div>
//                     <div className="flex justify-between">
//                         <dt className="text-gray-400">Cuenta creada</dt>
//                         <dd className="text-white">
//                             {new Intl.DateTimeFormat("es-ES", {
//                                 dateStyle: "medium",
//                             }).format(user.createdAt)}
//                         </dd>
//                     </div>
//                 </dl>
//             </div>

//             <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5">
//                 <h2 className="text-lg font-bold mb-4">Plan actual</h2>
//                 <p className="text-sm text-gray-300 mb-2">
//                     Plan <span className="font-semibold">{plan.name}</span>
//                 </p>
//                 <p className="text-xs text-gray-400">
//                     Estado suscripción:{" "}
//                     <span className="font-semibold">
//                         {user.subscriptionStatus ?? "free"}
//                     </span>
//                 </p>
//                 {/* Aquí luego puedes meter CTA para upgrade, gestión de billing, etc. */}
//             </div>
//         </section>
//     );
// }

// ========== TAB: NOTIFICACIONES ==========

function NotificationsTab({
    notifications,
}: {
    notifications: DashboardTabsProps["notifications"];
}) {
    if (notifications.length === 0) {
        return (
            <div className="py-10 text-center text-sm text-gray-500 border border-dashed border-white/10 rounded-2xl">
                No tienes notificaciones por ahora.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Botón global: marcar todas como leídas */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Mis Notificaciones</h2>
                    <p className="text-gray-400 text-sm">
                        Revisa tus notificaciones y actualizaciones.
                    </p>
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
                {notifications.map((n) => (
                    <li
                        key={n.id}
                        className={clsx(
                            "p-4 rounded-xl border text-sm flex justify-between gap-4",
                            n.isRead
                                ? "border-white/10 bg-neutral-900/60 text-gray-300"
                                : "border-blue-500/40 bg-blue-500/5 text-blue-100"
                        )}
                    >
                        <div>
                            <p>{n.message}</p>
                            <p className="text-[11px] text-gray-400 mt-1">
                                {formatDistanceToNow(n.createdAt, {
                                    addSuffix: true,
                                    locale: es,
                                })}
                            </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            {n.link && (
                                <a
                                    href={n.link}
                                    className="text-xs text-blue-400 hover:text-blue-200 underline underline-offset-2 whitespace-nowrap"
                                >
                                    Ver detalle
                                </a>
                            )}

                            {/* Botón individual: marcar como leída */}
                            {!n.isRead && (
                                <form action={markUserNotificationRead.bind(null, n.id)}>
                                    <button
                                        type="submit"
                                        className="text-[11px] px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-100 border border-white/20 cursor-pointer whitespace-nowrap"
                                    >
                                        Marcar como leída
                                    </button>
                                </form>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}


// ========== TAB: SOPORTE ==========

function SupportTab({
    supportChats,
}: {
    supportChats: DashboardTabsProps["supportChats"];
}) {
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
                

            {supportChats.length === 0 && (
                <div className="py-10 text-center text-sm text-gray-500 border border-dashed border-white/10 rounded-2xl">
                    No tienes tickets abiertos. Crea uno nuevo si necesitas ayuda.
                </div>
            )}

            {supportChats.length > 0 && (
                <div className="space-y-2">
                    {supportChats.map((chat) => (
                        <a
                            key={chat.id}
                            href={`/dashboard/support/${chat.id}`}
                            className="block p-4 rounded-xl border border-white/10 bg-neutral-900/60 hover:border-blue-500/40 hover:bg-neutral-900 transition-colors text-sm cursor-pointer"
                        >
                            <div className="flex justify-between items-center">
                                <div className="font-semibold">
                                    Ticket #{chat.id.slice(0, 8)}
                                </div>
                                <span
                                    className={clsx(
                                        "text-[11px] px-2 py-0.5 rounded-full border",
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
            )}
        </section>
    );
}