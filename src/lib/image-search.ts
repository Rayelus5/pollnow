// src/lib/image-search.ts
//
// Búsqueda de imágenes para nominados, agregando dos fuentes GRATUITAS:
//  - Pexels (fotos de stock; requiere PEXELS_API_KEY)
//  - Wikimedia Commons (fotos de personas/cosas conocidas; sin clave)
// Devuelve hasta 20 resultados intercalados. Tolerante a fallos: si una fuente
// falla o no está configurada, se usan los de la otra.

export type SearchImage = {
    url: string; // imagen a tamaño usable (se re-aloja al elegirla)
    thumbnail: string; // miniatura para la grid
    source: "pexels" | "wikimedia";
    credit?: string;
};

const IMG_EXT = /\.(jpe?g|png|gif|webp)$/i;

async function searchPexels(q: string): Promise<SearchImage[]> {
    const key = process.env.PEXELS_API_KEY;
    if (!key) return [];
    try {
        const res = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=12`,
            { headers: { Authorization: key }, next: { revalidate: 3600 } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.photos ?? [])
            .map((p: { src?: Record<string, string>; photographer?: string }): SearchImage | null => {
                const url = p.src?.large ?? p.src?.medium ?? p.src?.original;
                if (!url) return null;
                return { url, thumbnail: p.src?.tiny ?? p.src?.small ?? url, source: "pexels", credit: p.photographer };
            })
            .filter((x: SearchImage | null): x is SearchImage => !!x);
    } catch {
        return [];
    }
}

async function searchWikimedia(q: string): Promise<SearchImage[]> {
    try {
        const url =
            `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
            `&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=12` +
            `&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const data = await res.json();
        const pages = (data.query?.pages ?? {}) as Record<string, { imageinfo?: { url: string; thumburl?: string }[] }>;
        return Object.values(pages)
            .map((p): SearchImage | null => {
                const info = p.imageinfo?.[0];
                if (!info?.url || !IMG_EXT.test(info.url)) return null; // descarta SVG/PDF/etc.
                return { url: info.url, thumbnail: info.thumburl ?? info.url, source: "wikimedia" };
            })
            .filter((x): x is SearchImage => !!x);
    } catch {
        return [];
    }
}

/** Busca imágenes en ambas fuentes y devuelve hasta 20 resultados intercalados y sin duplicados. */
export async function searchImages(query: string): Promise<SearchImage[]> {
    const q = query.trim().slice(0, 100);
    if (!q) return [];

    const [pexels, wiki] = await Promise.all([searchPexels(q), searchWikimedia(q)]);

    // Intercalar para variedad (pexels, wiki, pexels, wiki…)
    const merged: SearchImage[] = [];
    const max = Math.max(pexels.length, wiki.length);
    for (let i = 0; i < max; i++) {
        if (pexels[i]) merged.push(pexels[i]);
        if (wiki[i]) merged.push(wiki[i]);
    }

    const seen = new Set<string>();
    return merged.filter((m) => (seen.has(m.url) ? false : (seen.add(m.url), true))).slice(0, 20);
}

/** Hosts permitidos para re-alojar (evita SSRF: solo descargamos de nuestras fuentes). */
export function isAllowedImageHost(rawUrl: string): boolean {
    try {
        const u = new URL(rawUrl);
        if (u.protocol !== "https:") return false;
        const host = u.hostname.toLowerCase();
        return host.endsWith("pexels.com") || host.endsWith("wikimedia.org");
    } catch {
        return false;
    }
}
