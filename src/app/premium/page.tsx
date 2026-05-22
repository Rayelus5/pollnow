import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import { getPlanFromUser } from "@/lib/user-plan";
import PricingSection from "@/components/premium/PricingSection"; // Importamos el nuevo componente
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Premium — Planes y precios",
    description:
        "Mejora tu plan de Pollnow: más eventos, categorías, nominados y colaboradores. Planes Premium, Plus y Unlimited para llevar tus galas al siguiente nivel.",
    alternates: { canonical: "https://pollnow.es/premium" },
    openGraph: {
        url: "https://pollnow.es/premium",
        title: "Pollnow Premium — Planes y precios",
        description: "Desbloquea más eventos, categorías y colaboradores con los planes de pago de Pollnow.",
    },
};

export default async function PremiumPage() {
    const session = await auth();

    // Obtenemos el plan actual del usuario
    let currentPlanSlug = PLANS.FREE.slug;

    if (session?.user?.id) {
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (user) {
            const plan = await getPlanFromUser(user);
            currentPlanSlug = plan.slug;
        }
    }

    return (
        <main className="min-h-screen bg-black text-white pt-24 pb-20 px-6 overflow-hidden relative">

            {/* Fondo Ambiental Global */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-900/10 rounded-[100%] blur-[120px] pointer-events-none" />

            {/* Componente Cliente con Animaciones */}
            <PricingSection currentPlanSlug={currentPlanSlug} />

        </main>
    );
}