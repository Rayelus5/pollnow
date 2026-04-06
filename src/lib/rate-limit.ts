/**
 * Simple in-memory sliding-window rate limiter.
 * Good enough for single-instance deployments (dev/small VPS).
 * For multi-instance / Vercel Edge, swap this for @upstash/ratelimit.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

// Clean stale entries every 5 minutes so the map doesn't grow unbounded
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (entry.resetAt <= now) store.delete(key);
    }
}, 5 * 60 * 1000);

/**
 * @param key      Unique key, e.g. `${ip}:like`
 * @param limit    Max requests per window
 * @param windowMs Window duration in milliseconds (default: 60 s)
 * @returns `{ allowed: boolean, remaining: number, retryAfter: number }`
 */
export function rateLimit(
    key: string,
    limit: number,
    windowMs = 60_000
): { allowed: boolean; remaining: number; retryAfter: number } {
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        store.set(key, entry);
    }

    entry.count++;

    const remaining = Math.max(0, limit - entry.count);
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

    return {
        allowed: entry.count <= limit,
        remaining,
        retryAfter,
    };
}

/** Extract client IP from a Next.js Request */
export function getClientIp(req: Request): string {
    const xff = req.headers.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
    return req.headers.get("x-real-ip") ?? "unknown";
}
