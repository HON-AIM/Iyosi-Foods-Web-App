import NextAuth from "next-auth"
import { authConfig } from "./src/lib/auth.config"

export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
}
