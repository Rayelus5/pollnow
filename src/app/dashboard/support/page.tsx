import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import CreateTicketButton from "@/components/dashboard/CreateTicketButton"; // Crearemos este botón

export default async function SupportPage() {
    const session = await auth();
    // ... verificación de sesión ...

    const chats = await prisma.supportChat.findMany({
        where: { userId: session.user.id },
        orderBy: { lastMessageAt: 'desc' },
        include: {
            messages: { orderBy: { createdAt: 'desc' }, take: 1 } // Último mensaje
        }
    });

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-white">Soporte Técnico</h1>
                <CreateTicketButton />
            </div>

            <div className="space-y-4">
                {chats.map(chat => (
                    <Link
                        key={chat.id}
                        href={`/dashboard/support/${chat.id}`}
                        className="block bg-neutral-900/50 border border-white/10 p-5 rounded-xl hover:border-blue-500/30 transition-colors group"
                    >
                        <div className="flex justify-between mb-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${chat.isClosed ? 'bg-gray-800 text-gray-400' : 'bg-green-900/20 text-green-400'}`}>
                                {chat.isClosed ? 'Cerrado' : 'Abierto'}
                            </span>
                            <span className="text-xs text-gray-500">
                                {format(chat.lastMessageAt, "d MMM HH:mm", { locale: es })}
                            </span>
                        </div>
                        <h3 className="text-white font-medium mb-1 group-hover:text-blue-400 transition-colors">
                            Ticket #{chat.id.slice(0, 8)}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">
                            {chat.messages[0]?.content || "Sin mensajes"}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}