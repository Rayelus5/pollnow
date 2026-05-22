import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = "https://pollnow.es";

export const revalidate = 3600; // regenera el sitemap cada hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Solo eventos públicos y aprobados
    let events: { slug: string; updatedAt: Date }[] = [];
    try {
        events = await prisma.event.findMany({
            where: { isPublic: true, status: "APPROVED" },
            select: { slug: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: 5000,
        });
    } catch (e) {
        console.error("[sitemap] Error consultando eventos:", e);
    }

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: `${BASE}/`, changeFrequency: "daily", priority: 1.0 },
        { url: `${BASE}/polls`, changeFrequency: "hourly", priority: 0.9 },
        { url: `${BASE}/premium`, changeFrequency: "monthly", priority: 0.6 },
        { url: `${BASE}/empresas`, changeFrequency: "monthly", priority: 0.6 },
        { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE}/legal/terms`, changeFrequency: "yearly", priority: 0.2 },
        { url: `${BASE}/legal/privacy`, changeFrequency: "yearly", priority: 0.2 },
        { url: `${BASE}/legal/cookies`, changeFrequency: "yearly", priority: 0.2 },
    ];

    const eventRoutes: MetadataRoute.Sitemap = events.map((e) => ({
        url: `${BASE}/e/${e.slug}`,
        lastModified: e.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
    }));

    return [...staticRoutes, ...eventRoutes];
}
