// src/lib/image-hosts.ts
//
// Única fuente de verdad de los dominios externos de imágenes que sí pasan
// por el optimizador de next/image (`next.config.ts` los importa tal cual
// para `images.remotePatterns`). Los usuarios pueden pegar la URL de imagen
// que quieran (nominados en modo "Manual", avatar de perfil), así que
// cualquier dominio fuera de esta lista NO puede pasar por next/image
// (Next lanza un error duro si el hostname no está configurado) — para esos
// casos, `isConfiguredImageHost` permite a los componentes caer a
// `unoptimized` (un <img> normal, sin el crash) en vez de romper la página.

export type ImageHostPattern = { protocol: "https"; hostname: string; port: ""; pathname: "/**" };

export const ALLOWED_IMAGE_HOSTS: ImageHostPattern[] = [
    // Imágenes de nominados: subidas manuales, generadas por IA, re-alojadas
    // desde "Buscar en internet", y avatares de usuario (ver participant-image.ts / user-avatar.ts).
    { protocol: "https", hostname: "*.public.blob.vercel-storage.com", port: "", pathname: "/**" },
    { protocol: "https", hostname: "api.dicebear.com", port: "", pathname: "/**" },
    { protocol: "https", hostname: "placehold.co", port: "", pathname: "/**" },
    { protocol: "https", hostname: "lh3.googleusercontent.com", port: "", pathname: "/**" },
    { protocol: "https", hostname: "pollinations.ai", port: "", pathname: "/**" },
    { protocol: "https", hostname: "external-content.duckduckgo.com", port: "", pathname: "/**" },
    { protocol: "https", hostname: "duckduckgo.com", port: "", pathname: "/**" },
    { protocol: "https", hostname: "i.ibb.co", port: "", pathname: "/**" },
];

function hostnameMatches(hostname: string, pattern: string): boolean {
    if (pattern.startsWith("*.")) return hostname.endsWith(pattern.slice(1));
    return hostname === pattern;
}

/** True si `next/image` puede optimizar esta URL (su hostname está en la whitelist). */
export function isConfiguredImageHost(src: string): boolean {
    try {
        const { hostname } = new URL(src);
        return ALLOWED_IMAGE_HOSTS.some((p) => hostnameMatches(hostname, p.hostname));
    } catch {
        return false; // URL relativa, inválida, o data:/blob: — nunca "configurable"
    }
}
