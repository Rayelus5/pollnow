"use client";

import { Lock, TrendingUp, Users, ListOrdered, CircleHelp, Brush, ThumbsUp, ThumbsDown, Star, ImageIcon } from "lucide-react";
import type { ModeStats } from "@/app/lib/stats-actions";

function KpiCard({ title, value, icon, subtext }: { title: string; value: string | number; icon: React.ReactNode; subtext?: string }) {
    return (
        <div className="bg-neutral-900/50 border-2 border-white/10 rounded-2xl p-6 flex items-start justify-between">
            <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</p>
                <h4 className="text-3xl font-black text-white">{value}</h4>
                {subtext && <p className="text-xs mt-1 font-medium text-gray-500">{subtext}</p>}
            </div>
            <div className="p-3 rounded-xl border-2 bg-white/5 border-white/5">{icon}</div>
        </div>
    );
}

export default function ModeStatistics({
    stats,
    canViewStats = true,
}: {
    stats: ModeStats | null;
    planSlug: string;
    canViewStats?: boolean;
}) {
    if (!canViewStats) {
        return (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/10 rounded-2xl text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-7 h-7 text-gray-500" />
                </div>
                <h3 className="font-bold text-white mb-2">Sin acceso a estadísticas</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">No tienes permiso para ver las estadísticas de este evento.</p>
            </div>
        );
    }
    if (!stats) return <div className="py-20 text-center text-gray-500">Sin datos todavía.</div>;

    if (stats.mode === "TIERLIST") {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <KpiCard title="Votos totales" value={stats.totalVotes} icon={<TrendingUp className="text-blue-400" />} subtext="Personas que ordenaron la tierlist" />
                    <KpiCard title="Nominados" value={stats.participants.length} icon={<ListOrdered className="text-purple-400" />} />
                </div>
                <div className="bg-neutral-900/50 border-2 border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Tier más votado por nominado</h3>
                    {stats.totalVotes === 0 ? (
                        <p className="text-gray-500 text-sm">Aún no hay votos.</p>
                    ) : (
                        <div className="space-y-4">
                            {stats.participants.map((p) => {
                                const max = Math.max(...p.tiers.map((t) => t.count), 1);
                                return (
                                    <div key={p.id} className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-800 border-2 border-white/10 shrink-0 flex items-center justify-center text-xs font-bold">
                                            {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : p.name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-white truncate">{p.name}</span>
                                                {p.topTier && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold text-black/80" style={{ backgroundColor: p.topTier.color }}>{p.topTier.label}</span>
                                                )}
                                                <span className="text-[11px] text-gray-500 ml-auto">{p.placements} votos</span>
                                            </div>
                                            {/* distribución por tier */}
                                            <div className="flex gap-1 flex-wrap">
                                                {p.tiers.filter((t) => t.count > 0).map((t) => (
                                                    <span key={t.tierId} className="inline-flex items-center gap-1 text-[10px] text-gray-300">
                                                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: t.color }} />
                                                        {t.label}: <b className="text-white">{t.count}</b>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-1 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden flex">
                                                {p.tiers.filter((t) => t.count > 0).map((t) => (
                                                    <div key={t.tierId} style={{ width: `${(t.count / max) * 100 / p.tiers.filter((x) => x.count > 0).length}%`, backgroundColor: t.color }} className="h-full" />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (stats.mode === "PREGUNTAS") {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <KpiCard title="Respuestas (personas)" value={stats.totalRespondents} icon={<Users className="text-green-400" />} subtext="Resultados privados (solo tú los ves)" />
                    <KpiCard title="Preguntas" value={stats.questions.length} icon={<CircleHelp className="text-purple-400" />} />
                </div>
                <div className="space-y-5">
                    {stats.questions.map((q) => (
                        <div key={q.id} className="bg-neutral-900/50 border-2 border-white/10 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="font-bold text-white">{q.text}</h3>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">{q.type === "CHECKBOX" ? "Múltiple" : "Única"}</span>
                                <span className="text-[11px] text-gray-500 ml-auto">{q.totalAnswers} respuestas</span>
                            </div>
                            <div className="space-y-3">
                                {q.options.map((o) => (
                                    <div key={o.id}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-300">{o.text}</span>
                                            <span className="text-gray-500 font-mono">{o.count} · {o.pct}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full" style={{ width: `${o.pct}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // DIBUJO
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard title="Dibujos" value={stats.submissions} icon={<ImageIcon className="text-blue-400" />} />
                <KpiCard title="Likes" value={stats.likes} icon={<ThumbsUp className="text-emerald-400" />} />
                <KpiCard title="Dislikes" value={stats.dislikes} icon={<ThumbsDown className="text-red-400" />} />
                <KpiCard title="Superlikes" value={stats.superlikes} icon={<Star className="text-amber-400" />} />
            </div>
            <div className="bg-neutral-900/50 border-2 border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Brush size={18} /> Top dibujos</h3>
                {stats.top.length === 0 ? (
                    <p className="text-gray-500 text-sm">Aún no hay dibujos.</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {stats.top.map((d, i) => (
                            <div key={d.id} className="rounded-xl overflow-hidden border-2 border-white/10 bg-neutral-900 relative">
                                {d.imageUrl ? <img src={d.imageUrl} alt={`#${i + 1}`} className="w-full aspect-[3/2] object-cover bg-white" /> : <div className="w-full aspect-[3/2] bg-neutral-800" />}
                                <div className="absolute inset-x-0 bottom-0 bg-black/70 text-[11px] text-center py-0.5 flex items-center justify-center gap-2">
                                    <span className="text-gray-400">#{i + 1}</span>
                                    <span className="font-bold text-white">{d.score} pts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
