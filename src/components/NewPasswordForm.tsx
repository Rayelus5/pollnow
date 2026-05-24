'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resetPassword } from '@/app/lib/auth-actions';
import { CheckCircle2 } from 'lucide-react';

export default function NewPasswordForm() {
    const [state, dispatch, isPending] = useActionState(resetPassword, undefined);
    const searchParams = useSearchParams();
    const token = searchParams.get('token') ?? '';

    // Éxito
    if (state?.success) {
        return (
            <div className="text-center space-y-6 py-4 animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500">
                    <CheckCircle2 size={32} />
                </div>
                <p className="text-green-400 font-medium">{state.success}</p>
                <Link href="/login" className="inline-block mt-2 px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors">
                    Ir a Iniciar Sesión
                </Link>
            </div>
        );
    }

    // Sin token en la URL → enlace inválido
    if (!token) {
        return (
            <div className="text-center space-y-6 py-4">
                <p className="text-red-400 font-medium">El enlace no es válido. Solicita uno nuevo.</p>
                <Link href="/password-recovery" className="inline-block text-sm text-blue-500 hover:text-blue-400 font-bold">
                    Solicitar nuevo enlace
                </Link>
            </div>
        );
    }

    return (
        <form action={dispatch} className="space-y-6">
            <input type="hidden" name="token" value={token} />

            <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Nueva contraseña
                </label>
                <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full p-4 rounded-xl bg-white/5 border-2 border-white/20 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Repetir contraseña
                </label>
                <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full p-4 rounded-xl bg-white/5 border-2 border-white/20 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
            </div>

            {state?.error && (
                <div className="p-3 bg-red-500/10 border-2 border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>{state.error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                {isPending ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
        </form>
    );
}
