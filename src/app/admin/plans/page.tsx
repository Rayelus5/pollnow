import { prisma } from "@/lib/prisma";
import AdminPlansManager, { type AdminPlan } from "@/components/admin/AdminPlansManager";

export const dynamic = "force-dynamic";

export default async function AdminPlansPage() {
    const plans = await prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: "asc" } });

    // Conteo de usuarios activos por priceId (para avisar antes de eliminar)
    const priceIds = plans.map((p) => p.stripePriceId).filter((x): x is string => !!x);
    const userCounts = priceIds.length
        ? await prisma.user.groupBy({
              by: ["stripePriceId"],
              where: { stripePriceId: { in: priceIds } },
              _count: { _all: true },
          })
        : [];
    const countByPriceId = new Map(userCounts.map((u) => [u.stripePriceId, u._count._all]));

    const serialized: AdminPlan[] = plans.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        quota: p.quota,
        price: p.price,
        stripePriceId: p.stripePriceId,
        isActive: p.isActive,
        sortOrder: p.sortOrder,
        limits: (p.limits ?? {}) as AdminPlan["limits"],
        features: (p.features ?? {}) as Record<string, unknown>,
        userCount: p.stripePriceId ? countByPriceId.get(p.stripePriceId) ?? 0 : 0,
    }));

    return (
        <div className="max-w-5xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">Planes de suscripción</h1>
                <p className="text-gray-400">
                    Edita límites y precios. Los cambios se reflejan al instante (caché invalidada), sin redeploy.
                </p>
            </header>
            <AdminPlansManager initialPlans={serialized} />
        </div>
    );
}
