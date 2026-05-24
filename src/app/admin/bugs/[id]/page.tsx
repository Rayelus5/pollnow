import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink, Calendar } from "lucide-react";
import { SEVERITY_BADGE, SEVERITY_LABEL } from "@/components/admin/bugBadges";
import BugDetailClient from "@/components/admin/BugDetailClient";

export const dynamic = "force-dynamic";

export default async function AdminBugDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
        redirect("/");
    }

    const { id } = await params;
    const report = await prisma.bugReport.findUnique({
        where: { id },
        include: { user: { select: { id: true, name: true, username: true, email: true } } },
    });

    if (!report) notFound();

    return (
        <div className="max-w-4xl mx-auto">
            <Link href="/admin/bugs" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
                <ArrowLeft size={16} /> Volver a Bugs
            </Link>

            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className={SEVERITY_BADGE[report.severity]}>{SEVERITY_LABEL[report.severity]}</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={11} /> {format(report.createdAt, "dd/MM/yyyy HH:mm")}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">{report.title}</h1>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Datos del reporte */}
                <div className="md:col-span-2 space-y-5">
                    <div className="bg-neutral-900 border-2 border-white/10 rounded-xl p-5">
                        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Página</h3>
                        <a href={report.pageUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm break-all inline-flex items-center gap-1">
                            {report.pageUrl} <ExternalLink size={12} />
                        </a>
                    </div>

                    <div className="bg-neutral-900 border-2 border-white/10 rounded-xl p-5">
                        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Descripción</h3>
                        <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{report.description}</p>
                    </div>

                    {report.screenshotUrl && (
                        <div className="bg-neutral-900 border-2 border-white/10 rounded-xl p-5">
                            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3">Captura</h3>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <a href={report.screenshotUrl} target="_blank" rel="noreferrer">
                                <img src={report.screenshotUrl} alt={`Captura del reporte: ${report.title}`} className="rounded-lg border-2 border-white/10 max-h-96 w-auto" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Usuario */}
                <div className="space-y-5">
                    <div className="bg-neutral-900 border-2 border-white/10 rounded-xl p-5">
                        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-3">Reportado por</h3>
                        <p className="text-white font-medium">{report.user.name}</p>
                        <p className="text-xs text-gray-500 mb-3">{report.user.email}</p>
                        <Link href={`/admin/users/${report.user.id}`} className="text-blue-400 text-xs hover:underline">
                            Ver perfil del usuario →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Gestión (cliente) */}
            <div className="mt-6">
                <BugDetailClient
                    id={report.id}
                    initialStatus={report.status}
                    initialNotes={report.adminNotes ?? ""}
                />
            </div>
        </div>
    );
}
