import type { MetadataRoute } from "next";

const BASE = "https://pollnow.es";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                // Zonas privadas / no indexables
                disallow: ["/dashboard/", "/admin/", "/api/", "/maintenance", "/logout"],
            },
        ],
        sitemap: `${BASE}/sitemap.xml`,
        host: BASE,
    };
}
