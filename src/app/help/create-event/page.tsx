import Link from "next/link";
import {
    Gamepad2, Trophy, Users, BarChart3, Share2, Star,
    ArrowRight, CheckCircle, Lightbulb, Sparkles, Play,
    Plus, Settings, Crown, Music, Sword, Heart
} from "lucide-react";

export const metadata = {
    title: "Cómo crear un evento – POLLNOW",
    description: "Aprende a crear tu primera gala en POLLNOW con este tutorial paso a paso.",
};

// ─── Example data ─────────────────────────────────────────────────────────────

const EXAMPLE_NOMINEES = [
    { name: "Elden Ring", studio: "FromSoftware", emoji: "⚔️", color: "from-amber-600 to-orange-600" },
    { name: "God of War Ragnarök", studio: "Santa Monica", emoji: "🪓", color: "from-blue-600 to-cyan-600" },
    { name: "Zelda: Tears of the Kingdom", studio: "Nintendo", emoji: "🗡️", color: "from-green-600 to-emerald-600" },
    { name: "Cyberpunk 2077: PL", studio: "CD Projekt RED", emoji: "🤖", color: "from-yellow-500 to-amber-500" },
    { name: "Baldur's Gate 3", studio: "Larian Studios", emoji: "🐉", color: "from-purple-600 to-violet-600" },
    { name: "Alan Wake 2", studio: "Remedy", emoji: "🔦", color: "from-red-700 to-rose-600" },
];

