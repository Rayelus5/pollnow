import Link from "next/link";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma"; // <--- Importar prisma
import Image from "next/image";

export default async function Navbar() {
    const session = await auth();
    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // --- CAMBIO CLAVE ---
    // En lugar de confiar en la sesión (que ya no tiene la imagen),
    // buscamos los datos frescos del usuario en la DB si está logueado.
    let userImage = null;
    let userName = session?.user?.name;

    if (session?.user?.id) {
        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { image: true, name: true }
        });
        userImage = dbUser?.image;
        userName = dbUser?.name;
    }
    // --------------------

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

                {/* LOGO */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-sky-300 rounded-lg flex items-center justify-center font-bold text-black group-hover:scale-110 transition-transform">
                        F
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white">FOTY</span>
                </Link>

                {/* MENÚ CENTRAL */}
                <div className="hidden md:flex items-center gap-8">
                    <NavLink href="/">Home</NavLink>
                    <NavLink href="/polls">Polls</NavLink>
                    <NavLink href="/premium">
                        <span className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">Premium</span>
                    </NavLink>
                    <NavLink href="/about">About</NavLink>
                </div>

                {/* ZONA USUARIO */}
                <div className="flex items-center gap-4">
                    {session?.user ? (
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="flex items-center gap-3 p-1 pr-4 rounded-full hover:bg-white/10 transition-colors group">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 relative">
                                    {userImage ? (
                                        <Image src={userImage} alt="Avatar" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                                            {userName?.[0] || "U"}
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-medium text-gray-200 group-hover:text-white">
                                    {userName || "Usuario"}
                                </span>
                            </Link>

                            <form
                                action={async () => {
                                    "use server"
                                    await signOut({ redirectTo: "/" });
                                }}
                            >
                                <button className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 border border-red-500/20 rounded-md hover:bg-red-500/10 transition-colors">
                                    Salir
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                                Entrar
                            </Link>
                            <Link
                                href="/register"
                                className="text-sm font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                Registrarse
                            </Link>
                        </div>
                    )}
                </div>

            </div>
        </nav>
    );
}

function NavLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group"
        >
            {children}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
        </Link>
    )
}