import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ChatInterface from "@/components/admin/ChatInterface"; // la reutilizamos
import Link from "next/link";

type Props = {
    params: Promise<{ chatId: string }>;
};

export default async function UserSupportChatPage({ params }: Props) {
    const { chatId } = await params;
    const session = await auth();
    if (!session?.user) redirect("/login");

    const chat = await prisma.supportChat.findUnique({
        where: { id: chatId },
        include: {
            user: { select: { id: true, name: true, email: true } },
            messages: {
                orderBy: { createdAt: "asc" },
                include: { sender: { select: { id: true, name: true } } },
            },
        },
    });

    if (!chat || chat.userId !== session.user.id) {
        notFound();
    }

    const initialMessages = chat.messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        senderId: m.senderId,
        sender: {
            id: m.sender.id,
            name: m.sender.name,
        },
    }));

    return (
        <main className="min-h-screen bg-black text-white">
            <header className="border-b border-white/10 bg-neutral-900/30">
                <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div>
                        <div className="text-xs text-gray-400 mb-1">
                            <Link href="/dashboard/support" className="hover:text-white">
                                Mis tickets
                            </Link>{" "}
                            / Chat de soporte
                        </div>
                        <h1 className="text-xl font-bold">Soporte con el equipo</h1>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-6">
                <ChatInterface
                    chatId={chat.id}
                    initialMessages={initialMessages}
                    currentUserId={session.user.id}
                    isClosed={chat.isClosed}
                    otherUserLabel="Equipo de soporte"
                />
            </div>
        </main>
    );
}
