import { NextResponse } from "next/server"
import { transporter } from "@/lib/email"

export async function GET() {
  const diagnostics: Record<string, unknown> = {}

  // 1. Check env vars
  diagnostics.EMAIL_SERVER_HOST = process.env.EMAIL_SERVER_HOST || "NOT SET"
  diagnostics.EMAIL_SERVER_PORT = process.env.EMAIL_SERVER_PORT || "NOT SET"
  diagnostics.EMAIL_SERVER_USER = process.env.EMAIL_SERVER_USER || "NOT SET"
  diagnostics.EMAIL_SERVER_PASSWORD = process.env.EMAIL_SERVER_PASSWORD ? "SET (hidden)" : "NOT SET"
  diagnostics.EMAIL_FROM = process.env.EMAIL_FROM || "NOT SET"
  diagnostics.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "NOT SET"
  diagnostics.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "NOT SET"

  // 2. Test SMTP connection
  try {
    await transporter.verify()
    diagnostics.smtpConnection = "OK — SMTP server is reachable"
  } catch (smtpError) {
    diagnostics.smtpConnection = "FAILED"
    diagnostics.smtpError = smtpError instanceof Error ? smtpError.message : String(smtpError)
  }

  // 3. Try sending a test email if ?to= is provided
  const hasSmtpError = diagnostics.smtpConnection === "FAILED"
  if (!hasSmtpError) {
    return NextResponse.json({
      status: "SMTP OK",
      message: "Nodemailer can connect to your Gmail SMTP server. The email infrastructure is working.",
      diagnostics,
    })
  }

  return NextResponse.json({
    status: "SMTP FAILED",
    message: "Nodemailer cannot connect to your SMTP server. Check your Gmail App Password — it may be expired or revoked. Generate a new one at https://myaccount.google.com/apppasswords",
    diagnostics,
  }, { status: 500 })
}
