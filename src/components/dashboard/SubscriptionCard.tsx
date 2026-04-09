"use client";

import { PLANS, getPlanFromUser } from "@/lib/plans";
import { CreditCard, Calendar, AlertTriangle, Building2, Infinity as InfinityIcon, Crown } from "lucide-react";
import Link from "next/link";
import ManageButton from "@/components/premium/ManageButton";
import { clsx } from "clsx";

type UserSubscription = {
    subscriptionStatus: string | null;
    stripePriceId: string | null;
    subscriptionEndDate: Date | null;
    cancelAtPeriodEnd: boolean;
    stripeSubscriptionId: string | null;
};

export default function SubscriptionCard({ user }: { user: UserSubscription }) {
    const plan = getPlanFromUser(user);
    const isFree = plan.slug === "free";
    const isEnterprise = plan.slug === "enterprise";

    // Suscripción de promoción: activa pero sin Stripe (bono de bienvenida, manual, etc.)
    // Enterprise no es "promo" aunque tampoco tenga Stripe
    const isPromo = !isFree && !isEnterprise && !user.stripeSubscriptionId;

    const isLifetime = isEnterprise && !user.subscriptionEndDate;

    const renewalDate = user.subscriptionEndDate
        ? new Date(user.subscriptionEndDate).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
        : null;

    if (isEnterprise) {
        return (
            <div className="bg-neutral-900/50 border-2 border-amber-500/20 rounded-2xl p-8 relative overflow-hidden">
                {/* Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/8 rounded-full blur-[100px] pointer-events-none -mr-20 -mt-20" />
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Building2 className="text-amber-500" size={20} /> Suscripción
                        </h2>
                        <span className="px-3 py-1 text-xs font-bold rounded-full border-2 bg-amber-500/10 text-amber-400 border-amber-500/30 flex items-center gap-2">
                            <Crown size={11} className="text-amber-400" />
                            {isLifetime ? "Vitalicio" : "Activo"}
                        </span>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-black/40 p-8 rounded-xl border-2 border-amber-500/10 backdrop-blur-sm">
                        <div className="flex-1 w-full">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tu Plan Actual</p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                                    Enterprise
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 mt-2">
                                Plan exclusivo para empresas. Acceso a todas las funciones avanzadas sin límites.
                            </p>

                            <div className="flex items-center gap-2 mt-4 text-xs text-amber-500/70">
                                {isLifetime ? (
                                    <>
                                        <InfinityIcon size={12} />
                                        <span>Plan sin fecha de expiración</span>
                                    </>
                                ) : renewalDate ? (
                                    <>
                                        <Calendar size={12} />
                                        <span>Expira el {renewalDate}</span>
                                    </>
                                ) : null}
                            </div>

                            {/* Limits summary */}
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                {[
                                    { label: "Eventos", value: PLANS.ENTERPRISE.quota },
                                    { label: "Categorías/evento", value: PLANS.ENTERPRISE.limits.pollsPerEvent },
                                    { label: "Nominados/evento", value: PLANS.ENTERPRISE.limits.participantsPerEvent },
                                    { label: "Colaboradores/evento", value: PLANS.ENTERPRISE.limits.collaboratorsPerEvent },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between px-3 py-1.5 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                                        <span className="text-[10px] text-gray-500">{label}</span>
                                        <span className="text-[10px] font-bold text-amber-400 font-mono">{value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                            "px-3 py-1 text-xs font-bold rounded-full border-2 flex items-center gap-2",
                            user.cancelAtPeriodEnd
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : isPromo
                                    ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                                    : "bg-green-500/10 text-green-400 border-green-500/20"
                        )}>
                            <span className={clsx(
                                "w-2 h-2 rounded-full",
                                user.cancelAtPeriodEnd ? "bg-amber-500" : isPromo ? "bg-violet-400" : "bg-green-500 animate-pulse"
                            )}></span>
                            {user.cancelAtPeriodEnd ? "Cancelación Programada" : isPromo ? "Promoción" : "Activa"}
                        </span>
                    )}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-black/40 p-8 rounded-xl border-2 border-white/10 backdrop-blur-sm">
                    <div className="flex-1 w-full">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tu Plan Actual</p>
                        <div className="flex items-baseline gap-3">
                            <span className={`text-3xl font-black ${isFree ? "text-white" : "text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-400"}`}>
                                {plan.name}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                            {isFree
                                ? "Estás en el plan gratuito. Tienes límites en la creación de eventos."
                                : `Disfruta de ${plan.quota > 100 ? "eventos ilimitados" : plan.quota + " eventos"} y funciones avanzadas.`
                            }
                        </p>

                        {/* Lógica de Fecha Inteligente */}
                        {!isFree && renewalDate && (
                            <div className={clsx(
                                "flex items-center gap-2 mt-4 text-xs",
                                user.cancelAtPeriodEnd || isPromo ? "text-amber-400/80" : "text-gray-500"
                            )}>
                                {user.cancelAtPeriodEnd || isPromo ? <AlertTriangle size={12} /> : <Calendar size={12} />}
                                <span>
                                    {user.cancelAtPeriodEnd || isPromo
                                        ? `Finaliza el ${renewalDate}`
                                        : `Se renueva el ${renewalDate}`
                                    }
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-auto flex flex-col gap-3 min-w-[200px]">
                        {isFree || isPromo ? (
                            <Link
                                href="/premium"
                                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                {isFree ? "Mejorar Plan" : "Ver Planes"}
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
