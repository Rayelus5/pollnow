import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Wallet, ArrowDownToLine, Calendar } from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
import NewPaymentToggle from "@/components/admin/NewPaymentToggle";
import { formatEur } from "@/lib/revenue-config";
import { formatDate, madridDayStart, madridDayEnd } from "@/lib/format-date";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

export default async function AdminEnviosPage({
    searchParams,
}: {
    searchParams: Promise<{ userId?: string; from?: string; to?: string; page?: string }>;
}) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") redirect("/");

    const params = await searchParams;
    const currentPage = Math.max(1, Number(params.page ?? "1") || 1);

    const where: Prisma.RevenuePaymentWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.from || params.to) {
        where.createdAt = {};
        if (params.from) where.createdAt.gte = madridDayStart(params.from);
        if (params.to) where.createdAt.lte = madridDayEnd(params.to);
    }

    const [payments, total] = await Promise.all([
        prisma.revenuePayment.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true } },
                event: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (currentPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.revenuePayment.count({ where }),
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
                <Link href="/admin/ingresos/envios" className="px-4 py-2.5 text-sm font-bold text-emerald-400 border-b-2 border-emerald-400 -mb-0.5 flex items-center gap-2">
                    <Wallet size={15} /> Envíos de dinero
                </Link>
                <Link href="/admin/ingresos/retiros" className="px-4 py-2.5 text-sm font-bold text-gray-400 hover:text-white flex items-center gap-2">
                    <ArrowDownToLine size={15} /> Solicitudes de retiro
                </Link>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                {/* Filtro de fechas (GET) */}
                <form className="flex flex-wrap items-end gap-3">
                    {params.userId && <input type="hidden" name="userId" value={params.userId} />}
                    <div>
                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Desde</label>
                        <input type="date" name="from" defaultValue={params.from} className="bg-black border-2 border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Hasta</label>
                        <input type="date" name="to" defaultValue={params.to} className="bg-black border-2 border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-white/5 border-2 border-white/15 text-sm font-bold text-white hover:bg-white/10 cursor-pointer">Filtrar</button>
                    {(params.from || params.to || params.userId) && (
                        <Link href="/admin/ingresos/envios" className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 hover:text-white">Limpiar</Link>
                    )}
                </form>

                <NewPaymentToggle />
            </div>

            {params.userId && (
                <p className="text-xs text-gray-500 mb-4">Filtrando por usuario: <span className="font-mono text-gray-400">{params.userId}</span></p>
            )}

            <div className="bg-neutral-900 border-2 border-white/10 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-medium">Fecha</th>
                            <th className="p-4 font-medium">Usuario</th>
                            <th className="p-4 font-medium">Evento</th>
                            <th className="p-4 font-medium">Cantidad</th>
                            <th className="p-4 font-medium">Nota</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                        {payments.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay envíos con estos filtros.</td></tr>
                        )}
                        {payments.map((p) => (
                            <tr key={p.id} className="hover:bg-white/5">
                                <td className="p-4 whitespace-nowrap text-gray-500"><span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(p.createdAt, true)}</span></td>
                                <td className="p-4">
                                    <Link href={`/admin/users/${p.user.id}`} className="group">
                                        <div className="font-medium text-gray-300 group-hover:text-white">{p.user.name}</div>
                                        <div className="text-xs text-gray-500">{p.user.email}</div>
                                    </Link>
                                </td>
                                <td className="p-4">
                                    {p.event ? <Link href={`/admin/events/${p.event.id}`} className="text-blue-400 hover:underline">{p.event.title}</Link> : <span className="text-gray-500">—</span>}
                                </td>
                                <td className="p-4 font-bold text-emerald-400 whitespace-nowrap">+{formatEur(p.amount)}</td>
                                <td className="p-4 text-gray-400 max-w-xs">{p.adminNote || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AdminPagination currentPage={currentPage} totalPages={totalPages} basePath="/admin/ingresos/envios"
                query={{ userId: params.userId, from: params.from, to: params.to }} />
        </div>
    );
}
