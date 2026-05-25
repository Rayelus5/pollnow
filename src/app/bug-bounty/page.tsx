import { auth } from "@/auth";
import Link from "next/link";
import { Bug, ShieldCheck, ShieldAlert, LogIn, CheckCircle2, XCircle } from "lucide-react";
import BugBountyForm from "@/components/BugBountyForm";
import SideRailAds from "@/components/ads/SideRailAds";
import { getCurrentUserPlan } from "@/lib/user-plan";

export const metadata = {
    title: "Bug Bounty · Pollnow",
    description: "Reporta errores y vulnerabilidades en Pollnow y recibe recompensas.",
};

const SEVERITIES = [
    { dot: "#3b82f6", name: "Baja", desc: "Errores visuales, textos incorrectos, UX mejorable", reward: "Suscripción Premium de 7 días" },
    { dot: "#eab308", name: "Media", desc: "Funcionalidad rota que no compromete datos", reward: "Suscripción Plus de 15 días" },
    { dot: "#f97316", name: "Alta", desc: "Error que afecta a múltiples usuarios o flujos clave", reward: "Suscripción Unlimited de 15 días" },
    { dot: "#ef4444", name: "Crítica", desc: "Vulnerabilidad de seguridad, pérdida de datos, acceso no autorizado", reward: "Depende de la vulnerabilidad" },
];

const ELIGIBLE = [
    "Vulnerabilidades de seguridad (XSS, acceso no autorizado, fuga de datos)",
    "Funcionalidad rota en flujos clave (votación, creación de eventos, pagos)",
    "Errores que afectan a múltiples usuarios",
    "Fallos de cálculo o pérdida de datos",
];
const NOT_ELIGIBLE = [
    "Bugs ya conocidos o reportados previamente",
    "Problemas de servicios de terceros ajenos a Pollnow",
    "Ataques de fuerza bruta, spam o denegación de servicio (DoS)",
    "Ingeniería social o phishing a usuarios/empleados",
];

export default async function BugBountyPage() {
    const session = await auth();
    const isAuthed = !!session?.user;

    const plan = await getCurrentUserPlan();
    const showAds = plan.slug === "free" || plan.slug === "premium";

    return (
        <main className="min-h-screen bg-black text-white">
            {/* Fondo ambiental */}
            <div className="relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-sky-900/10 rounded-full blur-[120px] pointer-events-none" />

                <SideRailAds showAds={showAds}>
                <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-12">
                    {/* Hero */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-mono uppercase tracking-widest mb-6">
                            <Bug size={14} /> Programa Bug Bounty
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                            Ayúdanos a mejorar Pollnow
                        </h1>
                        <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Si encuentras un error o una vulnerabilidad, repórtalo de forma responsable.
                            Recompensamos los reportes válidos según su severidad e impacto.
                        </p>
                        <a
                            href="#reportar"
                            className="inline-block mt-8 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-all"
                        >
                            Reportar un bug
                        </a>
                    </div>

                    {/* Tabla de recompensas */}
                    <section className="mb-16">
                        <h2 className="text-2xl font-bold mb-6 text-center">Recompensas por severidad</h2>
                        <div className="bg-neutral-900/50 border-2 border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 font-medium">Severidad</th>
                                        <th className="p-4 font-medium">Descripción</th>
                                        <th className="p-4 font-medium text-right">Recompensa</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {SEVERITIES.map((s) => (
                                        <tr key={s.name} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-2 font-bold text-white">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.dot }} />
                                                    {s.name}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-300">{s.desc}</td>
                                            <td className="p-4 text-right text-gray-400 whitespace-nowrap">{s.reward}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Qué se recompensa y qué no */}
                    <section className="grid md:grid-cols-2 gap-6 mb-16">
                        <div className="bg-neutral-900/50 border-2 border-green-500/20 rounded-2xl p-6">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-green-400 mb-4">
                                <CheckCircle2 size={20} /> Qué recompensamos
                            </h3>
                            <ul className="space-y-2.5">
                                {ELIGIBLE.map((t) => (
                                    <li key={t} className="flex gap-2 text-sm text-gray-300">
                                        <span className="text-green-500 mt-0.5">✓</span> {t}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-neutral-900/50 border-2 border-red-500/20 rounded-2xl p-6">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-red-400 mb-4">
                                <XCircle size={20} /> Qué no entra
                            </h3>
                            <ul className="space-y-2.5">
                                {NOT_ELIGIBLE.map((t) => (
                                    <li key={t} className="flex gap-2 text-sm text-gray-300">
                                        <span className="text-red-500 mt-0.5">✕</span> {t}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* Nota legal */}
                    <div className="flex items-start gap-3 p-4 mb-16 rounded-xl border-2 border-amber-500/20 bg-amber-500/5 text-amber-200/90 text-sm">
                        <ShieldAlert size={20} className="text-amber-400 shrink-0 mt-0.5" />
                        <p>
                            <strong className="text-amber-300">Divulgación responsable.</strong> Las vulnerabilidades de
                            seguridad deben reportarse de forma privada a través de este formulario. No las explotes, no
                            accedas a datos de otros usuarios ni las hagas públicas antes de que las hayamos corregido.
                        </p>
                    </div>

                    {/* Formulario / banner login */}
                    <section id="reportar" className="scroll-mt-24">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">Reportar un bug</h2>
                            <p className="text-gray-400 text-sm">Rellena el formulario con el máximo detalle posible.</p>
                        </div>

                        <div className="max-w-xl mx-auto bg-neutral-900/50 border-2 border-white/15 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
                            {isAuthed ? (
                                <BugBountyForm />
                            ) : (
                                <div className="text-center space-y-6 py-6">
                                    <div className="w-16 h-16 bg-blue-500/15 rounded-full flex items-center justify-center mx-auto text-blue-400">
                                        <LogIn size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">Inicia sesión para reportar</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            Necesitas una cuenta para enviar reportes y poder recibir recompensas.
                                            Así podemos contactarte si tu reporte es elegible.
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <Link href="/login?callbackUrl=/bug-bounty" className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors">
                                            Iniciar sesión
                                        </Link>
                                        <Link href="/register" className="bg-white/5 border-2 border-white/15 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
                                            Crear cuenta
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="flex items-center justify-center gap-2 text-gray-500 text-xs mt-6">
                            <ShieldCheck size={14} /> Tus reportes se tratan de forma confidencial.
                        </p>
                    </section>
                </div>
                </SideRailAds>
            </div>
        </main>
    );
}
