"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Trophy, Code2, Lightbulb, Repeat2, Award, Heart,
    CheckCircle2, ArrowRight, ChevronDown, ChevronUp,
    Building2, Sparkles, Users, Zap, ShieldCheck, Headphones,
    Star, ExternalLink, Mail,
} from "lucide-react";

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = {
    visible: { transition: { staggerChildren: 0.1 } },
};

const USE_CASES = [
    { icon: <Trophy size={22} className="text-amber-400" />, title: "Empleado del trimestre", desc: "Reconoce a quien más ha destacado con votación anónima de todo el equipo." },
    { icon: <Code2 size={22} className="text-blue-400" />, title: "Mejor PR del sprint", desc: "Gamifica las revisiones de código y premia la calidad técnica." },
    { icon: <Lightbulb size={22} className="text-yellow-400" />, title: "Hackathon interno", desc: "Que el propio equipo vote al proyecto más innovador de vuestra competición." },
    { icon: <Repeat2 size={22} className="text-green-400" />, title: "Retrospectiva gamificada", desc: "Convierte la retro del sprint en una experiencia dinámica y participativa." },
    { icon: <Award size={22} className="text-violet-400" />, title: "Premios anuales", desc: "Gala de fin de año con categorías, nominados y resultados en tiempo real." },
    { icon: <Heart size={22} className="text-red-400" />, title: "Premios de valores", desc: "Vota quién mejor encarna los valores de la empresa. Cultura viva." },
];

const STEPS = [
    { n: "01", title: "Crea tu evento", desc: "Define el nombre, las categorías y añade a los nominados en minutos." },
    { n: "02", title: "Invita a tu equipo", desc: "Comparte el enlace privado. Sin registro obligatorio para votar." },
    { n: "03", title: "Celebra los resultados", desc: "Los resultados aparecen al comenzar la gala. Máxima emoción garantizada." },
];

const FEATURES = [
    "Eventos ilimitados",
    "Hasta 1000 nominados por evento",
    "Hasta 50 categorías por evento",
    "Hasta 30 colaboradores por evento",
    "Votación anónima opcional",
    "Resultados en tiempo real",
    "Enlace privado con clave de acceso",
    "Panel de estadísticas avanzado",
    "Colaboradores en el evento",
    "Soporte prioritario por email",
];

const FAQ = [
    { q: "¿Cuántos usuarios incluye la licencia?", a: "La licencia es para una cuenta Enterprise. Puedes invitar colaboradores a tus eventos para que te ayuden a crearlos (hasta 30 por evento) sin coste adicional. Los votantes no necesitan cuenta." },
    { q: "¿Pueden votar empleados sin cuenta en POLLNOW?", a: "Sí. Los votantes acceden al evento mediante un enlace (público o con clave privada) y votan sin necesidad de registrarse." },
    { q: "¿El pago es recurrente?", a: "No. La licencia corporativa es un pago único de 499 €. No hay cuotas mensuales ni anuales." },
    { q: "¿Qué incluye el soporte prioritario?", a: "Respuesta en menos de 24h por email, asistencia en la configuración inicial de tu primer evento y acceso a mejoras antes del lanzamiento público." },
    { q: "¿Puedo probar la plataforma antes de comprar?", a: "Por supuesto. Puedes crear una cuenta gratuita y explorar la plataforma. El plan Free permite crear 1 evento completo para que veas todo el flujo." },
    { q: "¿Qué pasa si necesito funcionalidades que POLLNOW no ofrece?", a: "Tenemos una opción de negociación privada para empresas que requieran integraciones, diseño personalizado o funcionalidades a medida. Contáctanos y lo hablamos." },
];

