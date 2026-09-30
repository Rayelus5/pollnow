"use client";

import { useMemo } from "react";
import { Activity } from "lucide-react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    type TooltipContentProps,
} from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

export type VotesOverTimePoint = { bucket: string; count: number };

const DAY_MS = 1000 * 60 * 60 * 24;

function formatBucketLabel(iso: string, spanMs: number): string {
    const d = new Date(iso);
    // Eventos cortos (≤ ~1.5 días de duración): la hora ya distingue los buckets.
    // Eventos largos: la hora se repite entre días, hace falta la fecha.
    return spanMs <= DAY_MS * 1.5
        ? d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function CustomTooltip({ active, payload, label, spanMs }: TooltipContentProps<ValueType, NameType> & { spanMs: number }) {
    if (!active || !payload?.length || typeof label !== "string") return null;
    const full = new Date(label).toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
    const count = payload[0].value as number;
    return (
        <div className="bg-neutral-900 border-2 border-white/10 rounded-xl px-3 py-2 shadow-xl">
            <p className="text-[11px] text-gray-500 mb-0.5">{full}</p>
            <p className="text-sm font-bold text-white">
                {count} voto{count === 1 ? "" : "s"}
            </p>
        </div>
    );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-bold text-white font-mono">{value}</p>
        </div>
    );
}

/**
 * Card "Rendimiento de votaciones": serie temporal del nº de votos por bucket
 * (bucketing adaptativo calculado en stats-actions.ts). Un solo componente
 * reutilizado por EventStatistics.tsx (GALA) y ModeStatistics.tsx (resto de modos).
 */
export default function VotingPerformanceCard({ data }: { data: VotesOverTimePoint[] }) {
    const { totalVotes, peakCount, ratePerHour, spanMs } = useMemo(() => {
        if (data.length === 0) {
            return { totalVotes: 0, peakCount: 0, ratePerHour: 0, spanMs: 0 };
        }
        const totalVotes = data.reduce((acc, d) => acc + d.count, 0);
        const peakCount = data.reduce((max, d) => Math.max(max, d.count), 0);
        const first = new Date(data[0].bucket).getTime();
        const last = new Date(data[data.length - 1].bucket).getTime();
        const spanMs = Math.max(last - first, 60_000);
        const ratePerHour = totalVotes / (spanMs / (1000 * 60 * 60));
        return { totalVotes, peakCount, ratePerHour, spanMs };
    }, [data]);

    return (
        <div className="bg-neutral-900/50 border-2 border-white/10 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity size={18} className="text-blue-400" />
                        Rendimiento de votaciones
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Votos registrados a lo largo del tiempo</p>
                </div>
                {data.length > 0 && (
                    <div className="flex gap-6">
                        <MiniStat label="Total" value={totalVotes} />
                        <MiniStat label="Pico" value={peakCount} />
                        <MiniStat label="Ritmo" value={`${ratePerHour < 10 ? ratePerHour.toFixed(1) : Math.round(ratePerHour)}/h`} />
                    </div>
                )}
            </div>

            {data.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-sm text-gray-600">
                    Todavía no hay votos registrados en este evento.
                </div>
            ) : (
                <div className="h-[220px] -ml-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="votesGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.45} />
                                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                            <XAxis
                                dataKey="bucket"
                                tickFormatter={(v: string) => formatBucketLabel(v, spanMs)}
                                tick={{ fill: "#6b7280", fontSize: 11 }}
                                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                                tickLine={false}
                                minTickGap={32}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fill: "#6b7280", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                width={32}
                            />
                            <Tooltip
                                content={(props) => <CustomTooltip {...props} spanMs={spanMs} />}
                                cursor={{ stroke: "rgba(96,165,250,0.4)", strokeWidth: 1 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#38bdf8"
                                strokeWidth={2}
                                fill="url(#votesGradient)"
                                activeDot={{ r: 4, fill: "#38bdf8", stroke: "#0f172a", strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
