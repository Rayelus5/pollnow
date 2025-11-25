"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupportChat } from "@/app/lib/support-actions";
import { MessageCircle } from "lucide-react";

export default function CreateTicketButton() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleClick = () => {
        startTransition(async () => {
            const res = await createSupportChat();
            if (res?.chatId) {
                router.push(`/dashboard/support/${res.chatId}`);
            } else {
                // Aquí podrías meter un toast de error
                console.error(res?.error || "Error al crear ticket");
            }
        });
    };

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-70 cursor-pointer"
        >
            <MessageCircle className="w-4 h-4" />
            {isPending ? "Creando..." : "Nuevo chat de soporte"}
        </button>
    );
}
