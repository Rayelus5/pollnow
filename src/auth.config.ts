import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // 1) Primer login: viene "user"
            if (user) {
                const u = user as any;

                // ID y username
                token.id = u.id as string;
                token.username = (u.username ?? u.name ?? "") as string;

                // Rol: intentamos coger el de user, si no, mantenemos el anterior o 'USER'
                const incomingRole =
                    (u.role as "USER" | "ADMIN" | "MODERATOR" | undefined) ??
                    (token.role as "USER" | "ADMIN" | "MODERATOR" | undefined) ??
                    "USER";

                token.role = incomingRole;

                // Limpiar basura que mete NextAuth por defecto
                delete (token as any).picture;
                delete (token as any).image;
            }

            // 2) Cuando haces session.update() en el cliente
            if (trigger === "update" && session?.user) {
                const sUser = session.user as any;

                // Actualizamos solo lo que venga, sin perder el role si no se envía
                token.username = sUser.username ?? token.username;
                token.role =
                    (sUser.role as "USER" | "ADMIN" | "MODERATOR" | undefined) ??
                    (token.role as "USER" | "ADMIN" | "MODERATOR" | undefined) ??
                    "USER";
            }

            // 3) Fallback: que nunca se quede sin role
            if (!token.role) {
                token.role = "USER";
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                const sUser = session.user as any;

                sUser.id = token.id as string;
                sUser.username = (token as any).username as string;
                sUser.role =
                    (token.role as "USER" | "ADMIN" | "MODERATOR" | undefined) ??
                    "USER";

                session.user.image = null;
            }
            return session;
        },

        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirige a login
            }

            // El resto de rutas se autorizan por aquí.
            // /admin ya lo controlas tú en el middleware con el role.
            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
