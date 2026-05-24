import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Wallet, ArrowDownToLine, Calendar, Filter } from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
import WithdrawalActions from "@/components/admin/WithdrawalActions";
import { formatEur } from "@/lib/revenue-config";
import { formatDate } from "@/lib/format-date";
import { Prisma, WithdrawalStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;
const STATUS_FILTERS: (WithdrawalStatus | "ALL")[] = ["PENDING", "APPROVED", "REJECTED", "ALL"];
const STATUS_BADGE: Record<WithdrawalStatus, string> = {
    PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
};
const STATUS_LABEL: Record<WithdrawalStatus, string> = { PENDING: "Pendiente", APPROVED: "Pagado", REJECTED: "Rechazado" };

export default async function AdminRetirosPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; userId?: string; page?: string }>;
}) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") redirect("/");

    const params = await searchParams;
    const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
    // Por defecto mostramos PENDING al entrar. "ALL" = sin filtro de estado.
    const VALID_STATUSES: WithdrawalStatus[] = ["PENDING", "APPROVED", "REJECTED"];
    const statusParam: WithdrawalStatus | undefined =
        params.status === "ALL"
            ? undefined
            : VALID_STATUSES.includes(params.status as WithdrawalStatus)
                ? (params.status as WithdrawalStatus)
                : "PENDING";

    const where: Prisma.WithdrawalRequestWhereInput = {};
    if (statusParam) where.status = statusParam;
    if (params.userId) where.userId = params.userId;

    const [withdrawals, total] = await Promise.all([
        prisma.withdrawalRequest.findMany({
            where,
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "desc" },
            skip: (currentPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.withdrawalRequest.count({ where }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-8">
                <Wallet size={28} className="text-emerald-500" />
                <h1 className="text-3xl font-bold text-white">Ingresos</h1>
            </div>

            {/* Sub-nav */}
            <div className="flex gap-2 mb-8 border-b-2 border-white/10">
                <Link href="/admin/ingresos/envios" className="px-4 py-2.5 text-sm font-bold text-gray-400 hover:text-white flex items-center gap-2">
                    <Wallet size={15} /> Envíos de dinero
                </Link>
                <Link href="/admin/ingresos/retiros" className="px-4 py-2.5 text-sm font-bold text-emerald-400 border-b-2 border-emerald-400 -mb-0.5 flex items-center gap-2">
                    <ArrowDownToLine size={15} /> Solicitudes de retiro
                </Link>
            </div>

            {/* Filtros */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold mr-1 flex items-center gap-1"><Filter size={12} /> Estado</span>
                {STATUS_FILTERS.map((s) => {
                    const active = (s === statusParam) || (s === "ALL" && !statusParam);
                    const qs = new URLSearchParams();
                    qs.set("status", s);
                    if (params.userId) qs.set("userId", params.userId);
                    return (
                        <Link key={s} href={`/admin/ingresos/retiros?${qs}`}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${active ? "bg-white text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                            {s === "ALL" ? "Todas" : STATUS_LABEL[s]}
                        </Link>
                    );
                })}
            </div>

            <div className="bg-neutral-900 border-2 border-white/10 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-medium">Fecha</th>
                            <th className="p-4 font-medium">Usuario</th>
                            <th className="p-4 font-medium">Cantidad</th>
                            <th className="p-4 font-medium">Método</th>
                            <th className="p-4 font-medium">Destinatario</th>
                            <th className="p-4 font-medium">Teléfono</th>
                            <th className="p-4 font-medium">Estado</th>
                            <th className="p-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                        {withdrawals.length === 0 && (
                            <tr><td colSpan={8} className="p-8 text-center text-gray-500">No hay solicitudes con estos filtros.</td></tr>
                        )}
                        {withdrawals.map((w) => (
                            <tr key={w.id} className={`transition-colors ${w.status === "PENDING" ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-white/5"}`}>
                                <td className="p-4 whitespace-nowrap text-gray-500"><span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(w.createdAt, true)}</span></td>
                                <td className="p-4">
                                    <Link href={`/admin/users/${w.user.id}`} className="group">
                                        <div className="font-medium text-gray-300 group-hover:text-white">{w.user.name}</div>
                                        <div className="text-xs text-gray-500">{w.user.email}</div>
                                    </Link>
                                </td>
                                <td className="p-4 font-bold whitespace-nowrap">{formatEur(w.amount)}</td>
                                <td className="p-4">{w.method === "BIZUM" ? "Bizum" : w.method}</td>
                                <td className="p-4">{w.recipientName}</td>
                                <td className="p-4 whitespace-nowrap text-gray-400">{w.recipientPhone}</td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border-2 ${STATUS_BADGE[w.status]}`}>{STATUS_LABEL[w.status]}</span>
                                    {w.status === "REJECTED" && w.rejectionReason && (
                                        <p className="text-[11px] text-gray-500 mt-1 max-w-[200px]" title={w.rejectionReason}>{w.rejectionReason}</p>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {w.status === "PENDING" ? (
                                        <WithdrawalActions id={w.id} amount={w.amount} recipientName={w.recipientName} recipientPhone={w.recipientPhone} />
                                    ) : (
                                        <span className="text-xs text-gray-600">{w.processedAt ? formatDate(w.processedAt) : "—"}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AdminPagination currentPage={currentPage} totalPages={totalPages} basePath="/admin/ingresos/retiros"
                query={{ status: params.status, userId: params.userId }} />
        </div>
    );
}
