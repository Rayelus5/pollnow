import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Bell, Check, Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { markNotificationRead } from "@/app/lib/admin-actions"; // Crearemos esta acción

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'MODERATOR') {
        redirect("/dashboard");
    }

    // Obtener notificaciones para este admin (o generales si implementas un sistema global)
    // En este esquema, las notificaciones son personales (adminUserId)
    const notifications = await prisma.notification.findMany({
        where: { adminUserId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Centro de Notificaciones</h1>
                    <p className="text-gray-400 mt-1">Alertas y actualizaciones del sistema.</p>
                </div>
                <div className="bg-neutral-900 border border-white/10 rounded-lg px-4 py-2 text-xs text-gray-400">
                    {notifications.filter(n => !n.isRead).length} Sin leer
                </div>
            </div>

            <div className="space-y-3">
                {notifications.map((notif) => (
                    <div
                        key={notif.id}
                        className={`p-4 rounded-xl border transition-all flex gap-4 items-start ${notif.isRead ? 'bg-transparent border-white/5 opacity-60' : 'bg-neutral-900 border-blue-500/30 shadow-lg shadow-blue-900/5'
                            }`}
                    >
                        <div className={`p-2 rounded-lg shrink-0 ${notif.isRead ? 'bg-white/5 text-gray-500' : 'bg-blue-500/10 text-blue-400'}`}>
                            <Bell size={20} />
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <p className={`text-sm ${notif.isRead ? 'text-gray-400' : 'text-white font-medium'}`}>
                                    {notif.message}
                                </p>
                                <span className="text-[10px] text-gray-500 whitespace-nowrap ml-4">
                                    {formatDistanceToNow(notif.createdAt, { addSuffix: true, locale: es })}
                                </span>
                            </div>

                            <div className="flex gap-3 mt-3">
                                {notif.link && (
                                    <Link
                                        href={notif.link}
                                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                        Ver detalles →
                                    </Link>
                                )}
                                {!notif.isRead && (
                                    <form action={markNotificationRead.bind(null, notif.id)}>
                                        <button className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
                                            <Check size={12} /> Marcar leída
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {notifications.length === 0 && (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-xl text-gray-500">
                        No tienes notificaciones.
                    </div>
                )}
            </div>
        </div>
    );
}