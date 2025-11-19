import { prisma } from "@/lib/prisma";
import { GALA_DATE } from "@/lib/config";
import { redirect } from "next/navigation";
import GlobalResultsClient from "@/components/GlobalResultsClient";

export const dynamic = "force-dynamic";

export default async function GlobalResultsPage() {
    // 1. Seguridad
    if (new Date() < GALA_DATE) {
        redirect("/");
    }

    // 2. Obtener datos
    const polls = await prisma.poll.findMany({
        where: { isPublished: true },
        // CAMBIO AQUÍ: Ordenar por 'order'
        orderBy: { order: 'asc' },
        select: { id: true, title: true }
    });

    // 3. Renderizar Cliente
    return <GlobalResultsClient polls={polls} />;
}