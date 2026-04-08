import type { Metadata } from "next";
import EmpresasPage from "@/components/empresas/EmpresasPage";

export const metadata: Metadata = {
    title: "POLLNOW para Empresas — Reconocimiento de equipo",
    description:
        "Herramienta de reconocimiento para equipos. Premios internos, votaciones de empleados, hackathons y más. Licencia corporativa desde 499 €.",
    openGraph: {
        title: "POLLNOW para Empresas",
        description: "Potencia el reconocimiento en tu equipo con POLLNOW.",
        type: "website",
    },
};

export default function Page() {
    const demoUrl = process.env.NEXT_PUBLIC_DEMO_EVENT_URL ?? "/polls";
    return <EmpresasPage demoUrl={demoUrl} />;
}
