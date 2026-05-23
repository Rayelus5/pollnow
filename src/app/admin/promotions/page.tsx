import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPromotionConfig, getRaffles, getAnnouncementBar } from "@/app/lib/promotions-actions";
import PromotionsClient from "@/components/admin/PromotionsClient";
import { getActivePlans } from "@/lib/user-plan";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== "ADMIN") redirect("/admin");

    const [config, raffles, bar, plans] = await Promise.all([
        getPromotionConfig(),
        getRaffles(),
        getAnnouncementBar(),
        getActivePlans(),
    ]);

    // Planes regalables como bono: de pago y no Enterprise (este es manual/vitalicio)
    const bonusPlanOptions = plans
        .filter((p) => p.slug !== "free" && p.slug !== "enterprise")
        .map((p) => ({ value: p.slug, label: p.name }));

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Promociones</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Gestiona bonos de bienvenida, sorteos y la barra de anuncios global.
                </p>
            </div>
            <PromotionsClient
                initialConfig={config}
                initialRaffles={raffles as any}
                initialBar={bar}
                planOptions={bonusPlanOptions}
            />
        </div>
    );
}
