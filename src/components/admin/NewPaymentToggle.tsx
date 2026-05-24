"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import NewPaymentForm from "@/components/admin/NewPaymentForm";

export default function NewPaymentToggle({ initialUserId }: { initialUserId?: string }) {
    const [open, setOpen] = useState(false);

    if (open) return <NewPaymentForm onClose={() => setOpen(false)} initialUserId={initialUserId} />;

    return (
        <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors cursor-pointer"
        >
            <Plus size={15} /> Nuevo envío
        </button>
    );
}
