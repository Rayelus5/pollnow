"use client";

import { createCheckoutSession } from "@/app/lib/stripe-actions";
import { useState } from "react";
import { AlertCircle } from "lucide-react";

export default function CheckoutButton({ priceId, highlight }: { priceId: string, highlight: boolean }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckout = async () => {
        setLoading(true);
        setError(null);
        const result = await createCheckoutSession(priceId);
        if (result && typeof result === "string") {
            window.location.href = result;
        } else if (result && typeof result === "object" && "error" in result) {
            setError(result.error);
            setLoading(false);
        } else {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-2">
            <button
                onClick={handleCheckout}
                disabled={loading}
                className={`w-full py-3 px-12 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 ${highlight
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-blue-900/20'
                    : 'bg-white text-black hover:bg-gray-200'
                    }`}
            >
                {loading ? "Cargando..." : "Suscribirse"}
            </button>
            {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );
}
