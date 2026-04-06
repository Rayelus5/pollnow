"use client";

import Link from "next/link";

export const CustomPollnowBanner = () => {
    return (
        <Link href="/about#contact">
            <img src="/ads/Horizontal_welcome.webp" alt="Publicidad banner" className="w-full h-auto" />
        </Link>
    );
};