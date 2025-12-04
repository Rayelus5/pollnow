"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Rocket,
    Code2,
    Heart,
    Mail,
    ArrowRight,
    Github,
    Linkedin,
    Map,
    Zap,
    HandCoins,
    Palette
} from "lucide-react";

// --- CONFIGURACIÓN DE ANIMACIONES ---

const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: "easeOut" }
    }
};

const staggerContainer = {
    visible: { transition: { staggerChildren: 0.2 } }
};

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-black text-white selection:bg-blue-500/30 overflow-x-hidden">

            {/* --- 1. HERO SECTION: LA MISIÓN --- */}
            <section className="relative pt-32 pb-20 px-6 min-h-[60vh] flex flex-col items-center justify-center text-center">

                {/* Fondo Ambiental */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-[100%] blur-[120px] pointer-events-none" />

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="relative z-10 max-w-5xl"
                >
                    <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span className="text-xs font-medium text-gray-300 tracking-widest uppercase">Invitación Recibida</span>
                    </motion.div>

                    <motion.h1 variants={fadeInUp} className="text-5xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 mb-8">
                        Te invitamos a colaborar, <span className="text-amber-500">FootballClub.</span>
                    </motion.h1>

                    <motion.p variants={fadeInUp} className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
                        Has sido seleccionado para recibir una invitación de colaboración junto con POLLNOW. ¡Estamos emocionados de trabajar contigo y ayudarte en todo lo que necesites!
                    </motion.p>
                </motion.div>
            </section>


            {/* --- 2. EL CREADOR (PERFIL) --- */}
            <section className="py-24 px-6 border-t border-white/15 bg-neutral-950/50">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeInUp}
                        className="grid md:grid-cols-2 gap-12 items-center"
                    >
                        {/* Imagen / Tarjeta */}
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-sky-600 rounded-3xl opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-500" />
                            <div className="relative aspect-square md:aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-neutral-900">
                                {/* REEMPLAZA ESTA URL CON TU FOTO REAL */}
                                <Image
                                    src="/rayelus-img.jpg"
                                    alt="Rayelus Image"
                                    fill
                                    className="object-cover transition-all duration-700 group-hover:scale-105 grayscale hover:grayscale-50"
                                />

                                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
                                    <h3 className="text-2xl font-bold text-white">Rayelus</h3>
                                    <p className="text-blue-400 font-mono text-sm">Full Stack Developer & Creator</p>
                                </div>
                            </div>
                        </div>

                        {/* Texto Bio */}
                        <div className="space-y-8">
                            <h2 className="text-4xl font-bold text-white">¿Qué es POLLNOW?</h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Una plataforma moderna para crear, gestionar y analizar eventos interactivos con votaciones en tiempo real. Incluye panel de administración, estadísticas avanzadas, categorías personalizables, control de participantes, planes de suscripción y soporte integrado. 
                            </p>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                POLLNOW está construido con las últimas tecnologías como Next.js, React, Tailwind CSS, Prisma, NextAuth y Stripe.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <a
                                    href="https://rayelus.com/portfolio"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                                >
                                    <Code2 size={20} /> Ver Portfolio
                                </a>
                                <a
                                    href="https://github.com/Rayelus5"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 border border-white/20 rounded-full font-bold hover:bg-white/10 transition-colors flex items-center gap-2"
                                >
                                    <Github size={20} /> GitHub
                                </a>
                                <a
                                    href="#"
                                    className="px-6 py-3 border border-white/20 rounded-full font-bold hover:bg-blue-600/20 hover:border-blue-500/50 transition-colors flex items-center gap-2 text-blue-400"
                                >
                                    <Linkedin size={20} /> LinkedIn
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>


            {/* --- 3. ROADMAP (BENTO GRID) --- */}
            <section className="py-10 px-6 bg-neutral-950/50">
    <div className="max-w-6xl mx-auto">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
        >
            <h2 className="text-4xl font-bold mb-4">¿Qué podemos ofrecerte?</h2>
            <p className="text-gray-400">
                Ya seas un club, una empresa o un creador de eventos, estamos aquí para ayudarte a llevar tus votaciones y ceremonias al siguiente nivel.
            </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
            
            {/* Card 1 – Asesoramiento y Guía */}
            <RoadmapCard
                icon={<HandCoins className="text-blue-400" />}
                title="Asesoramiento Personalizado"
                desc="Te ayudamos a planificar y estructurar tu evento: categorías, participantes, votaciones, dinámica y presentación. Acompañamiento completo desde el primer día. Además aumentamos tus límites de eventos activos, nominados y categorías a tus necesidades."
                status="Ideal para Nuevos Usuarios"
                colSpan="md:col-span-2"
            />

            {/* Card 2 – Videollamada */}
            <RoadmapCard
                icon={<Zap className="text-sky-400" />}
                title="Reunión por Videollamada"
                desc="Si prefieres explicarnos tu proyecto cara a cara, agendamos una videollamada donde resolveremos dudas, compartiremos ideas y definiremos juntos el evento."
                status="Opción Directa y Rápida"
            />

            {/* Card 3 – Eventos a Medida */}
            <RoadmapCard
                icon={<Palette className="text-purple-400" />}
                title="Eventos Personalizados (Enterprise)"
                desc="Creamos una experiencia única para tu organización."
                status="Plan Enterprise"
            />

            {/* Card 4 – Integración y Soporte Profesional */}
            <RoadmapCard
                icon={<Heart className="text-red-400" />}
                title="Soporte Técnico y Acompañamiento"
                desc="Te guiamos paso a paso si quieres crear tu evento personalizado y compartirlo con tu proyecto/web, redes o con tu comunidad. Soporte prioritario para empresas."
                status="A tu Lado en Todo Momento"
                colSpan="md:col-span-2"
            />
        </div>
    </div>
