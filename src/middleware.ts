import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import { MAINTENANCE_MODE } from "@/lib/config";

// Inicializamos NextAuth SOLO con la config ligera para el Edge
const { auth } = NextAuth(authConfig);

const ADMIN_IP_WHITELIST = process.env.ADMIN_IP_WHITELIST?.split(',') || [];

// Esta función ahora contiene TODA la lógica, priorizando el MANTENIMIENTO.
export default auth(async (req) => {
    const { nextUrl } = req;
    const { pathname } = nextUrl;

    const userRole = req.auth?.user?.role || 'USER';

    // =========================================================
    // 1. COMPROBACIÓN DEL MODO MANTENIMIENTO (PRIORIDAD ALTA)
    // =========================================================
    // 1. MODO MANTENIMIENTO
    if (MAINTENANCE_MODE) {
        // ... (Tu lógica de mantenimiento existente) ...
        // Si quieres permitir a admins entrar en mantenimiento:
        if (nextUrl.pathname.startsWith('/admin') && userRole === 'ADMIN') {
            // Dejar pasar
        } else if (!nextUrl.pathname.startsWith('/maintenance') && !nextUrl.pathname.startsWith('/_next')) {
            return NextResponse.rewrite(new URL('/maintenance', req.url));
        }
    }
    // Si no estamos en modo mantenimiento, la ejecución continúa con la autenticación.
    // =========================================================


    // =========================================================
    // 2. LÓGICA DE AUTENTICACIÓN (NextAuth)
    // =========================================================
    const isLoggedIn = !!req.auth;

    // PROTECCIÓN DE RUTAS
    // Esto resuelve el problema de /premium y otras rutas protegidas.
    const protectedPaths = ['/dashboard', '/polls', '/results', '/e', '/premium'];
    // Excluir /admin porque ya lo manejamos arriba
    if (protectedPaths.some(path => nextUrl.pathname.startsWith(path)) && !nextUrl.pathname.startsWith('/admin') && !isLoggedIn) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    // GESTIÓN DE VOTOS (Cookie Anónima) - Se mantiene
    const response = NextResponse.next();
    if (!pathname.startsWith('/_next') && !pathname.includes('.')) {
        const voterId = req.cookies.get('voter_id');
        if (!voterId) {
            const newVoterId = crypto.randomUUID();
            response.cookies.set('voter_id', newVoterId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 365,
                httpOnly: true,
                sameSite: 'lax',
            });
        }
    }

    // 2.1 PROTECCIÓN DE PANEL ADMIN (NIVEL SUPERIOR)
    if (nextUrl.pathname.startsWith('/admin')) {
        // A. Login requerido
        if (!isLoggedIn) {
            const loginUrl = new URL('/login', req.url);
            loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }

        // B. Rol requerido
        if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
            // Redirigir a dashboard normal si intenta entrar donde no debe
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        // C. Bloqueo por IP
        // Necesita configurar trust proxy si estás en Vercel/Cloudflare

        /* const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
        if (ADMIN_IP_WHITELIST.length > 0 && !ADMIN_IP_WHITELIST.includes(ip)) {
            return new NextResponse("Access Denied: IP not allowed", { status: 403 });
        }
        */
    }

    return response;
});


// Mantenemos la configuración del matcher separada, ya que es el patrón recomendado.
export const config = {
    // Matcher para excluir estáticos y llamadas internas
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};