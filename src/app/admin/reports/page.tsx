import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import {
    User,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Ban,
    XCircle,
    ShieldAlert,
} from "lucide-react";

export const dynamic = "force-dynamic";

// --- Acciones del Servidor ---

async function toggleReportReviewStatus(
    reportId: string,
    adminId: string,
    isReviewed: boolean
) {
    "use server";
    try {
        await prisma.report.update({
            where: { id: reportId },
            data: { isReviewed },
        });

        await prisma.moderationLog.create({
            data: {
                adminId: adminId,
                actionType: "REPORT_REVIEW",
                targetType: "REPORT",
                targetId: reportId,
                details: isReviewed
                    ? "Marcado como revisado"
                    : "Reabierto para revisión",
            },
        });
    } catch (error) {
        console.error("Error:", error);
    }
}

async function banUserAndDenyEvent(
    userIdToBan: string,
    eventId: string,
    adminId: string
) {
    "use server";

    try {
        // 1. Bloquear al usuario
        await prisma.user.update({
            where: { id: userIdToBan },
            data: { ipBan: true },
        });

        // 2. Log BAN
        await prisma.moderationLog.create({
            data: {
                adminId: adminId,
                actionType: "BAN_USER",
                targetType: "USER",
                targetId: userIdToBan,
                details: "Bloqueado desde panel de reportes.",
            },
        });

        // 3. Denegar el evento
        await prisma.event.update({
            where: { id: eventId },
            data: {
                status: "DENIED",
                reviewReason: "Evento eliminado por violación de términos (Reporte).",
            },
        });

        // 4. Log DENY
        await prisma.moderationLog.create({
            data: {
                adminId: adminId,
                actionType: "DENY_EVENT",
                targetType: "EVENT",
                targetId: eventId,
                details: "Denegado automáticamente al banear al creador.",
            },
        });
    } catch (error) {
        console.error("Error en acción de ban:", error);
    }
}

// --- Componente Principal ---
export default async function AdminReportsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string }>;
}) {
    const session = await auth();
    const params = await searchParams;

    // @ts-ignore
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
        redirect("/");
    }

    const filterStatus = params.status === "REVIEWED";
    const isFiltered = params.status !== undefined;

    // Consulta corregida para tu Schema actual
    const reports = await prisma.report.findMany({
        where: {
            isReviewed: isFiltered ? filterStatus : undefined,
        },
        include: {
            reporter: {
                select: { id: true, username: true, email: true },
            },
            // Aquí está la clave: Accedemos al usuario a través del evento
            event: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                    slug: true,
                    user: {
                        // El creador del evento reportado
                        select: { id: true, username: true, email: true, ipBan: true },
                    },
                },
            },
        },
        orderBy: [{ isReviewed: "asc" }, { createdAt: "desc" }],
    });

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">
                    Gestión de Reportes ({reports.length})
                </h1>
                <p className="text-gray-400">Revisión de incidencias de contenido.</p>
            </header>

            {/* Filtros */}
            <div className="mb-6 flex gap-3">
                <Link
                    href="/admin/reports"
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${!isFiltered
                            ? "bg-white text-black"
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                >
                    Todos
                </Link>
                <Link
                    href="/admin/reports?status=PENDING"
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${params.status === "PENDING"
                            ? "bg-amber-500 text-black"
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                >
                    <AlertTriangle size={16} className="inline mr-2" /> Pendientes
                </Link>
                <Link
                    href="/admin/reports?status=REVIEWED"
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition ${params.status === "REVIEWED"
                            ? "bg-green-500 text-black"
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                >
                    <CheckCircle size={16} className="inline mr-2" /> Revisados
                </Link>
            </div>

            <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-medium">Estado</th>
                            <th className="p-4 font-medium">Motivo</th>
                            <th className="p-4 font-medium">Evento Reportado</th>
                            <th className="p-4 font-medium">Creador (Reportado)</th>
                            <th className="p-4 font-medium">Reportado Por</th>
                            <th className="p-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                        {reports.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">
                                    No hay reportes en este estado.
                                </td>
                            </tr>
                        )}
                        {reports.map((report) => (
                            <tr
                                key={report.id}
                                className={`transition-colors ${report.isReviewed
                                        ? "opacity-60 hover:opacity-100 bg-neutral-950/50"
                                        : "hover:bg-white/5"
                                    }`}
                            >
                                <td className="p-4">
                                    {report.isReviewed ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20">
                                            Revisado
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                            Pendiente
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 max-w-xs">
                                    <p className="text-white font-medium">{report.reason}</p>
                                    <p
                                        className="text-gray-500 text-xs mt-1 line-clamp-2"
                                        title={report.details}
                                    >
                                        {report.details}
                                    </p>
                                    <div className="text-[10px] text-gray-600 mt-2 flex items-center gap-1">
                                        <Calendar size={10} />{" "}
                                        {format(report.createdAt, "dd/MM/yy HH:mm")}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="font-medium text-white">
                                        {report.event.title}
                                    </div>
                                    <div className="text-xs text-gray-500 mb-1">
                                        {report.event.status}
                                    </div>
                                    <Link
                                        href={`/e/${report.event.slug}`}
                                        target="_blank"
                                        className="text-blue-400 text-xs hover:underline"
                                    >
                                        Ver Evento
                                    </Link>
                                </td>
                                <td className="p-4">
                                    <Link
                                        href={`/admin/users/${report.event.user.id}`}
                                        className="group"
                                    >
                                        <div
                                            className={`font-medium ${report.event.user.ipBan
                                                    ? "text-red-500 line-through"
                                                    : "text-gray-300 group-hover:text-white"
                                                }`}
                                        >
                                            {report.event.user.username || "Sin usuario"}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {report.event.user.email}
                                        </div>
                                    </Link>
                                    {report.event.user.ipBan && (
                                        <span className="text-[10px] text-red-500 font-bold">
                                            BANEADO
                                        </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <Link
                                        href={`/admin/users/${report.reporter.id}`}
                                        className="flex items-center gap-2 text-gray-400 hover:text-white"
                                    >
                                        <User size={14} />
                                        {report.reporter.username || "Anon"}
                                    </Link>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex flex-col gap-2 items-end">
                                        <form
                                            action={toggleReportReviewStatus.bind(
                                                null,
                                                report.id,
                                                session?.user?.id!,
                                                !report.isReviewed
                                            )}
                                        >
                                            <button className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 transition-colors border border-white/10 w-full">
                                                {report.isReviewed ? "Reabrir" : "Marcar Revisado"}
                                            </button>
                                        </form>

                                        {!report.event.user.ipBan && (
                                            <form
                                                action={banUserAndDenyEvent.bind(
                                                    null,
                                                    report.event.user.id,
                                                    report.event.id,
                                                    session?.user?.id!
                                                )}
                                            >
                                                <button className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 transition-colors border border-red-500/20 w-full flex items-center justify-center gap-1">
                                                    <Ban size={12} /> Banear + Borrar
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
