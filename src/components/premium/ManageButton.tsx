"use client";

import { createCustomerPortalSession } from "@/app/lib/stripe-actions";
import { useState } from "react";
import { Settings, AlertCircle } from "lucide-react";

export default function ManageButton() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePortal = async () => {
        setLoading(true);
        setError(null);
        const result = await createCustomerPortalSession();
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
                onClick={handlePortal}
                disabled={loading}
                className="w-full py-3 px-10 rounded-xl font-bold border-2 border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-1 text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
            {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );
}
