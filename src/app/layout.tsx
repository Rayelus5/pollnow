import type { Metadata } from "next";
import { Inter } from "next/font/google"; // O la fuente que uses
import "./globals.css";
import Navbar from "@/components/Navbar"; // <--- Importamos

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FOTY - Friend of the Year",
  description: "Premios y encuestas épicas para grupos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {/* AÑADIMOS LA NAVBAR AQUÍ */}
        <Navbar />
        
        {/* AÑADIMOS PADDING SUPERIOR PARA QUE EL CONTENIDO NO QUEDE TAPADO */}
        <div className="pt-16">
          {children}
        </div>
      </body>
    </html>
  );
}