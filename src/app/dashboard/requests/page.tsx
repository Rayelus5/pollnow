import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, AlertCircle, ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const events = await prisma.event.findMany({
        where: {
            userId: session.user.id,
            status: { in: ['PENDING', 'DENIED', 'APPROVED'] }
        },
        orderBy: { updatedAt: 'desc' }
    });

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Mis Solicitudes</h1>
                        <p className="text-gray-400">Estado de revisión de tus eventos públicos.</p>
                    </div>
                    <Link href="/dashboard" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors">
                        Volver al Dashboard <ArrowRight size={14} />
                    </Link>
                </header>

                <div className="space-y-4">
                    {events.map(event => (
                        <div key={event.id} className="bg-neutral-900/50 border border-white/10 rounded-xl p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:border-white/20 transition-colors">

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-white">{event.title}</h3>
                                    <StatusBadge status={event.status} />
                                </div>
                                <p className="text-sm text-gray-400 mb-3">
                                    Actualizado hace {formatDistanceToNow(new Date(event.updatedAt), { locale: es })}
                                </p>

                                {event.status === 'DENIED' && event.reviewReason && (
                                    <div className="mt-4 p-4 bg-red-950/30 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase mb-2">
                                            <AlertCircle size={14} /> Motivo del rechazo
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed">{event.reviewReason}</p>
                                    </div>
                                )}
                            </div>

                            <div className="shrink-0 flex flex-col gap-2">
                                {event.status === 'DENIED' ? (
                                    <Link
                                        href={`/dashboard/event/${event.id}`}
                                        className="px-4 py-2 bg-white text-black font-bold rounded-lg text-sm hover:bg-gray-200 transition-colors text-center shadow-lg shadow-white/5"
                                    >
                                        Corregir y Reenviar
                                    </Link>
                                ) : (
                                    <Link
                                        href={`/dashboard/event/${event.id}`}
                                        className="px-4 py-2 bg-white/5 text-white font-medium rounded-lg text-sm hover:bg-white/10 transition-colors border border-white/10 text-center"
                                    >
                                        Ver Detalles
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}

                    {events.length === 0 && (
                        <div className="text-center py-32 border border-dashed border-white/10 rounded-2xl bg-white/5 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4 text-gray-600">
                                <FileText size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Sin solicitudes</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                Aún no has enviado ninguna solicitud de publicación.
                                Crea un evento y solicítalo desde su configuración.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'PENDING') return (
        <span className="flex items-center gap-1.5 text-yellow-500 text-[10px] font-bold uppercase bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">
            <Clock size={12} /> En Revisión
        </span>
    );
    if (status === 'APPROVED') return (
        <span className="flex items-center gap-1.5 text-green-500 text-[10px] font-bold uppercase bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
            <CheckCircle2 size={12} /> Publicado
        </span>
    );
    if (status === 'DENIED') return (
        <span className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
            <AlertCircle size={12} /> Rechazado
        </span>
    );
    return null;
}