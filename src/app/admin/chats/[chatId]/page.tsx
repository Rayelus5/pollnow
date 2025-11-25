// src/app/admin/chats/[chatId]/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import ChatInterface from "@/components/admin/ChatInterface";
import { assignChat, closeChat } from "@/app/lib/support-actions";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

// Server actions wrapper para usar en <form action={...}>
async function assignChatAction(formData: FormData) {
  "use server";
  const chatId = formData.get("chatId");
  if (typeof chatId !== "string") return;
  await assignChat(chatId);
}

async function closeChatAction(formData: FormData) {
  "use server";
  const chatId = formData.get("chatId");
  if (typeof chatId !== "string") return;
  await closeChat(chatId);
}

type PageProps = {
  params: Promise<{ chatId: string }>;
};

export default async function AdminChatDetailPage({ params }: PageProps) {
  // 👇 IMPORTANTE: desestructuramos params con await
  const { chatId } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const isAdminOrMod =
    session.user.role === "ADMIN" || session.user.role === "MODERATOR";

  if (!isAdminOrMod) {
    notFound();
  }

  if (!chatId) {
    notFound();
  }

  const chat = await prisma.supportChat.findUnique({
    where: { id: chatId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!chat) notFound();

  // Buscar nombre del admin asignado (solo tenemos adminId en el schema)
  let assignedAdminName: string | null = null;
  if (chat.adminId) {
    const admin = await prisma.user.findUnique({
      where: { id: chat.adminId },
      select: { name: true },
    });
    assignedAdminName = admin?.name ?? null;
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

  const currentUserId = session.user.id;
  const isAssignedToCurrent =
    chat.adminId !== null && chat.adminId === currentUserId;

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-neutral-900/30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-1">
              <Link href="/admin/chats" className="hover:text-white">
                Chats de soporte
              </Link>{" "}
              / {chat.user.name || chat.user.email}
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Ticket de soporte
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                {chat.user.email}
              </span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {chat.adminId && (
              <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
                Asignado a:{" "}
                {isAssignedToCurrent
                  ? "Tú"
                  : assignedAdminName ?? "Otro administrador"}
              </span>
            )}
            <span
              className={`px-2 py-1 rounded-full border ${
                chat.isClosed
                  ? "bg-red-500/10 text-red-300 border-red-500/40"
                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/40"
              }`}
            >
              {chat.isClosed ? "Ticket cerrado" : "Ticket abierto"}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* Acciones de admin */}
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="text-xs text-gray-400">
            Usuario:{" "}
            <span className="font-semibold text-gray-200">
              {chat.user.name || chat.user.email}
            </span>
          </div>

          <div className="flex gap-2">
            {/* Asignarme el chat */}
            <form action={assignChatAction}>
              <input type="hidden" name="chatId" value={chat.id} />
              <button
                type="submit"
                className="px-3 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer disabled:opacity-60"
                disabled={isAssignedToCurrent}
              >
                {isAssignedToCurrent
                  ? "Ya asignado a ti"
                  : chat.adminId
                  ? "Reasignarme este chat"
                  : "Asignarme este chat"}
              </button>
            </form>

            {/* Cerrar chat */}
            <form action={closeChatAction}>
              <input type="hidden" name="chatId" value={chat.id} />
              <button
                type="submit"
                className="px-3 py-2 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer disabled:opacity-60"
                disabled={chat.isClosed}
              >
                {chat.isClosed ? "Chat cerrado" : "Cerrar chat"}
              </button>
            </form>
          </div>
        </div>

        {/* Interfaz de Chat */}
        <ChatInterface
          chatId={chat.id}
          initialMessages={initialMessages}
          currentUserId={currentUserId}
          isClosed={chat.isClosed}
          otherUserLabel={chat.user.email ?? chat.user.name ?? "Usuario"}
        />
      </div>
    </main>
  );
}