const EXAMPLE_CATEGORIES = [
    { name: "Juego del Año", icon: <Trophy size={16} />, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
    { name: "Mejor Narrativa", icon: <Heart size={16} />, color: "text-pink-400", bg: "bg-pink-400/10 border-pink-400/20" },
    { name: "Mejor Banda Sonora", icon: <Music size={16} />, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
    { name: "Mejor Combate", icon: <Sword size={16} />, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
    { name: "Mejor RPG", icon: <Crown size={16} />, color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/20" },
    { name: "Mejor Indie", icon: <Star size={16} />, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
];

const STEPS = [
    {
        number: "01",
        icon: <Plus size={22} />,
        color: "from-blue-500 to-cyan-500",
        borderColor: "border-blue-500/20",
        bgColor: "bg-blue-500/5",
        title: "Crea tu evento",
        subtitle: "Dale nombre, descripción y fecha a tu gala",
        description:
            "En tu panel de control, haz clic en «Nuevo Evento». Pon un nombre claro y descriptivo: en este ejemplo, «Premios Videojuegos del Año». Añade una descripción breve que explique el propósito de tu gala.",
        tips: [
            "El nombre puede tener hasta 40 caracteres.",
            "La descripción es opcional pero ayuda a los votantes.",
            "Puedes dejarlo en privado hasta que esté listo.",
        ],
    },
    {
        number: "02",
        icon: <Users size={22} />,
        color: "from-violet-500 to-purple-600",
        borderColor: "border-violet-500/20",
        bgColor: "bg-violet-500/5",
        title: "Añade los nominados",
        subtitle: "Las personas, equipos u obras que compiten",
        description:
            "Ve a la pestaña «Nominados» dentro de tu evento. Añade cada candidato con su nombre y una foto. Puedes subir imágenes manualmente, pegar una URL, o usar la IA para generarlas automáticamente con una descripción.",
        tips: [
            "Usa la generación con IA para crear imágenes únicas.",
            "El límite de nominados depende de tu plan.",
            "Los nominados se asignan después a las categorías.",
        ],
    },
    {
        number: "03",
        icon: <Settings size={22} />,
        color: "from-emerald-500 to-green-600",
        borderColor: "border-emerald-500/20",
        bgColor: "bg-emerald-500/5",
        title: "Crea las categorías",
        subtitle: "Las secciones sobre las que se vota",
        description:
            "En la pestaña «Categorías» defines las distintas áreas de votación. Cada categoría puede tener su propio tipo de voto (un único ganador, podio de 3, etc.) y los nominados que participan en ella.",
        tips: [
            "Puedes tener diferentes nominados por categoría.",
            "Activa/desactiva cada categoría cuando quieras.",
            "El límite de categorías depende de tu plan.",
        ],
    },
    {
        number: "04",
        icon: <Share2 size={22} />,
        color: "from-orange-500 to-amber-500",
        borderColor: "border-orange-500/20",
        bgColor: "bg-orange-500/5",
        title: "Comparte el enlace de voto",
        subtitle: "Invita a tu audiencia a participar",
        description:
            "Una vez configurado, activa la votación desde los ajustes del evento. Se generará un enlace único que puedes compartir por WhatsApp, Discord, redes sociales o donde quieras. Los votantes no necesitan cuenta.",
        tips: [
            "Puedes activar y desactivar la votación en tiempo real.",
            "El sistema anti-duplicados protege la integridad.",
            "Los votos son anónimos por defecto.",
        ],
    },
    {
        number: "05",
        icon: <BarChart3 size={22} />,
        color: "from-pink-500 to-rose-600",
        borderColor: "border-pink-500/20",
        bgColor: "bg-pink-500/5",
        title: "Sigue los resultados en vivo",
        subtitle: "Estadísticas y ganadores en tiempo real",
        description:
            "La pestaña «Estadísticas» muestra en tiempo real quién va ganando en cada categoría, el total de votos, la distribución por nominado y más datos. Puedes activar el «Modo Gala» para presentar los resultados de forma dramática.",
        tips: [
            "El Modo Gala revela ganadores uno a uno.",
            "Las estadísticas avanzadas están en planes superiores.",
            "Puedes exportar resultados al terminar.",
        ],
    },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateEventTutorialPage() {
    return (
        <main className="min-h-screen bg-black text-white">
            {/* ── Hero ──────────────────────────────────────────────── */}
            <section className="relative overflow-hidden py-20 px-6">
                {/* Background glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-violet-600/10 to-transparent rounded-full blur-3xl" />
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider mb-6">
                        <Gamepad2 size={12} /> Tutorial
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black leading-tight mb-5">
                        Cómo crear tu primera{" "}
                        <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                            gala en POLLNOW
                        </span>
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
                        En este tutorial crearemos juntos los{" "}
                        <strong className="text-white">Premios Videojuegos del Año</strong>:
                        nominados, categorías, votación y resultados en directo. Todo el proceso, paso a paso.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            href="/dashboard?tab=events&tour=create"
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-full font-bold text-white transition-all shadow-lg shadow-violet-900/30"
                        >
                            <Play size={16} fill="currentColor" /> Iniciar tour guiado
                        </Link>
                        <Link
                            href="/dashboard?tab=events"
                            className="flex items-center gap-2 px-6 py-3 border-2 border-white/10 hover:border-white/20 rounded-full font-bold text-gray-300 hover:text-white transition-all"
                        >
                            Ir al dashboard <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Overview: what we'll build ───────────────────────── */}
            <section className="py-12 px-6 bg-neutral-950/50 border-y border-white/5">
                <div className="max-w-5xl mx-auto">
                    <p className="text-center text-xs font-bold text-gray-600 uppercase tracking-wider mb-6">
                        Lo que crearemos juntos
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { icon: "🎮", label: "Evento", value: "Premios Videojuegos del Año", desc: "Nombre, descripción y configuración" },
                            { icon: "🕹️", label: "Nominados", value: "6 juegos icónicos", desc: "Con imágenes y datos de cada uno" },
                            { icon: "🏆", label: "Categorías", value: "6 premios distintos", desc: "GOTY, Banda Sonora, Narrativa…" },
                        ].map(item => (
                            <div key={item.label} className="bg-neutral-900 border border-white/8 rounded-2xl p-4 text-center">
                                <div className="text-3xl mb-2">{item.icon}</div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                                <p className="font-bold text-white">{item.value}</p>
                                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Steps ──────────────────────────────────────────────── */}
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto space-y-8">
                    {STEPS.map((step, i) => (
                        <div key={i} className={`rounded-2xl border ${step.borderColor} ${step.bgColor} overflow-hidden`}>
                            <div className="p-6 md:p-8">
                                <div className="flex items-start gap-5">
                                    {/* Number + icon */}
                                    <div className="shrink-0">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                                            {step.icon}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-[10px] font-black text-gray-600 tracking-widest">
                                                PASO {step.number}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-bold text-white mb-1">{step.title}</h2>
                                        <p className="text-sm text-gray-400 mb-4">{step.subtitle}</p>
                                        <p className="text-sm text-gray-300 leading-relaxed mb-5">
                                            {step.description}
                                        </p>

                                        {/* Tips */}
                                        <div className="space-y-2">
                                            {step.tips.map((tip, j) => (
                                                <div key={j} className="flex items-start gap-2">
                                                    <CheckCircle size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                                                    <span className="text-xs text-gray-400">{tip}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step-specific visual examples */}
                            {i === 0 && (
                                <div className="border-t border-white/5 bg-black/20 p-5">
                                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3 font-bold">
                                        Ejemplo de formulario
                                    </p>
                                    <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 max-w-md space-y-3">
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase mb-1">Nombre del evento</p>
                                            <div className="bg-black border border-white/15 rounded px-3 py-2 text-sm text-white font-medium">
                                                Premios Videojuegos del Año
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase mb-1">Descripción</p>
                                            <div className="bg-black border border-white/15 rounded px-3 py-2 text-sm text-gray-400">
                                                ¿Cuál fue el mejor juego del año? Vota con tus amigos y descúbrelo.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {i === 1 && (
                                <div className="border-t border-white/5 bg-black/20 p-5">
                                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3 font-bold">
                                        Nominados de ejemplo
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {EXAMPLE_NOMINEES.map(nominee => (
                                            <div key={nominee.name} className="bg-neutral-900 border border-white/8 rounded-xl p-3 flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${nominee.color} flex items-center justify-center text-lg shrink-0`}>
                                                    {nominee.emoji}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-white truncate">{nominee.name}</p>
                                                    <p className="text-[10px] text-gray-500 truncate">{nominee.studio}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {i === 2 && (
                                <div className="border-t border-white/5 bg-black/20 p-5">
                                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3 font-bold">
                                        Categorías de ejemplo
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {EXAMPLE_CATEGORIES.map(cat => (
                                            <div key={cat.name} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${cat.bg} ${cat.color}`}>
                                                {cat.icon} {cat.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {i === 3 && (
                                <div className="border-t border-white/5 bg-black/20 p-5">
                                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3 font-bold">
                                        Ejemplo de enlace de votación
                                    </p>
                                    <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 flex items-center gap-3 max-w-md">
                                        <div className="flex-1 font-mono text-sm text-violet-300 truncate">
                                            pollnow.es/vote/premios-2024-abc123
                                        </div>
                                        <div className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded font-mono shrink-0">
                                            ACTIVO
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">Comparte este enlace por WhatsApp, Discord o redes sociales.</p>
                                </div>
                            )}

                            {i === 4 && (
                                <div className="border-t border-white/5 bg-black/20 p-5">
                                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3 font-bold">
                                        Resultados en directo (ejemplo)
                                    </p>
                                    <div className="max-w-md space-y-2">
                                        {[
                                            { name: "Elden Ring", pct: 38, emoji: "⚔️" },
                                            { name: "Baldur's Gate 3", pct: 27, emoji: "🐉" },
                                            { name: "Zelda: TotK", pct: 21, emoji: "🗡️" },
                                            { name: "God of War", pct: 14, emoji: "🪓" },
                                        ].map(item => (
                                            <div key={item.name} className="flex items-center gap-3">
                                                <span className="text-base w-6 text-center">{item.emoji}</span>
                                                <span className="text-xs text-gray-300 w-32 truncate">{item.name}</span>
                                                <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                                                        style={{ width: `${item.pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-gray-400 w-8 text-right">{item.pct}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Ideas section ──────────────────────────────────────── */}
            <section className="py-12 px-6 bg-neutral-950/50 border-t border-white/5">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 mb-6">
                        <Lightbulb size={18} className="text-amber-400" />
                        <h2 className="text-lg font-bold">¿Qué más puedes hacer?</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                            { emoji: "🎬", label: "Premios de cine", desc: "Mejor película, mejor director…" },
                            { emoji: "🎵", label: "Premios musicales", desc: "Mejor álbum, mejor artista…" },
                            { emoji: "⚽", label: "Premios deportivos", desc: "MVP de la temporada, gol del año…" },
                            { emoji: "📺", label: "Premios de series", desc: "Mejor serie, mejor personaje…" },
                            { emoji: "🏆", label: "Premios internos", desc: "Para tu empresa, equipo o clase…" },
                            { emoji: "🎉", label: "Y muchos más", desc: "¡Solo tú pones el límite!" },
                        ].map(idea => (
                            <div key={idea.label} className="flex items-center gap-3 p-3 bg-neutral-900 border border-white/5 rounded-xl">
                                <span className="text-2xl">{idea.emoji}</span>
                                <div>
                                    <p className="text-sm font-semibold text-white">{idea.label}</p>
                                    <p className="text-xs text-gray-500">{idea.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────────────────── */}
            <section className="py-16 px-6 text-center">
                <div className="max-w-2xl mx-auto">
                    <div className="text-4xl mb-4">🚀</div>
                    <h2 className="text-2xl font-black mb-3">
                        ¿Listo para crear tu primera gala?
                    </h2>
                    <p className="text-gray-400 mb-8 text-sm">
                        Empieza con el plan gratuito — sin tarjeta de crédito. Crea tu primer evento en menos de 5 minutos.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            href="/dashboard?tab=events&tour=create"
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-full font-bold text-white transition-all shadow-lg shadow-violet-900/30"
                        >
                            <Sparkles size={16} /> Tour guiado interactivo
                        </Link>
                        <Link
                            href="/dashboard?tab=events"
                            className="flex items-center gap-2 px-6 py-3 border-2 border-white/10 hover:border-white/20 rounded-full font-bold text-gray-300 hover:text-white transition-all"
                        >
                            Crear evento directamente <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
