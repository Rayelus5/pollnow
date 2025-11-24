import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            username: string
            role: "USER" | "ADMIN" | "MODERATOR"
        } & DefaultSession["user"]
    }

    interface User {
        role: "USER" | "ADMIN" | "MODERATOR"
        username: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: "USER" | "ADMIN" | "MODERATOR"
        username: string
    }
}