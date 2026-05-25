"use client";

import { ReactNode } from "react";
import { CustomAdBannerVertical } from "@/components/ads/CustomAdBannerVertical";

type Props = {
    /** Si es false, no se renderizan los banners (plan sin anuncios). */
    showAds: boolean;
    children: ReactNode;
};

/**
 * Muestra dos anuncios verticales como tarjetas FLOTANTES superpuestas (position: fixed)
 * en los laterales, visibles solo en pantallas grandes (2xl, 1536px+). No reservan espacio
 * en el layout: el contenido conserva todo su ancho (sin franjas negras a los lados) y los
 * anuncios flotan sobre los márgenes siguiendo al usuario durante el scroll, de forma
 * idéntica en todas las páginas. Si showAds es false, solo renderiza el contenido.
 */
export default function SideRailAds({ showAds, children }: Props) {
    return (
        <>
            {children}
            {showAds && (
                <>
                    <div className="hidden 2xl:block fixed left-3 top-1/2 -translate-y-1/2 z-40 w-[200px]">
                        <CustomAdBannerVertical />
                    </div>
                    <div className="hidden 2xl:block fixed right-3 top-1/2 -translate-y-1/2 z-40 w-[200px]">
                        <CustomAdBannerVertical />
                    </div>
                </>
            )}
        </>
    );
}
