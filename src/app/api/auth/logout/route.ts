import { NextResponse } from "next/server"
import { signOut } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST() {
  try {
    await signOut({ redirect: false })
  } catch {
    // Fail gracefully — still redirect the user
  }
  const response = NextResponse.json({ success: true, redirectTo: "/login" })
  response.cookies.set("next-auth.session-token", "", { maxAge: 0, path: "/" })
  response.cookies.set("__Secure-next-auth.session-token", "", { maxAge: 0, path: "/" })
  return response
}