export default function EmpresasPage({ demoUrl }: { demoUrl: string }) {
    return (
        <main className="bg-black text-white min-h-screen">
            <Hero demoUrl={demoUrl} />
            <UseCases />
            <HowItWorks />
            <WhatsIncluded />
            <Pricing />
            <PrivateNegotiation />
            <FAQSection />
            <FinalCTA demoUrl={demoUrl} />
        </main>
    );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ demoUrl }: { demoUrl: string }) {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-24 overflow-hidden">
            {/* Gradient bg */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-orange-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-red-900/15 rounded-full blur-[120px]" />
                <div className="absolute top-[30%] left-[-5%] w-[400px] h-[400px] bg-amber-900/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="relative z-10 max-w-4xl mx-auto text-center"
            >
                <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 text-xs font-bold uppercase tracking-wider mb-8">
                    <Building2 size={12} /> POLLNOW para Empresas
                </motion.div>

                <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl lg:text-8xl font-black mb-6 leading-22 tracking-tighter">
                    Potencia el{" "}
                    <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                        reconocimiento
                    </span>
                    <br />en tu equipo
                </motion.h1>

                <motion.p variants={fadeUp} className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Crea galas de premios internas para tu empresa.
                    Tu equipo merece algo mejor que un formulario de Google.
                </motion.p>

                <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href={demoUrl}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold text-base rounded-2xl transition-all shadow-2xl shadow-orange-900/30 hover:shadow-orange-900/50"
                    >
                        <ExternalLink size={18} /> Ver Demo
                    </Link>
                    <a
                        href="#pricing"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border-2 border-white/15 hover:border-white/25 text-white font-bold text-base rounded-2xl transition-all"
                    >
                        Solicitar licencia <ArrowRight size={18} />
                    </a>
                </motion.div>
            </motion.div>
        </section>
    );
}

// ─── Use Cases ────────────────────────────────────────────────────────────────

