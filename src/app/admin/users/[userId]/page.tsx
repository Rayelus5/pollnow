import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, Calendar, Mail, CreditCard, Shield } from "lucide-react";
import UserActions from "@/components/admin/UserActions";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            events: { orderBy: { createdAt: 'desc' } },
            _count: { select: { events: true, votes: true, reports: true } }
        }
    });

    if (!user) notFound();

    return (
        <div className="max-w-5xl mx-auto pb-20">
            
            <Link href="/admin/users" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
                <ArrowLeft size={16} /> Volver a usuarios
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* COLUMNA IZQUIERDA: PERFIL */}
                <div className="lg:col-span-2 space-y-6">
                    
                    <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 flex items-start gap-6">
                        <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center text-2xl font-bold text-gray-500 overflow-hidden border-2 border-white/5">
                            {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover"/> : user.name?.[0]}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-white mb-1">{user.name}</h1>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-3">
                                <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                                <span className="flex items-center gap-1"><Calendar size={14} /> Unido el {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: es })}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold border uppercase ${user.role === 'ADMIN' ? 'bg-purple-900/30 text-purple-400 border-purple-500/20' : 'bg-blue-900/30 text-blue-400 border-blue-500/20'}`}>
                                    {user.role}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold border uppercase ${user.subscriptionStatus === 'active' ? 'bg-green-900/30 text-green-400 border-green-500/20' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                                    Plan {user.subscriptionStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Eventos */}
                    <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 font-bold text-sm text-gray-400 uppercase tracking-wider">
                            Eventos Creados ({user._count.events})
                        </div>
                        <div className="divide-y divide-white/5">
                            {user.events.map(event => (
                                <Link key={event.id} href={`/admin/events/${event.id}`} className="block px-6 py-4 hover:bg-white/5 transition-colors group">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-white font-medium group-hover:text-blue-400 transition-colors">{event.title}</p>
                                            <p className="text-xs text-gray-500">{format(new Date(event.createdAt), 'dd/MM/yyyy')}</p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${event.status === 'APPROVED' ? 'text-green-500 bg-green-900/20' : 'text-yellow-500 bg-yellow-900/20'}`}>
                                            {event.status}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                            {user.events.length === 0 && <p className="px-6 py-8 text-center text-gray-500 text-sm">Sin eventos.</p>}
                        </div>
                    </div>

                </div>

                {/* COLUMNA DERECHA: ACCIONES */}
                <div>
                    <UserActions user={user} />
                </div>

            </div>
        </div>
    );
}