import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Modelos gratuitos que corren en paralelo; p-image es de pago y sólo se usa como último recurso
const FREE_MODELS = ["klein", "flux", "zimage"] as const;
const PAID_FALLBACK = "p-image";

type GenerateResult =
    | { ok: true; buffer: ArrayBuffer; contentType: string; model: string }
    | { ok: false };

async function tryGenerate(
    prompt: string,
    seed: number,
    model: string,
    apiKey: string
): Promise<GenerateResult> {
    const params = new URLSearchParams({
        width: "512",
        height: "512",
        seed: String(seed),
        model,
        nologo: "true",
        private: "true",
    });

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!response.ok) {
            console.warn(`⚠️  Modelo ${model} falló con HTTP ${response.status}`);
            return { ok: false };
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") ?? "image/jpeg";
        return { ok: true, buffer, contentType, model };
    } catch {
        console.warn(`⚠️  Modelo ${model} lanzó una excepción`);
        return { ok: false };
    }
}

// Corre los modelos gratuitos en paralelo y devuelve el primero que responda con éxito
async function raceModels(
    prompt: string,
    seed: number,
    models: readonly string[],
    apiKey: string
): Promise<GenerateResult> {
    return new Promise((resolve) => {
        let settled = false;
        let pending = models.length;

        for (const model of models) {
            tryGenerate(prompt, seed, model, apiKey).then((result) => {
                pending--;
                if (!settled && result.ok) {
                    settled = true;
                    resolve(result);
                } else if (!settled && pending === 0) {
                    resolve({ ok: false });
                }
            });
        }
    });
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

    // 1. Lanzar los modelos gratuitos en paralelo — gana el primero que responda
    let result = await raceModels(prompt, resolvedSeed, FREE_MODELS, process.env.POLLINATIONS_API_KEY);

    // 2. Si todos los gratuitos fallan, intentar con el modelo de pago
    if (!result.ok) {
        console.warn("⚠️  Todos los modelos gratuitos fallaron, intentando con p-image...");
        result = await tryGenerate(prompt, resolvedSeed, PAID_FALLBACK, process.env.POLLINATIONS_API_KEY);
    }

    if (result.ok) {
        const base64 = Buffer.from(result.buffer).toString("base64");
        console.log(`✅ Imagen generada con modelo: ${result.model}`);
        return NextResponse.json({
            imageUrl: `data:${result.contentType};base64,${base64}`,
            model: result.model,
        });
    }

    console.error("❌ Todos los modelos fallaron (incluido p-image).");
    return NextResponse.json(
        { error: "La generación de imágenes no está disponible ahora mismo." },
        { status: 503 }
    );
}
