import { BugSeverity, BugStatus } from "@prisma/client";

const base = "inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border-2 whitespace-nowrap";

export const SEVERITY_LABEL: Record<BugSeverity, string> = {
    LOW: "Baja",
    MEDIUM: "Media",
    HIGH: "Alta",
    CRITICAL: "Crítica",
};

export const STATUS_LABEL: Record<BugStatus, string> = {
    PENDING: "Pendiente",
    REVIEWING: "Revisando",
    ACCEPTED: "Aceptado",
    REJECTED: "Rechazado",
    REWARDED: "Recompensado",
};

export const SEVERITY_BADGE: Record<BugSeverity, string> = {
    LOW: `${base} bg-blue-500/10 text-blue-400 border-blue-500/20`,
    MEDIUM: `${base} bg-yellow-500/10 text-yellow-400 border-yellow-500/20`,
    HIGH: `${base} bg-orange-500/10 text-orange-400 border-orange-500/20`,
    CRITICAL: `${base} bg-red-500/10 text-red-400 border-red-500/20`,
};

export const STATUS_BADGE: Record<BugStatus, string> = {
    PENDING: `${base} bg-amber-500/10 text-amber-400 border-amber-500/20`,
    REVIEWING: `${base} bg-blue-500/10 text-blue-400 border-blue-500/20`,
    ACCEPTED: `${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`,
    REJECTED: `${base} bg-red-500/10 text-red-400 border-red-500/20`,
    REWARDED: `${base} bg-indigo-500/10 text-indigo-400 border-indigo-500/20`,
};
