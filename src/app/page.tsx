import LandingClient from "@/components/home/LandingClient";
import { auth } from "@/auth";
import { getCurrentUserPlan } from "@/lib/user-plan";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "POLLNOW — Crea tu propia gala digital",
    description:
        "La plataforma para crear, gestionar y disfrutar de galas digitales y eventos de votación interactivos en tiempo real. Votos anónimos y modo Gala.",
    alternates: { canonical: "https://pollnow.es" },
    openGraph: {
        url: "https://pollnow.es",
        title: "POLLNOW — Crea tu propia gala digital",
        description: "Organiza eventos interactivos y galas digitales. Haz que tu audiencia participe en tiempo real.",
    },
};

export default async function LandingPage() {
    const session = await auth();
    const plan = await getCurrentUserPlan();
    const showAds = plan.slug === "free" || plan.slug === "premium"; // solo UNLIMITED NO ven anuncios
    return (
        <main className="bg-black min-h-screen selection:bg-blue-500/30 overflow-x-hidden">
            <LandingClient session={session} showAds={showAds} />
        </main>
    );
}