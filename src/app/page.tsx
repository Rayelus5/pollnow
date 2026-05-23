import LandingClient from "@/components/home/LandingClient";
import { auth } from "@/auth";
import { getCurrentUserPlan } from "@/lib/user-plan";
import { LANDING_FAQ } from "@/components/home/faq-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "POLLNOW — Crea galas, tierlists, encuestas y concursos de dibujo",
    description:
        "Crea votaciones en vivo con 4 modos de evento: galas digitales con resultados sellados, tierlists, encuestas tipo formulario y concursos de dibujo. Voto anónimo, imágenes con IA y colaboración en tiempo real.",
    keywords: [
        "crear votaciones en vivo",
        "gala digital",
        "tierlist online",
        "encuestas online",
        "concurso de dibujo",
        "voto anónimo",
        "eventos interactivos",
        "POLLNOW",
    ],
    alternates: { canonical: "https://pollnow.es" },
    openGraph: {
        url: "https://pollnow.es",
        title: "POLLNOW — Galas, tierlists, encuestas y concursos de dibujo",
        description:
            "Organiza votaciones épicas con 4 modos de evento. Voto anónimo por defecto, imágenes con IA y colaboración en tiempo real.",
    },
};

export default async function LandingPage() {
    const session = await auth();
    const plan = await getCurrentUserPlan();
    const showAds = plan.slug === "free" || plan.slug === "premium"; // solo UNLIMITED NO ven anuncios

    // FAQPage structured data (rich results). Misma fuente que la sección FAQ visible.
    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: LANDING_FAQ.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
    };

    const softwareJsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "POLLNOW",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://pollnow.es",
        description:
            "Plataforma para crear votaciones en vivo: galas digitales, tierlists, encuestas y concursos de dibujo, con voto anónimo y colaboración en tiempo real.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    };

    return (
        <main className="bg-black min-h-screen selection:bg-blue-500/30 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
            />
            <LandingClient session={session} showAds={showAds} />
        </main>
    );
}
