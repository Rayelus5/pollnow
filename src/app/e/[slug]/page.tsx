import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import HomeHero from "@/components/HomeHero"; // Reutilizamos tu componente visual épico

type Props = {
    params: Promise<{ slug: string }>
}

export const dynamic = "force-dynamic";

export default async function EventLobbyPage({ params }: Props) {
    const { slug } = await params;

    // 1. Buscar el evento por SLUG
    const event = await prisma.event.findUnique({
        where: { slug },
        include: {
            // Buscamos la primera encuesta para el botón "Comenzar"
            polls: {
                where: { isPublished: true },
                orderBy: { order: 'asc' },
                take: 1,
                select: { id: true }
            }
        }
    });

    if (!event) notFound();

    // 2. Calcular estado de la Gala
    // Si no tiene fecha definida, asumimos futuro lejano
    const galaDate = event.galaDate || new Date('2030-01-01');
    const now = new Date();
    const isGalaTime = now >= galaDate;

    // 3. Obtener ID de la primera encuesta (si existe)
    const firstPollId = event.polls[0]?.id;

    // 4. Renderizar con el componente visual que ya teníamos
    // (HomeHero necesita adaptarse ligeramente si queremos mostrar el título del evento dinámico,
    // pero por ahora usará "FOTY 2025" hardcoded. Lo arreglaremos luego).
    return (
        <HomeHero 
            firstPollId={firstPollId} 
            isGalaTime={isGalaTime}
            galaDate={galaDate}
            title={event.title}
            description={event.description || ""}
        />
    );
}