import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar"; // Ya incluye la lógica de Auth

export default function LandingPage() {
  return (
    <main className="bg-black min-h-screen selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/20 rounded-[100%] blur-[120px] pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs font-medium text-gray-300 tracking-wide">Ahora disponible para todos</span>
        </div>

        <h1 className="text-5xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-500 mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Crea tus propios <br/>
            <span className="text-blue-500">Game Awards.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
            FOTY es la plataforma definitiva para organizar votaciones épicas entre amigos, comunidades o eventos. Diseño premium, 100% anónimo y con modo "Gala".
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <Link 
                href="/register" 
                className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-colors shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
            >
                Empezar Gratis
            </Link>
            <Link 
                href="/polls" 
                className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
                Explorar Eventos
            </Link>
        </div>

        {/* Mockup Visual (CSS puro) */}
        <div className="mt-20 relative w-full max-w-4xl aspect-video bg-neutral-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden group animate-in fade-in zoom-in duration-1000 delay-500">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
             
             {/* Fake UI Elements */}
             <div className="absolute top-8 left-8 right-8 bottom-8 bg-black/80 rounded-xl border border-white/5 p-8 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full mb-4 shadow-[0_0_30px_rgba(59,130,246,0.5)] animate-pulse"></div>
                <div className="h-8 w-3/4 bg-white/10 rounded mb-4"></div>
                <div className="h-4 w-1/2 bg-white/5 rounded"></div>
             </div>

             <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>

      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 bg-neutral-950 border-t border-white/5">
         <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
            <FeatureCard 
                icon="🏆"
                title="Modo Gala"
                desc="Resultados sellados hasta la fecha del evento. Vive la emoción del directo sin spoilers."
            />
            <FeatureCard 
                icon="🔒"
                title="Voto Anónimo"
                desc="Sin registros forzosos. Tecnología de huella digital y cookies para garantizar un voto por persona."
            />
            <FeatureCard 
                icon="🎨"
                title="Diseño Épico"
                desc="Una interfaz oscura, limpia y animada con Framer Motion que hará que tu evento parezca una producción de Netflix."
            />
         </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-32 px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">¿Listo para organizar tu evento?</h2>
          <Link href="/register" className="inline-block px-10 py-5 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full font-bold text-xl text-white shadow-lg shadow-blue-900/30 hover:scale-105 transition-transform">
            Crear Cuenta Gratis
          </Link>
      </section>

    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
    return (
        <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors">
            <div className="text-4xl mb-6">{icon}</div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{desc}</p>
        </div>
    )
}