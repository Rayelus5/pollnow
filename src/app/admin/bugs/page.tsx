import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bug, Calendar, Filter } from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
import { BugSeverity, BugStatus, Prisma } from "@prisma/client";
import { SEVERITY_BADGE, STATUS_BADGE, SEVERITY_LABEL, STATUS_LABEL } from "@/components/admin/bugBadges";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const SEVERITY_FILTERS: (BugSeverity | "ALL")[] = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUS_FILTERS: (BugStatus | "ALL")[] = ["ALL", "PENDING", "REVIEWING", "ACCEPTED", "REJECTED", "REWARDED"];

export default async function AdminBugsPage({
    searchParams,
}: {
    searchParams: Promise<{ severity?: string; status?: string; page?: string }>;
}) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
        redirect("/");
    }

    const params = await searchParams;
    const severityParam = SEVERITY_FILTERS.includes(params.severity as BugSeverity) ? (params.severity as BugSeverity) : undefined;
    const statusParam = STATUS_FILTERS.includes(params.status as BugStatus) ? (params.status as BugStatus) : undefined;
    const currentPage = Math.max(1, Number(params.page ?? "1") || 1);

    const where: Prisma.BugReportWhereInput = {};
    if (severityParam) where.severity = severityParam;
    if (statusParam) where.status = statusParam;

    const [reports, total, pendingCount] = await Promise.all([
        prisma.bugReport.findMany({
            where,
            include: { user: { select: { id: true, username: true, email: true } } },
            orderBy: { createdAt: "desc" },
            skip: (currentPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.bugReport.count({ where }),
        prisma.bugReport.count({ where: { status: "PENDING" } }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
                        <Bug size={28} className="text-blue-500" />
                        Bug Bounty
                    </h1>
                    <p className="text-gray-400 mt-1">Reportes de errores enviados por los usuarios.</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${pendingCount === 0 ? "border-green-500/20" : "border-amber-500/20"}`}>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: pendingCount === 0 ? "green" : "orange" }} />
                    <span className={`${pendingCount === 0 ? "text-green-500" : "text-amber-500"} text-xs font-bold`}>{pendingCount} Pendientes</span>
                </div>
            </div>

            {/* Filtros */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold mr-1 flex items-center gap-1"><Filter size={12} /> Severidad</span>
                {SEVERITY_FILTERS.map((s) => {
                    const active = (s === "ALL" && !severityParam) || s === severityParam;
                    const qs = new URLSearchParams();
                    if (s !== "ALL") qs.set("severity", s);
                    if (statusParam) qs.set("status", statusParam);
                    return (
                        <Link key={s} href={`/admin/bugs${qs.toString() ? `?${qs}` : ""}`}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${active ? "bg-white text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                            {s === "ALL" ? "Todas" : SEVERITY_LABEL[s]}
                        </Link>
                    );
                })}
            </div>
            <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold mr-1 flex items-center gap-1"><Filter size={12} /> Estado</span>
                {STATUS_FILTERS.map((s) => {
                    const active = (s === "ALL" && !statusParam) || s === statusParam;
                    const qs = new URLSearchParams();
                    if (severityParam) qs.set("severity", severityParam);
                    if (s !== "ALL") qs.set("status", s);
                    return (
                        <Link key={s} href={`/admin/bugs${qs.toString() ? `?${qs}` : ""}`}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${active ? "bg-white text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                            {s === "ALL" ? "Todos" : STATUS_LABEL[s]}
                        </Link>
                    );
                })}
            </div>

            <div className="bg-neutral-900 border-2 border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-medium">Fecha</th>
                            <th className="p-4 font-medium">Usuario</th>
                            <th className="p-4 font-medium">Título</th>
                            <th className="p-4 font-medium">Severidad</th>
                            <th className="p-4 font-medium">Estado</th>
                            <th className="p-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                        {reports.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay reportes con estos filtros.</td></tr>
                        )}
                        {reports.map((r) => (
                            <tr key={r.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 whitespace-nowrap text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><Calendar size={10} /> {format(r.createdAt, "dd/MM/yy HH:mm")}</span>
                                </td>
                                <td className="p-4">
                                    <Link href={`/admin/users/${r.user.id}`} className="group">
                                        <div className="font-medium text-gray-300 group-hover:text-white">{r.user.username || "Sin usuario"}</div>
                                        <div className="text-xs text-gray-500">{r.user.email}</div>
                                    </Link>
                                </td>
                                <td className="p-4 max-w-xs"><p className="text-white font-medium line-clamp-2">{r.title}</p></td>
                                <td className="p-4"><span className={SEVERITY_BADGE[r.severity]}>{SEVERITY_LABEL[r.severity]}</span></td>
                                <td className="p-4"><span className={STATUS_BADGE[r.status]}>{STATUS_LABEL[r.status]}</span></td>
                                <td className="p-4 text-right">
                                    <Link href={`/admin/bugs/${r.id}`} className="inline-block px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 border-2 border-white/10 transition-colors">
                                        Ver detalle
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/admin/bugs"
                query={{ severity: severityParam || undefined, status: statusParam || undefined }}
            />
        </div>
    );
}
