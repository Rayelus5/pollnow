import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminLayoutError from "@/components/admin/AdminLayoutError";
import AdminNotifications from "@/components/admin/AdminNotifications";
import {
    LayoutDashboard,
    Users,
    Calendar,
    CheckSquare,
    ShieldAlert,
    LogOut,
    Logs,
    MessageCircleMore,
    Mail,
    Gift,
    CreditCard,
    Bug,
} from "lucide-react";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    // @ts-ignore
    const role = session?.user?.role;

    // Doble check de seguridad en renderizado
    if (!session || (role !== 'ADMIN' && role !== 'MODERATOR')) {
        redirect("/dashboard");
    }

    return (
        <>
            <div className="hidden min-h-screen bg-black text-gray-100 lg:flex font-sans selection:bg-red-900/30">
                {/* SIDEBAR FIJA */}
                <aside className="w-64 2xl:w-80 bg-neutral-900 border-r-2 border-white/10 flex flex-col fixed h-full z-50">
                    <div className="p-6 border-b-2 border-white/10">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <h1 className="font-bold tracking-widest text-white text-sm">ADMIN PANEL</h1>
                        </div>
                    </div>

                    <nav className="h-[80%] p-4 space-y-1 overflow-y-auto">
                        <NavLink href="/admin" icon={<LayoutDashboard size={18} />} label="Dashboard" />

                        <div className="pt-6 pb-2 px-3 text-[10px] font-bold text-gray-600 uppercase tracking-wider">Moderación</div>
                        <NavLink href="/admin/reviews" icon={<CheckSquare size={18} />} label="Solicitudes" highlight />
                        <NavLink href="/admin/reports" icon={<ShieldAlert size={18} />} label="Reportes" />
                        <NavLink href="/admin/bugs" icon={<Bug size={18} />} label="Bugs" />
                        <NavLink href="/admin/chats" icon={<MessageCircleMore size={18} />} label="Chats" />
                        <NavLink href="/admin/logs" icon={<Logs size={18} />} label="Logs" />


                        <div className="pt-6 pb-2 px-3 text-[10px] font-bold text-gray-600 uppercase tracking-wider">Datos</div>
                        <NavLink href="/admin/users" icon={<Users size={18} />} label="Usuarios" />
                        <NavLink href="/admin/events" icon={<Calendar size={18} />} label="Eventos" />

                        {role === 'ADMIN' && (
                            <>
                                <div className="pt-6 pb-2 px-3 text-[10px] font-bold text-gray-600 uppercase tracking-wider">Comunicaciones</div>
                                <NavLink href="/admin/emails" icon={<Mail size={18} />} label="Emails" adminOnly />
                                <div className="pt-6 pb-2 px-3 text-[10px] font-bold text-gray-600 uppercase tracking-wider">Marketing</div>
                                <NavLink href="/admin/promotions" icon={<Gift size={18} />} label="Promociones" adminOnly />
                                <NavLink href="/admin/plans" icon={<CreditCard size={18} />} label="Planes" adminOnly />
                            </>
                        )}

                        <div className="mt-4 absolute top-0 left-50 2xl:left-65 bg-neutral-900/50 backdrop-blur-50 p-2 rounded-full border-2 border-white/20">
                            <AdminNotifications userId={session?.user?.id} />
                        </div>
                    </nav>

                    <div className="h-[20%] p-4 border-t-2 border-white/10">
                        <div className="flex items-center gap-3 px-3 py-3 bg-black/30 rounded-lg mb-2">
                            <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center font-bold text-xs text-white">
                                {session.user.name?.[0] || "A"}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-white truncate">{session.user.name}</p>
                                <p className="text-[10px] text-gray-500 uppercase truncate">{role}</p>
                            </div>
                        </div>
                        <Link href="/" className="flex items-center justify-center gap-2 w-full py-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">
                            <LogOut size={14} /> Salir al sitio
                        </Link>
                    </div>
                </aside>

                {/* CONTENIDO PRINCIPAL */}
                <main className="flex-1 ml-64 p-8 md:p-12 overflow-y-auto">
                    {children}
                </main>
            </div>

            <AdminLayoutError />
        </>
    );
}

function NavLink({ href, icon, label, highlight, adminOnly }: {
    href: string;
    icon: React.ReactNode;
    label: string;
    highlight?: boolean;
    adminOnly?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${highlight
                ? "text-amber-400 hover:bg-amber-400/10 hover:text-amber-300"
                : adminOnly
                ? "text-red-400 hover:bg-red-400/10 hover:text-red-300"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
        >
            {icon}
            <span className="text-sm font-medium">{label}</span>
            {adminOnly && (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-red-500/60 bg-red-500/10 px-1.5 py-0.5 rounded">
                    admin
                </span>
            )}
        </Link>
    )
}