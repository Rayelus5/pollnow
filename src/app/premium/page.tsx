import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, getPlanFromUser } from "@/lib/plans";
import PricingSection from "@/components/premium/PricingSection"; // Importamos el nuevo componente

export const dynamic = "force-dynamic";

export default async function PremiumPage() {
    const session = await auth();

    // Obtenemos el plan actual del usuario
    let currentPlanSlug = PLANS.FREE.slug;

    if (session?.user?.id) {
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (user) {
            const plan = getPlanFromUser(user);
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