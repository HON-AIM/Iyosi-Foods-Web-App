import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { type NextRequest } from "next/server";
import crypto from "crypto";
import { passwordResetLimiter, checkLimit } from "@/lib/redis-rate-limiter";
import { ForgotPasswordSchema } from "@/schemas/auth.schema";

const TOKEN_EXPIRY = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    if (request.method !== "POST") {
      return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
    }

    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request.headers.get("x-real-ip") ||
               "unknown";
    const { success, resetAt } = await checkLimit(passwordResetLimiter, ip);
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
      return NextResponse.json(
        {
          message: "Too many password reset attempts. Please try again later.",
          retryAfter,
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const body = await request.text();
    if (!body || body.length === 0 || body.length > 5000) {
      return NextResponse.json({ message: "Bad Request: Invalid request body" }, { status: 400 });
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      return NextResponse.json({ message: "Bad Request: Invalid JSON" }, { status: 400 });
    }

    if (!parsedBody || typeof parsedBody !== "object") {
      return NextResponse.json({ message: "Bad Request: Invalid request body" }, { status: 400 });
    }

    const parseResult = ForgotPasswordSchema.safeParse(parsedBody);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return NextResponse.json({ message: "Validation failed", errors }, { status: 400 });
    }

    const { email } = parseResult.data;
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      console.info("[LOG] Password reset requested for non-existent/inactive user:", { email, ip: clientIp, timestamp: new Date().toISOString() });
      return NextResponse.json(
        { message: "If that email is registered with us, a password reset link has been sent." },
        { status: 200 }
      );
    }

    const resetToken = crypto.randomBytes(64).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetTokenExpiry = new Date(Date.now() + TOKEN_EXPIRY);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { resetToken: resetTokenHash, resetTokenExpiry },
        });

        try {
          await tx.passwordResetLog.create({
            data: {
              userId: user.id,
              email,
              ipAddress: clientIp,
              userAgent: request.headers.get("user-agent") || "unknown",
            },
          });
        } catch (auditError) {
          console.warn("[WARN] Failed to log password reset request:", { userId: user.id, error: auditError instanceof Error ? auditError.message : String(auditError) });
        }
      }, { timeout: 10000 });

      const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      await sendPasswordResetEmail(user.email!, user.name || "User", resetUrl);

      console.info("[AUDIT] Password reset email sent:", { userId: user.id, email, ip: clientIp, timestamp: new Date().toISOString() });
    } catch (emailError) {
      console.error("[ERROR] Failed to send password reset email:", { userId: user.id, email, error: emailError instanceof Error ? emailError.message : String(emailError) });
    }

    return NextResponse.json(
      { message: "If that email is registered with us, a password reset link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Forgot password request failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "An error occurred. Please try again later or contact support." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
}
