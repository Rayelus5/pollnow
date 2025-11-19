import { prisma } from "@/lib/prisma";
import { GALA_DATE } from "@/lib/config";
import Link from "next/link";
import Countdown from "@/components/Countdown"; // Reutilizamos tu componente, luego lo estilazaremos mejor
import HomeHero from "@/components/HomeHero";

export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. Buscar la PRIMERA encuesta para iniciar el flujo
  // Asumimos que el orden de creación define el orden de la gala
  const firstPoll = await prisma.poll.findFirst({
    orderBy: { order: 'asc' }, 
    where: { isPublished: true }
  });

  const now = new Date();
  const isGalaTime = now >= GALA_DATE;

  return (
    <HomeHero 
      firstPollId={firstPoll?.id} 
      isGalaTime={isGalaTime}
      galaDate={GALA_DATE}
    />
    
  );
}