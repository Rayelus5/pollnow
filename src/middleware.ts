import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from "@/auth"; // Importamos la configuración de auth

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. PROTECCIÓN DE DASHBOARD
    // Si intenta entrar a /dashboard y no tiene sesión -> Login
    if (pathname.startsWith('/dashboard')) {
        // @ts-ignore - Auth.js beta type issue workaround
        const session = await auth(request);
        if (!session) {
            const loginUrl = new URL('/login', request.url);
            // Guardamos adónde quería ir para redirigirle luego
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // 2. GESTIÓN DE VOTOS (Cookie Anónima) - Se mantiene igual
    const response = NextResponse.next();
    if (!pathname.startsWith('/_next') && !pathname.includes('.')) {
        const voterId = request.cookies.get('foty_voter_id');
        if (!voterId) {
            const newVoterId = crypto.randomUUID();
            response.cookies.set('foty_voter_id', newVoterId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 365,
                httpOnly: true,
                sameSite: 'lax',
            });
        }
    }

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};