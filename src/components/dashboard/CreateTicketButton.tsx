"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupportChat } from "@/app/lib/support-actions";
import { MessageCirclePlus } from "lucide-react";

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
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 cursor-pointer disabled:opacity-40"
        >
            <MessageCirclePlus size={20} />
            {isPending ? "Creando..." : "Contactar con Soporte"}
        </button>
    );
}
