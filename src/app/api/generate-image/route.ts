import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Orden de preferencia: zimage (gratis) → p-image (de pago) → flux (último recurso)
const MODEL_FALLBACK = ["zimage", "p-image", "flux"] as const;

async function tryGenerate(
    prompt: string,
    seed: number,
    model: string,
    apiKey: string
): Promise<{ ok: true; buffer: ArrayBuffer; contentType: string } | { ok: false; status: number }> {
    const params = new URLSearchParams({
        width: "512",
        height: "512",
        seed: String(seed),
        model,
        nologo: "true",
        private: "true",
    });

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;

    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
        console.warn(`⚠️  Modelo ${model} falló con HTTP ${response.status}`);
        return { ok: false, status: response.status };
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    return { ok: true, buffer, contentType };
}

export async function POST(req: Request) {
    // Rate limit: 5 imágenes/min por usuario autenticado, 2/min por IP anónima
    const session = await auth();
    const rateLimitKey = session?.user?.id
        ? `gen-image:user:${session.user.id}`
        : `gen-image:ip:${getClientIp(req)}`;
    const limit = session?.user?.id ? 5 : 2;

    const { allowed, retryAfter } = rateLimit(rateLimitKey, limit);
    if (!allowed) {
        return NextResponse.json(
            { error: "Demasiadas peticiones. Inténtalo en unos segundos." },
            { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
    }

    if (!process.env.POLLINATIONS_API_KEY) {
        return NextResponse.json({ error: "POLLINATIONS_API_KEY no configurada." }, { status: 500 });
    }

    const { prompt, seed } = await req.json();

    if (!prompt || typeof prompt !== "string") {
        return NextResponse.json({ error: "Prompt inválido." }, { status: 400 });
    }

    const resolvedSeed = seed ?? Math.floor(Math.random() * 10000);

    for (const model of MODEL_FALLBACK) {
        const result = await tryGenerate(prompt, resolvedSeed, model, process.env.POLLINATIONS_API_KEY);

        if (result.ok) {
            const base64 = Buffer.from(result.buffer).toString("base64");
            console.log(`✅ Imagen generada con modelo: ${model}`);
            return NextResponse.json({
                imageUrl: `data:${result.contentType};base64,${base64}`,
                model,
            });
        }
    }

    console.error("❌ Todos los modelos fallaron.");
    return NextResponse.json(
        { error: "La generación de imágenes no está disponible ahora mismo." },
        { status: 503 }
    );
}
