import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { type NextRequest } from "next/server";
import { passwordResetLimiter, createRateLimitResponse, setRateLimitHeaders } from "@/lib/rate-limiter";

const ResetPasswordSchema = z
  .object({
    token: z.string().min(64).max(64),
    email: z.string().email("Invalid email address").toLowerCase().trim(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const TOKEN_EXPIRY = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request.headers.get("x-real-ip") ||
               "unknown";
    const isAllowed = await passwordResetLimiter.check(ip);
    if (!isAllowed) {
      const remaining = passwordResetLimiter.getRemaining(ip);
      const resetTime = passwordResetLimiter.getResetTime(ip);
      const response = NextResponse.json(
        createRateLimitResponse(remaining, resetTime),
        { status: 429 }
      );
      setRateLimitHeaders(response, remaining, resetTime);
      return response;
    }

    const body = await request.text();
    if (!body || body.length === 0 || body.length > 10000) {
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

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const parseResult = ResetPasswordSchema.safeParse(parsedBody);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return NextResponse.json({ message: "Validation failed", errors }, { status: 400 });
    }

    const { token, email, password } = parseResult.data;

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    let resetResult;
    try {
      resetResult = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findFirst({
          where: {
            email,
            resetToken: tokenHash,
            resetTokenExpiry: { gt: new Date() },
            isActive: true,
          },
          select: { id: true, email: true, name: true },
        });

        if (!user) {
          throw new Error("INVALID_TOKEN");
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
          select: { id: true, email: true },
        });

        try {
          await tx.session.deleteMany({ where: { userId: user.id } });
        } catch (sessionError) {
          console.warn("[WARN] Failed to invalidate sessions:", { userId: user.id, error: sessionError instanceof Error ? sessionError.message : String(sessionError) });
        }

        return updatedUser;
      }, { timeout: 10000 });
    } catch (txError) {
      if (txError instanceof Error && txError.message === "INVALID_TOKEN") {
        console.warn("[WARN] Invalid password reset attempt:", { email, ip: clientIp, timestamp: new Date().toISOString() });
        return NextResponse.json({ message: "Invalid or expired reset link. Please request a new password reset." }, { status: 400 });
      }
      throw txError;
    }

    console.info("[AUDIT] Password reset completed:", { userId: resetResult.id, email, ip: clientIp, timestamp: new Date().toISOString() });

    const response = NextResponse.json(
      { message: "Password reset successfully. Please log in with your new password." },
      { status: 200 }
    );
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("X-Content-Type-Options", "nosniff");

    return response;
  } catch (error) {
    console.error("[ERROR] Password reset failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ message: "An error occurred while resetting the password. Please try again." }, { status: 500 });
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
