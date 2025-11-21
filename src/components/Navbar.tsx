import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import NavbarClient from "@/components/NavbarClient";

export default async function Navbar() {
    const session = await auth();

    // Obtenemos datos frescos del usuario si existe sesión
    let userData = null;

    if (session?.user?.id) {
        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, image: true }
        });

        if (dbUser) {
            userData = {
                name: dbUser.name,
                image: dbUser.image
            };
        }
    }

    // Pasamos los datos al componente cliente que maneja la UI y el menú móvil
    return <NavbarClient user={userData} />;
}