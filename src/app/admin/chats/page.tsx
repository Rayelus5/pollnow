import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { User, MessageCircle, MessageCircleMore } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default async function AdminChatsPage() {
    // ... verificar admin ...

    const chats = await prisma.supportChat.findMany({
        orderBy: { lastMessageAt: 'desc' },
        include: {
            user: { select: { name: true, email: true } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
    });

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
                        <MessageCircleMore size={28} className="text-purple-500" /> 
                        Soporte de Usuarios
                    </h1>
                    <p className="text-gray-400 mt-1">Gestiona los chats de soporte para ayudar a los usuarios.</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${chats.length === 0 ? 'border-green-500/20' : 'border-amber-500/20'}`}>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: chats.length === 0 ? 'green' : 'amber' }}></div>
                    <span className={`${chats.length === 0 ? 'text-green-500' : 'text-amber-500'} text-xs font-bold`}>{chats.length} Pendientes</span>
                </div>
            </div>

            <div className="grid gap-4">
                {chats.length === 0 && 
                    <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-2xl bg-white/5 text-center">
                        <div className="text-4xl mb-4 grayscale opacity-50">💬</div>
                        <h3 className="text-xl font-bold text-white mb-2">¡Todo limpio!</h3>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">
                            No hay chats de soporte pendientes. Buen trabajo manteniendo la comunidad segura.
                        </p>
                    </div>
                }
                {chats.map(chat => (
                    <Link
                        key={chat.id}
                        href={`/admin/chats/${chat.id}`}
                        className={`flex items-center gap-6 p-4 rounded-xl border transition-all ${chat.isClosed
                                ? 'bg-neutral-950 border-white/5 opacity-60'
                                : 'bg-neutral-900 border-white/10 hover:border-blue-500/40'
                            }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-400 shrink-0">
                            {chat.user.name?.[0]}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-white font-medium truncate">{chat.user.name}</h4>
                                <span className="text-xs text-gray-500">({chat.user.email})</span>
                            </div>
                            <p className="text-sm text-gray-400 truncate">
                                {chat.messages[0]?.content}
                            </p>
                        </div>

                        <div className="text-right text-xs text-gray-500 shrink-0">
                            <div>{formatDistanceToNow(chat.lastMessageAt, { addSuffix: true, locale: es })}</div>
                            {chat.isClosed && <div className="text-red-400 font-bold mt-1">CERRADO</div>}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}