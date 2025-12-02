"use client";

import { PLANS, getPlanFromUser } from "@/lib/plans";
import { CreditCard, Calendar, AlertTriangle } from "lucide-react"; // Importar AlertTriangle
import Link from "next/link";
import ManageButton from "@/components/premium/ManageButton";
import { clsx } from "clsx";

type UserSubscription = {
    subscriptionStatus: string | null;
    stripePriceId: string | null;
    subscriptionEndDate: Date | null;
    cancelAtPeriodEnd: boolean; // <--- NUEVO TIPO
};

export default function SubscriptionCard({ user }: { user: UserSubscription }) {
    const plan = getPlanFromUser(user);
    const isFree = plan.slug === 'free';

    // Formatear fecha
    const renewalDate = user.subscriptionEndDate
        ? new Date(user.subscriptionEndDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    return (
        <div className="bg-neutral-900/50 border-2 border-white/15 rounded-2xl p-8 relative overflow-hidden">

            {!isFree && (
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />
            )}

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <CreditCard className="text-purple-500" size={20} /> Suscripción
                    </h2>
                    {!isFree && (
                        <span className={clsx(
                            "px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-2",
                            user.cancelAtPeriodEnd
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-green-500/10 text-green-400 border-green-500/20"
                        )}>
                            <span className={clsx("w-2 h-2 rounded-full", user.cancelAtPeriodEnd ? "bg-amber-500" : "bg-green-500 animate-pulse")}></span>
                            {user.cancelAtPeriodEnd ? "Cancelación Programada" : "Activa"}
                        </span>
                    )}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-black/40 p-8 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="flex-1 w-full">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tu Plan Actual</p>
                        <div className="flex items-baseline gap-3">
                            <span className={`text-3xl font-black ${isFree ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-400'}`}>
                                {plan.name}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                            {isFree
                                ? "Estás en el plan gratuito. Tienes límites en la creación de eventos."
                                : `Disfruta de ${plan.quota > 100 ? 'eventos ilimitados' : plan.quota + ' eventos'} y funciones avanzadas.`
                            }
                        </p>

                        {/* Lógica de Fecha Inteligente */}
                        {!isFree && renewalDate && (
                            <div className={clsx(
                                "flex items-center gap-2 mt-4 text-xs",
                                user.cancelAtPeriodEnd ? "text-amber-400/80" : "text-gray-500"
                            )}>
                                {user.cancelAtPeriodEnd ? <AlertTriangle size={12} /> : <Calendar size={12} />}
                                <span>
                                    {user.cancelAtPeriodEnd
                                        ? `Finaliza el ${renewalDate}`
                                        : `Se renueva el ${renewalDate}`
                                    }
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-auto flex flex-col gap-3 min-w-[200px]">
                        {isFree ? (
                            <Link
                                href="/premium"
                                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Mejorar Plan
                            </Link>
                        ) : (
                            <ManageButton />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}