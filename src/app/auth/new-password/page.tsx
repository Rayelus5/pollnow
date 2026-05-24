import { Suspense } from "react";
import NewPasswordForm from '@/components/NewPasswordForm';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NewPasswordPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden selection:bg-blue-500/30">

            {/* Fondo Ambiental */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-sky-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-xl p-8 relative z-10">

                {/* Header */}
                <div className="text-center mb-10">
                    <Link href="/login" className="inline-block mb-6 group">
                        <div className="flex items-center gap-2 text-blue-500 font-mono text-xs tracking-[0.2em] uppercase group-hover:text-blue-400 transition-colors">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Volver al login
                        </div>
                    </Link>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Nueva contraseña</h1>
                    <p className="text-gray-400">Elige una nueva contraseña para tu cuenta de Pollnow.</p>
                </div>

                {/* Formulario */}
                <div className="bg-neutral-900/50 border-2 border-white/20 backdrop-blur-xl p-8 rounded-3xl shadow-2xl hover:border-blue-500/30 hover:shadow-blue-400/20 hover:shadow-[0_0_100px] transition-all duration-500">
                    {/* Suspense obligatorio al usar useSearchParams */}
                    <Suspense fallback={
                        <div className="text-white flex flex-col items-center gap-2 py-4">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            <p>Cargando...</p>
                        </div>
                    }>
                        <NewPasswordForm />
                    </Suspense>
                </div>
            </div>
        </main>
    );
}
