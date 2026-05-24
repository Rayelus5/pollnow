import Link from "next/link";
import { Github, Bug, Layers, HelpCircle } from "lucide-react";
import { APP_VERSION } from "@/lib/config";

type FooterLink = { label: string; href: string; external?: boolean };

const PRODUCT: FooterLink[] = [
    { label: "Inicio", href: "/" },
    { label: "Explorar eventos", href: "/polls" },
    { label: "Planes y precios", href: "/premium" },
    { label: "Para empresas", href: "/empresas" },
    { label: "Bug Bounty", href: "/bug-bounty" },
];

const LEGAL: FooterLink[] = [
    { label: "Política de privacidad", href: "/legal/privacy" },
    { label: "Términos de uso", href: "/legal/terms" },
    { label: "Política de cookies", href: "/legal/cookies" },
    { label: "Soporte", href: "/dashboard/support" },
    { label: "Sobre nosotros", href: "/about" },
];

function LinkList({ title, links }: { title: string; links: FooterLink[] }) {
    return (
        <nav aria-label={title}>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{title}</h3>
            <ul className="space-y-2.5">
                {links.map((l) => (
                    <li key={l.href}>
                        <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                            {l.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t-2 border-white/10 bg-neutral-950/60 mt-20" aria-label="Pie de página">
            <div className="max-w-6xl mx-auto px-6 py-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Columna 1 — Marca */}
                    <div>
                        <Link href="/" className="flex items-center gap-2 group w-fit" aria-label="Pollnow, inicio">
                            <div className="w-9 h-9 border-2 border-white/20 bg-gradient-to-br from-gray-700 to-black rounded-lg flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                                <img src="/logo.webp" alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-white">POLLNOW</span>
                        </Link>
                        <p className="text-sm text-gray-400 mt-4 leading-relaxed max-w-xs">
                            Crea galas, votaciones y eventos interactivos en minutos. Vota, participa y comparte.
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                                Beta Pública
                            </span>
                            <a
                                href="https://github.com/Rayelus5"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="GitHub de Rayelus"
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <Github size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Columna 2 — Producto */}
                    <LinkList title="Producto" links={PRODUCT} />

                    {/* Columna 3 — Legal & Soporte */}
                    <LinkList title="Legal & Soporte" links={LEGAL} />

                    {/* Columna 4 — Comunidad / CTA */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Únete</h3>
                        <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                            Crea tu primer evento gratis y empieza a recibir votos.
                        </p>
                        <Link
                            href="/register"
                            className="inline-block bg-gradient-to-r from-blue-600 to-sky-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:scale-[1.03] transition-transform"
                        >
                            Crear cuenta gratis
                        </Link>
                        <ul className="mt-5 space-y-2 text-xs text-gray-500">
                            <li className="flex items-center gap-2"><Layers size={13} className="text-blue-400" /> Galas, Tierlists, Preguntas y Dibujo</li>
                            <li className="flex items-center gap-2"><Bug size={13} className="text-blue-400" /> Programa Bug Bounty con recompensas</li>
                            <li className="flex items-center gap-2"><HelpCircle size={13} className="text-blue-400" /> Soporte por chat</li>
                        </ul>
                    </div>
                </div>

                {/* Fila inferior */}
                <div className="mt-12 pt-6 border-t-2 border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
                    <p>© {year} Pollnow. Todos los derechos reservados.</p>
                    <p className="flex items-center gap-2">
                        <span>Hecho con <span className="text-rose-400">❤️</span> en España</span>
                        <span className="text-gray-700">·</span>
                        <span className="font-mono">v{APP_VERSION}</span>
                        <span className="text-gray-700">·</span>
                        <Link href="/credits" className="hover:text-blue-400 transition-colors">Agradecimientos</Link>
                    </p>
                </div>
            </div>
        </footer>
    );
}
