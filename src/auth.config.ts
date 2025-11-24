import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                // @ts-ignore
                token.username = user.username;
                // --- AÑADIR ESTO ---
                // @ts-ignore
                token.role = user.role;
                // -------------------

                delete token.picture;
                delete token.image;
            }
            if (trigger === "update" && session) {
                return {
                    ...token,
                    ...session.user,
                    role: (session.user as any)?.role ?? token.role, // conserva el rol si no viene
                };
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string;
                // @ts-ignore
                session.user.username = token.username as string;
                // --- AÑADIR ESTO ---
                // @ts-ignore
                session.user.role = token.role as string;
                // -------------------
                session.user.image = null;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirige a login
            }
            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;