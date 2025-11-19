"use client";

import { createCheckoutSession } from "@/app/lib/stripe-actions";
import { useState } from "react";

export default function CheckoutButton({ priceId, highlight }: { priceId: string, highlight: boolean }) {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            // Llamamos a la Server Action
            const url = await createCheckoutSession(priceId);
            if (url) window.location.href = url;
        } catch (err) {
            alert("Error al iniciar el pago. Asegúrate de estar logueado.");
        }
        setLoading(false);
    };

    return (
        <button 
            onClick={handleCheckout}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 ${
                highlight 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' 
                : 'bg-white text-black hover:bg-gray-200'
            }`}
        >
            {loading ? "Cargando..." : "Suscribirse"}
        </button>
    );
}