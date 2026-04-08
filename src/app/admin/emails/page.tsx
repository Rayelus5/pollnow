import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Mail } from "lucide-react";
import EmailComposer from "@/components/admin/EmailComposer";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== "ADMIN") {
        redirect("/admin");
    }

    const [totalUsers, premiumUsers] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { subscriptionStatus: { not: "free" } } }),
    ]);

    const freeUsers = totalUsers - premiumUsers;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
                        <Mail size={28} className="text-red-400" />
                        Emails masivos
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Redacta y envía correos personalizados a todos los usuarios o a un segmento específico.
                    </p>
                </div>
                <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/30 text-red-400 rounded-full">
                    Solo ADMIN
                </span>
            </div>

            <EmailComposer
                totalUsers={totalUsers}
                premiumUsers={premiumUsers}
                freeUsers={freeUsers}
            />
        </div>
    );
}