</section>



            {/* --- 4. CONTACTO --- */}
            <section id="contact" className="py-24 px-6 bg-neutral-950/50">
                <div className="max-w-6xl mx-auto">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-14"
                    >
                        <h2 className="text-4xl font-bold mb-4">Contacta con nosotros</h2>
                        <p className="text-gray-400">Si deseas collaborar con nosotros, no dudes en ponerte en contacto con nosotros.</p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="bg-neutral-900/50 border-2 border-white/15 p-8 md:p-12 rounded-3xl backdrop-blur-xl shadow-2xl"
                    >
                        {/* <motion.div variants={fadeInUp} className="text-center mb-10">
                            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                                <Mail size={32} />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">Hablemos</h2>
                            <p className="text-gray-400">¿Tienes una idea, un bug o simplemente quieres saludar?</p>
                        </motion.div> */}

                        <motion.form action={"https://submit-form.com/dIye1ORvC"} variants={fadeInUp} className="space-y-4">
                            <input
                                type="hidden"
                                name="_redirect"
                                value="https://pollnow.es/thanks"
                            />

                            <div className="grid md:grid-cols-2 gap-4 pb-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nombre</label>
                                    <input required name="name" id="name" type="text" placeholder="Tu nombre" className="w-full bg-black/50 border-2 border-white/10 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                                    <input required name="email" id="email" type="email" placeholder="tu@email.com" className="w-full bg-black/50 border-2 border-white/10 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none transition-colors" />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="colab-type" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">¿Que tipo de colaboración deseas? <span className="text-red-500">*</span></label>
                                <select name="colab-type" id="colab-type" className="w-full bg-black/50 border-2 border-white/10 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none transition-colors">
                                    <option value="videollamada">Reunión por Videollamada</option>
                                    <option value="asesoramiento-personalizado">Asesoramiento Personalizado</option>
                                    <option value="evento-personalizado">Eventos Personalizados</option>
                                    <option value="soporte-tecnico">Soporte Técnico</option>
                                    <option value="enterprise">Mejorar a Enterprise</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="msg" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Mensaje</label>
                                <textarea required name="msg" id="msg" rows={4} placeholder="¿En qué estás pensando?" className="w-full bg-black/50 border-2 border-white/10 rounded-xl p-4 text-white focus:border-blue-500 focus:outline-none transition-colors"></textarea>
                            </div>

                            <button className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-6 cursor-pointer">
                                Enviar Mensaje <ArrowRight size={18} />
                            </button>
                        </motion.form>

                    </motion.div>
                </div>
            </section>

        </main>
    );
}

// --- COMPONENTE AUXILIAR PARA EL GRID ---
function RoadmapCard({ icon, title, desc, status, colSpan = "" }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className={`p-8 rounded-3xl bg-white/5 border border-white/15 hover:border-blue-500/30 hover:bg-white/10 transition-all duration-300 ${colSpan} flex flex-col justify-between`}
        >
            <div>
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">{icon}</div>
                    <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-400 border border-white/5">
                        {status}
                    </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
        </motion.div>
    )
}