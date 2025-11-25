"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { sendSupportMessage } from "@/app/lib/support-actions";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";

type ChatUser = {
    id: string;
    name: string | null;
};

type ChatMessageType = {
    id: string;
    content: string;
    createdAt: string;
    sender: ChatUser;
    senderId: string;
};

type ChatInterfaceProps = {
    chatId: string;
    initialMessages: ChatMessageType[];
    currentUserId: string;
    isClosed: boolean;
    otherUserLabel?: string;
};

export default function ChatInterface({
    chatId,
    initialMessages,
    currentUserId,
    isClosed,
    otherUserLabel,
}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const router = useRouter();
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const isOwn = (msg: ChatMessageType) => msg.senderId === currentUserId;

    useEffect(() => {
        // Scroll al final cuando llegan mensajes nuevos
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isClosed) return;

        const optimistic: ChatMessageType = {
            id: `optimistic-${Date.now()}`,
            content: input,
            createdAt: new Date().toISOString(),
            senderId: currentUserId,
            sender: { id: currentUserId, name: "Tú" },
        };

        setMessages((prev) => [...prev, optimistic]);
        setInput("");
        setIsSending(true);

        try {
            const res = await sendSupportMessage(chatId, optimistic.content);
            if (res?.message) {
                // Reemplazamos el optimista por el real o simplemente refrescamos
                router.refresh();
            } else if (res?.error) {
                console.error(res.error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[70vh] max-h-[600px] border border-white/10 rounded-xl bg-neutral-950/60">
            {/* Cabecera simple */}
            <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
                <div className="text-sm text-gray-300">
                    Chat de soporte
                    {otherUserLabel && (
                        <span className="ml-1 text-xs text-gray-500">· {otherUserLabel}</span>
                    )}
                </div>
                {isClosed && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                        Cerrado
                    </span>
                )}
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-sm">
                {messages.length === 0 && (
                    <p className="text-gray-500 text-center mt-4">
                        No hay mensajes todavía. Escribe el primero.
                    </p>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${isOwn(msg) ? "justify-end" : "justify-start"
                            }`}
                    >
                        <div
                            className={`max-w-xs md:max-w-md px-3 py-2 rounded-lg text-xs ${isOwn(msg)
                                    ? "bg-blue-600 text-white rounded-br-none"
                                    : "bg-neutral-800 text-gray-100 rounded-bl-none"
                                }`}
                        >
                            {!isOwn(msg) && (
                                <div className="text-[10px] text-gray-400 mb-0.5">
                                    {msg.sender.name ?? "Usuario"}
                                </div>
                            )}
                            <div>{msg.content}</div>
                            <div className="mt-1 text-[9px] text-gray-300/70 text-right">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
                onSubmit={handleSubmit}
                className="px-4 py-3 border-t border-white/10 flex gap-2"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isClosed || isSending}
                    placeholder={isClosed ? "Chat cerrado" : "Escribe tu mensaje..."}
                    className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-60"
                />
                <button
                    type="submit"
                    disabled={isClosed || isSending || !input.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg disabled:opacity-60 cursor-pointer flex items-center justify-center min-w-[90px]"
                >
                    {isSending ? <Bouncy size={16} color="white" /> : "Enviar"}
                </button>
            </form>
        </div>
    );
}
