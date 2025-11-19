import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileForm from "@/components/dashboard/ProfileForm";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    // Obtener datos frescos de la DB
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user) redirect("/login");

    const userData = {
        name: user.name,
        username: user.username,
        image: user.image,
        email: user.email,
        hasPassword: !!user.passwordHash, // Boolean para saber si mostrar el form de password
    };

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto">

                <header className="mb-10">
                    <Link href="/dashboard" className="text-sm text-gray-500 hover:text-white mb-2 inline-block">← Volver al Dashboard</Link>
                    <h1 className="text-3xl font-bold text-white">Ajustes de Cuenta</h1>
                    <p className="text-gray-400">Gestiona tu identidad y seguridad.</p>
                </header>

                <ProfileForm user={userData} />

            </div>
        </main>
    );
}