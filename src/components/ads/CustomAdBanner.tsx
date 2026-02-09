"use client";

import Link from "next/link";
import Image from "next/image";

export const CustomAdBanner = () => {
    return (
        <Link href="https://chaotic-loom.com" target="_blank">
            <Image src="/ads/Horizontal.jpg" width={1920} height={800} alt="Publicidad banner" className="w-full h-auto" />
        </Link>
    );
};