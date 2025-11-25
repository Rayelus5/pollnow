import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { User, MessageCircle } from "lucide-react";
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
        <div className="max-w-5xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">Soporte a Usuarios</h1>
                <p className="text-gray-400">Gestiona las consultas y problemas de la comunidad.</p>
            </header>

            <div className="grid gap-4">
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