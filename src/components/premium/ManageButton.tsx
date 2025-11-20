"use client";

import { createCustomerPortalSession } from "@/app/lib/stripe-actions";
import { useState } from "react";
import { Settings } from "lucide-react";

export default function ManageButton() {
    const [loading, setLoading] = useState(false);

    const handlePortal = async () => {
        setLoading(true);
        try {
            const url = await createCustomerPortalSession();
            if (url) window.location.href = url;
        } catch (err) {
            alert("Error al abrir el portal de facturación.");
        }
        setLoading(false);
    };

    return (
        <button 
            onClick={handlePortal}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold border border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-1 text-white cursor-pointer"
        >
            {loading ? (
                "Cargando..."
            ) : (
                <>
                    <Settings size={20} className="mr-2" />
                    <span className="text-lg">Gestionar</span>
                </>
            )}
        </button>
    );
}