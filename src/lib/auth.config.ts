import type { NextAuthConfig } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/verify-email",
    newUser: "/register",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      // Only dashboard routes require login. /checkout stays public for guest checkout.
      const protectedPaths = ["/dashboard"]

      const isOnAdmin = pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")

      if (isOnAdmin) {
        if (!isLoggedIn) return false
        if (auth.user.role !== "ADMIN") {
          return Response.redirect(new URL("/dashboard", nextUrl))
        }
        return true
      }

      const requiresAuth = protectedPaths.some((path) => pathname.startsWith(path))
      if (requiresAuth) {
        return isLoggedIn
      }

      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id ?? ""
        token.email = user.email ?? ""
        token.role = (user as { role?: "USER" | "ADMIN" }).role ?? "USER"
      }
      if (account?.type === "credentials") {
        token.maxAge = 30 * 24 * 60 * 60
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as "USER" | "ADMIN"
      }
      return session
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: false,
    }),
  ],
} satisfies NextAuthConfig
