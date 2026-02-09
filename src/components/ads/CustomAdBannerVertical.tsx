"use client";

import Link from "next/link";
import Image from "next/image";

export const CustomAdBannerVertical = () => {
    return (
        <Link href="https://chaotic-loom.com" target="_blank">
            <Image src="/ads/Vertical-1.webp" width={500} height={1950} alt="Publicidad banner" className="w-full h-auto" />
        </Link>
    );
}
