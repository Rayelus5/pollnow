import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PasswordRecoveryForm from '@/components/PasswordRecoveryForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function PasswordRecoveryPage() {
    const session = await auth();

    // Si ya hay usuario logueado no tiene sentido recuperar contraseña
    if (session?.user) {
        redirect("/polls");
    }

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
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Recuperar contraseña</h1>
                    <p className="text-gray-400">Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.</p>
                </div>

                {/* Formulario */}
                <div className="bg-neutral-900/50 border-2 border-white/20 backdrop-blur-xl p-8 rounded-3xl shadow-2xl hover:border-blue-500/30 hover:shadow-blue-400/20 hover:shadow-[0_0_100px] transition-all duration-500">
                    <PasswordRecoveryForm />
                </div>

                <p className="text-center text-gray-500 text-sm mt-8">
                    ¿Recordaste tu contraseña? <Link href="/login" className="text-blue-500 hover:underline">Inicia sesión</Link>
                </p>
            </div>
        </main>
    );
}
