"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { newVerification } from "@/app/lib/new-verification";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function NewVerificationPage() {
    const [error, setError] = useState<string | undefined>();
    const [success, setSuccess] = useState<string | undefined>();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const onSubmit = useCallback(() => {
        if (success || error) return;
        if (!token) {
            setError("Token no encontrado");
            return;
        }

        newVerification(token)
            .then((data) => {
                setSuccess(data.success);
                setError(data.error);
            })
            .catch(() => {
                setError("Algo salió mal al verificar.");
            });
    }, [token, success, error]);

    useEffect(() => {
        onSubmit();
    }, [onSubmit]);

    return (
        <main className="min-h-screen bg-black flex items-center justify-center p-6 selection:bg-blue-500/30">
            <div className="bg-neutral-900/50 border border-white/10 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl backdrop-blur-xl">
                <h1 className="text-2xl font-bold text-white mb-6">Verificando tu cuenta</h1>

                {!success && !error && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        <p className="text-gray-400">Estamos confirmando tu token...</p>
                    </div>
                )}

                {success && (
                    <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                            <CheckCircle2 size={32} />
                        </div>
                        <p className="text-green-400 font-medium">{success}</p>
                        <Link href="/login" className="mt-4 px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors">
                            Ir a Iniciar Sesión
                        </Link>
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
                            <XCircle size={32} />
                        </div>
                        <p className="text-red-400 font-medium">{error}</p>
                        <Link href="/login" className="mt-4 text-sm text-gray-400 hover:text-white underline">
                            Volver al login
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}