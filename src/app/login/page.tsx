import LoginForm from '@/components/LoginForm';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden selection:bg-blue-500/30">

            {/* Fondo Ambiental */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-sky-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md p-8 relative z-10">

                {/* Header Card */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block mb-6 group">
                        <div className="flex items-center gap-2 text-blue-500 font-mono text-xs tracking-[0.2em] uppercase group-hover:text-blue-400 transition-colors">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Volver al inicio
                        </div>
                    </Link>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Bienvenido de nuevo</h1>
                    <p className="text-gray-400">Introduce tus credenciales para gestionar tus eventos.</p>
                </div>

                {/* Formulario */}
                <div className="bg-neutral-900/50 border border-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
                    <LoginForm />

                    {/* Separador (para futuro Google Login) */}
                    <div className="my-8 flex items-center gap-4">
                        <div className="h-px bg-white/10 flex-1" />
                        <span className="text-gray-500 text-xs uppercase">O continúa con</span>
                        <div className="h-px bg-white/10 flex-1" />
                    </div>

                    {/* BOTÓN GOOGLE */}
                    <form
                        action={async () => {
                            "use server"
                            // CAMBIO AQUÍ: de "/dashboard" a "/dashboard/profile"
                            await signIn("google", { redirectTo: "/dashboard/profile" });
                        }}
                        >
                        <button disabled className="w-full py-3 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 opacity-50 cursor-not-allowed hover:opacity-70 transition-opacity">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google (Próximamente)
                        </button>
                    </form>

                <p className="text-center text-gray-500 text-sm mt-8">
                    ¿No tienes cuenta? <Link href="/register" className="text-blue-500 hover:underline">Regístrate aquí</Link>
                </p>

            </div>
        </main>
    );
}