"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Sponsor = {
    /** Imagen del patrocinador. Si se omite, se muestra un placeholder. */
    src?: string;
    href: string;
    label?: string;
};

// TODO: sustituir por patrocinadores reales. De momento se usan placeholders.
const SPONSORS: Sponsor[] = [
    { src: "/ads/Vertical-1.webp", href: "https://chaotic-loom.com" },
    { href: "/premium", label: "Tu marca aquí" },
    { href: "/premium", label: "Patrocina Pollnow" },
];

const ROTATION_MS = 5000;

function isExternal(href: string) {
    return href.startsWith("http://") || href.startsWith("https://");
}

export const CustomAdBannerVertical = () => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (SPONSORS.length <= 1) return;
        const id = setInterval(() => {
            setIndex((prev) => (prev + 1) % SPONSORS.length);
        }, ROTATION_MS);
        return () => clearInterval(id);
    }, []);

    const sponsor = SPONSORS[index];

    return (
        <div className="relative w-full aspect-[500/1950] overflow-hidden rounded-md border border-white/10 shadow-2xl shadow-black/60 bg-neutral-950">
            <AnimatePresence>
                <motion.div
                    key={index}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                >

                    <Link
                        href={sponsor.href}
                        target={isExternal(sponsor.href) ? "_blank" : undefined}
                        rel={isExternal(sponsor.href) ? "noopener noreferrer sponsored" : undefined}
                        className="block w-full h-full"
                    >
                        {sponsor.src ? (
                            <>
                                <Image
                                    src={sponsor.src}
                                    fill
                                    sizes="200px"
                                    alt={sponsor.label ?? "Publicidad"}
                                    className="object-cover"
                                />
                            </>
                        ) : (
                            <>
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-neutral-800 to-neutral-950 text-center px-4">
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-600">Publicidad</span>
                                    <span className="text-lg font-bold text-gray-300">{sponsor.label}</span>
                                    <span className="text-xs text-gray-600">Hazte Unlimited o Plus para ocultar anuncios</span>
                                </div>
                            </>
                        )}
                    </Link>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
