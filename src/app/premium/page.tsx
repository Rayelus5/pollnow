import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, getPlanFromUser } from "@/lib/plans";
import { Check } from "lucide-react";
import CheckoutButton from "@/components/premium/CheckoutButton";
import ManageButton from "@/components/premium/ManageButton"; // <--- Importamos

export default async function PremiumPage() {
  const session = await auth();
  
  // Obtenemos el plan actual del usuario (si está logueado)
  let currentPlanSlug = PLANS.FREE.slug;
  
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user) {
        const plan = getPlanFromUser(user);
        currentPlanSlug = plan.slug;
    }
  }

  return (
    <main className="min-h-screen bg-black text-white pt-20 pb-20 px-6">
      <div className="max-w-7xl mx-auto text-center">
        
        <div className="mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Elige tu nivel de <span className="text-blue-500">Leyenda</span></h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Desbloquea todo el potencial de FOTY. Crea más eventos, invita a más amigos y gestiona múltiples galas simultáneamente.
            </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* PLAN FREE */}
            <PricingCard 
                title="Starter"
                price="0€"
                description="Para probar la experiencia."
                features={["1 Evento Activo", "Votación Anónima", "Resultados Modo Gala", "Publicidad en resultados"]}
                current={currentPlanSlug === 'free'}
            />

            {/* PLAN PREMIUM */}
            <PricingCard 
                title="Premium"
                price="4.99€"
                period="/mes"
                description="Para grupos de amigos activos."
                features={["5 Eventos Activos", "Sin Publicidad", "Soporte Prioritario", "Todo lo de Free"]}
                highlight
                current={currentPlanSlug === 'premium'}
                priceId={PLANS.PREMIUM.priceId}
            />

            {/* PLAN PLUS */}
            <PricingCard 
                title="Unlimited"
                price="12.99€"
                period="/mes"
                description="Para organizadores seriales."
                features={["Eventos ILIMITADOS", "Personalización de URL", "Analíticas Avanzadas", "Todo lo de Premium"]}
                current={currentPlanSlug === 'plus'}
                priceId={PLANS.PLUS.priceId}
            />

        </div>
      </div>
    </main>
  );
}

// Componente de Tarjeta actualizado con lógica de Portal
function PricingCard({ title, price, period = "", description, features, highlight = false, current = false, priceId }: any) {
    return (
        <div className={`relative p-8 rounded-3xl border flex flex-col ${highlight ? 'bg-neutral-900 border-blue-500 shadow-[0_0_50px_-10px_rgba(59,130,246,0.3)] scale-105 z-10' : 'bg-black border-white/10 text-gray-400'}`}>
            
            {highlight && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Más Popular</div>}
            
            <div className="mb-6">
                <h3 className={`text-xl font-bold mb-2 ${highlight ? 'text-white' : ''}`}>{title}</h3>
                <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-4xl font-black ${highlight ? 'text-white' : 'text-gray-200'}`}>{price}</span>
                    <span className="text-sm">{period}</span>
                </div>
                <p className="text-sm mt-4 opacity-80">{description}</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1 text-left text-sm">
                {features.map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-3">
                        <Check size={16} className={highlight ? "text-blue-400" : "text-gray-600"} />
                        {f}
                    </li>
                ))}
            </ul>

            {current ? (
                // SI ES EL PLAN ACTUAL:
                // Si tiene priceId (es de pago) -> Botón Gestionar
                // Si no tiene (es Free) -> Botón estático
                priceId ? (
                    <ManageButton />
                ) : (
                    <div className="w-full py-3 rounded-xl font-bold border border-green-500/50 text-green-400 bg-green-500/10 cursor-default">
                        Plan Actual
                    </div>
                )
            ) : priceId ? (
                <CheckoutButton priceId={priceId} highlight={highlight} />
            ) : (
                <button className="w-full py-3 rounded-xl font-bold border border-white/20 hover:bg-white/5 transition-colors">
                    Comenzar Gratis
                </button>
            )}
        </div>
    )
}