function UseCases() {
    return (
        <section className="px-6 py-20 max-w-6xl mx-auto">
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <motion.div variants={fadeUp} className="text-center mb-14">
                    <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Casos de uso</span>
                    <h2 className="text-3xl md:text-4xl font-black mt-3">¿Para qué lo usan los equipos?</h2>
                    <p className="text-gray-500 mt-3 max-w-xl mx-auto">Desde startups de 10 personas hasta empresas con más de 500. POLLNOW se adapta a cualquier tipo de reconocimiento interno.</p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {USE_CASES.map((c) => (
                        <motion.div
                            key={c.title}
                            variants={fadeUp}
                            className="bg-neutral-900 border-2 border-white/8 rounded-2xl p-6 hover:border-white/15 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                {c.icon}
                            </div>
                            <h3 className="font-bold text-white mb-2">{c.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{c.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
    return (
        <section className="px-6 py-20 bg-neutral-950/60 border-y border-white/5">
            <div className="max-w-4xl mx-auto">
                <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <motion.div variants={fadeUp} className="text-center mb-14">
                        <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Así de fácil</span>
                        <h2 className="text-3xl md:text-4xl font-black mt-3">De cero a gala en 10 minutos</h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {STEPS.map((s, i) => (
                            <motion.div key={s.n} variants={fadeUp} className="text-center">
                                <div className="text-5xl font-black text-white/10 mb-4">{s.n}</div>
                                <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                                {i < STEPS.length - 1 && (
                                    <div className="hidden md:block absolute mt-[-2rem] ml-[calc(100%-1rem)] text-white/20">
                                        <ArrowRight size={20} />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ─── What's included ──────────────────────────────────────────────────────────

function WhatsIncluded() {
    return (
        <section className="px-6 py-20 max-w-4xl mx-auto">
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <motion.div variants={fadeUp} className="text-center mb-12">
                    <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Plan Business Enterprise</span>
                    <h2 className="text-3xl md:text-4xl font-black mt-3">Todo lo que incluye tu licencia</h2>
                </motion.div>

                <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {FEATURES.map((f) => (
                        <div key={f} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/60 border border-white/5">
                            <CheckCircle2 size={16} className="text-orange-400 shrink-0" />
                            <span className="text-sm text-gray-300">{f}</span>
                        </div>
                    ))}
                    {/* Extra items */}
                    {[
                        "Soporte prioritario",
                        "Negociación privada disponible",
                    ].map((f) => (
                        <div key={f} className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
                            <Star size={16} className="text-orange-400 shrink-0" />
                            <span className="text-sm text-orange-200" dangerouslySetInnerHTML={{ __html: f }} />
                        </div>
                    ))}
                </motion.div>
            </motion.div>
        </section>
    );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function Pricing() {
    return (
        <section id="pricing" className="px-6 py-20 bg-neutral-950/60 border-y border-white/5">
            <div className="max-w-2xl mx-auto">
                <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <motion.div variants={fadeUp} className="text-center mb-10">
                        <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Precios</span>
                        <h2 className="text-3xl md:text-4xl font-black mt-3">Sin sorpresas. Sin suscripciones.</h2>
                        <p className="text-gray-500 mt-3">Un único pago. Acceso de por vida.</p>
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        className="relative bg-neutral-900 border-2 border-orange-500/40 rounded-3xl p-8 shadow-2xl shadow-orange-900/20 overflow-hidden"
                    >
                        {/* Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/15 border border-orange-500/30 rounded-full text-orange-300 text-xs font-bold mb-3">
                                        <Sparkles size={10} /> Licencia Corporativa
                                    </div>
                                    <h3 className="text-2xl font-black text-white">Plan Business Enterprise</h3>
                                    <p className="text-gray-500 text-sm mt-1">Para equipos que quieren lo mejor de lo mejor de forma permanente.</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-black text-white">499 <span className="text-2xl">€</span></div>
                                    <div className="text-xs text-gray-500 mt-1">pago único · sin IVA</div>
                                </div>
                            </div>

                            <div className="space-y-2 mb-8">
                                {[
                                    "Cuenta Enterprise para 1 usuario",
                                    "Eventos y categorías ilimitados",
                                    "Soporte prioritario incluido",
                                    "Ayuda en la creación de tus eventos",
                                    "Sin cuotas mensuales ni anuales",
                                    "Actualizaciones incluidas de por vida",
                                    "Y mucho más...",
                                ].map(f => (
                                    <div key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                                        <CheckCircle2 size={14} className="text-orange-400 shrink-0" />
                                        {f}
                                    </div>
                                ))}
                            </div>

                            <a
                                href={"http://www.pollnow.es/about#contact"}
                                className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-orange-900/30"
                            >
                                <Mail size={18} /> Solicitar licencia
                            </a>

                            <p className="text-center text-xs text-gray-600 mt-4">
                                Te responderemos en menos de 24h con los detalles del pago y la activación.
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

// ─── Private Negotiation ─────────────────────────────────────────────────────

function PrivateNegotiation() {
    return (
        <section className="px-6 py-20 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-neutral-900 to-neutral-900/60 border-2 border-white/10 rounded-3xl p-10 text-center relative overflow-hidden"
            >
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-[30%] w-80 h-80 bg-violet-900/15 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-[20%] w-60 h-60 bg-blue-900/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
                        <ShieldCheck size={24} className="text-violet-400" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black mb-3">¿Necesitas algo a medida?</h2>
                    <p className="text-gray-400 max-w-xl mx-auto mb-3 leading-relaxed">
                        Si tu empresa necesita integraciones con herramientas internas, diseño personalizado,
                        funcionalidades específicas o un acuerdo para varios departamentos, podemos
                        sentarnos a hablar y diseñar una solución que encaje perfectamente.
                    </p>
                    <p className="text-sm text-gray-600 mb-8">
                        Negociación privada disponible · Acuerdo/contrato a medida · SLA garantizado
                    </p>
                    <a
                        href={"http://www.pollnow.es/about#contact"}
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-all"
                    >
                        <Mail size={16} /> Hablemos
                    </a>
                </div>
            </motion.div>
        </section>
    );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function FAQSection() {
    return (
        <section className="px-6 py-20 bg-neutral-950/60 border-t border-white/5">
            <div className="max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <span className="text-xs font-bold uppercase tracking-widest text-orange-400">FAQ</span>
                    <h2 className="text-3xl font-black mt-3">Preguntas frecuentes</h2>
                </motion.div>
                <div className="space-y-2">
                    {FAQ.map((item, i) => <FAQItem key={i} {...item} />)}
                </div>
            </div>
        </section>
    );
}

function FAQItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-neutral-900 border-2 border-white/8 rounded-xl overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-white hover:text-orange-300 transition-colors cursor-pointer gap-4"
            >
                {q}
                {open ? <ChevronUp size={16} className="shrink-0 text-orange-400" /> : <ChevronDown size={16} className="shrink-0 text-gray-500" />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <p className="px-5 pb-4 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                            {a}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA({ demoUrl }: { demoUrl: string }) {

    return (
        <section className="px-6 py-24">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl mx-auto text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 text-xs font-bold uppercase tracking-wider mb-6">
                    <Zap size={12} /> ¿Listo para empezar?
                </div>
                <h2 className="text-4xl md:text-5xl font-black mb-5">
                    Tu equipo se lo merece
                </h2>
                <p className="text-gray-500 text-lg mb-10">
                    Prueba la demo, habla con nosotros, o empieza hoy mismo con la licencia corporativa.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href={demoUrl}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold text-base rounded-2xl transition-all shadow-xl shadow-orange-900/20"
                    >
                        <ExternalLink size={18} /> Ver Demo
                    </Link>
                    <a
                        href={"http://www.pollnow.es/about#contact"}
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border-2 border-white/15 hover:border-orange-500/30 text-white font-bold text-base rounded-2xl transition-all"
                    >
                        <Mail size={18} /> Solicitar licencia — 499 €
                    </a>
                </div>
            </motion.div>
        </section>
    );
}
