import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { MAINTENANCE_MODE } from "@/lib/config";
import ChatBot from "@/components/ia/ChatBot";
import CookieConsent from "@/components/CookieConsent";
import HelpButtonWrapper from "@/components/HelpButtonWrapper";
import AnnouncementBarWrapper from "@/components/AnnouncementBarWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "POLLNOW - Crea tu propia gala digital",
    template: "%s | POLLNOW"
  },
  description: "La plataforma definitiva para crear, gestionar y disfrutar de tus propias galas digitales y eventos interactivos en tiempo real.",
  keywords: ["POLLNOW", "gala digital", "eventos online", "crear eventos", "votaciones en vivo", "Rayelus"],
  authors: [{ name: "Rayelus" }],
  creator: "Rayelus",
  metadataBase: new URL("https://pollnow.es"), // Sustituye por tu URL real

  // Open Graph (Para Facebook, LinkedIn, Discord)
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://pollnow.es",
    siteName: "POLLNOW",
    title: "POLLNOW - Crea tu propia gala digital",
    description: "Organiza eventos interactivos y galas digitales con facilidad. ¡Haz que tu audiencia participe!",
    images: [
      {
        url: "/og-image.webp", // Asegúrate de tener esta imagen en tu carpeta /public
        width: 1920,
        height: 800,
        alt: "POLLNOW - Preview de la plataforma",
      },
    ],
  },

  // Twitter (X)
  twitter: {
    card: "summary_large_image",
    title: "POLLNOW - Crea tu propia gala digital",
    description: "Crea tu propia gala digital en minutos.",
    creator: "@rayelus5",
    images: ["/og-image.webp"],
  },

  // Robots y Favicons
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/logo.webp",
    apple: "/logo.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const showUI = !MAINTENANCE_MODE; // <-- si está en mantenimiento, ocultamos todo

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "POLLNOW",
    url: "https://pollnow.es",
    logo: "https://pollnow.es/logo.webp",
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "POLLNOW",
    url: "https://pollnow.es",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://pollnow.es/polls?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />

        {/* ANNOUNCEMENT BAR (solo si no está en mantenimiento) */}
        {showUI && <AnnouncementBarWrapper />}

        {/* NAVBAR (solo si no está en mantenimiento) */}
        {showUI && <Navbar />}

        {/* Si hay navbar aplicamos padding, si no, lo quitamos */}
        <div className={showUI ? "pt-16" : ""}>
          {children}
        </div>

        <ChatBot />
        <CookieConsent />
        {showUI && <HelpButtonWrapper />}

        {/* FOOTER (solo si no está en mantenimiento) */}
        {showUI && (
          <footer className="py-8 text-center text-sm text-gray-300 border-t-2 border-white/15">
            <div className="flex justify-center gap-6 mb-4">
              <Link href="/legal/terms" className="hover:text-white transition-colors">Términos</Link>
              <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacidad</Link>
              <Link href="/legal/cookies" className="hover:text-white transition-colors">Cookies</Link>
            </div>
            <p className="mb-5">Copyright © {new Date().getFullYear()} POLLNOW - Todos los derechos reservados | Creado con 💙 por Rayelus.</p>

            <Link href="/credits" className="text-zinc-600 hover:text-blue-400 transition-colors">-  Agradecimientos -</Link>
          </footer>
        )}

      </body>
    </html>
  );
}