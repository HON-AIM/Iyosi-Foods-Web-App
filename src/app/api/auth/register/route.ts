import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";
import { z } from "zod";
import { type NextRequest } from "next/server";
import { registrationLimiter, createRateLimitResponse, setRateLimitHeaders } from "@/lib/rate-limiter";

const RegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .trim()
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z
    .string()
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least one special character"),
});

const VERIFICATION_TOKEN_LENGTH = 64;
const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    if (request.method !== "POST") {
      return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
    }

    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request.headers.get("x-real-ip") ||
               "unknown";
    const isAllowed = await registrationLimiter.check(ip);
    if (!isAllowed) {
      const remaining = registrationLimiter.getRemaining(ip);
      const resetTime = registrationLimiter.getResetTime(ip);
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

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      return NextResponse.json({ message: "Bad Request: Invalid JSON" }, { status: 400 });
    }

    if (!parsedBody || typeof parsedBody !== "object") {
      return NextResponse.json({ message: "Bad Request: Invalid request body" }, { status: 400 });
    }

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const parseResult = RegisterSchema.safeParse(parsedBody);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return NextResponse.json({ message: "Validation failed", errors }, { status: 400 });
    }

    const { name, email, password } = parseResult.data;

    let newUser;
    try {
      newUser = await prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: { email },
          select: { id: true },
        });

        if (existingUser) {
          throw new Error("EMAIL_EXISTS");
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: "USER",
            isActive: true,
          },
          select: {
            id: true,
            email: true,
            name: true,
          },
        });

        return user;
      }, { timeout: 10000 });
    } catch (txError) {
      if (txError instanceof Error && txError.message === "EMAIL_EXISTS") {
        console.warn("[WARN] Registration attempt with existing email:", { email, ip: clientIp, timestamp: new Date().toISOString() });
        return NextResponse.json(
          { message: "Account created successfully. Please check your email to verify your account.", userId: "hidden" },
          { status: 201 }
        );
      }
      throw txError;
    }

    const token = crypto.randomBytes(VERIFICATION_TOKEN_LENGTH).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const tokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: newUser.id },
          data: {
            verificationToken: tokenHash,
            verificationTokenExpires: tokenExpiry,
          },
        });

        await tx.verificationToken.create({
          data: {
            identifier: email,
            token: tokenHash,
            expires: tokenExpiry,
          },
        });

        try {
          await tx.registrationLog.create({
            data: {
              userId: newUser.id,
              email,
              ipAddress: clientIp,
              userAgent: request.headers.get("user-agent") || "unknown",
            },
          });
        } catch (auditError) {
          console.warn("[WARN] Failed to log registration:", { userId: newUser.id, error: auditError instanceof Error ? auditError.message : String(auditError) });
        }
      }, { timeout: 10000 });
    } catch (tokenError) {
      console.error("[ERROR] Failed to create verification token:", { userId: newUser.id, error: tokenError instanceof Error ? tokenError.message : String(tokenError) });
    }

    try {
      const verificationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify?token=${token}&email=${encodeURIComponent(email)}`;
      await sendVerificationEmail(email, name, verificationUrl);
      console.info("[AUDIT] Registration email sent:", { userId: newUser.id, email, ip: clientIp, timestamp: new Date().toISOString() });
    } catch (emailError) {
      console.error("[ERROR] Failed to send verification email:", { userId: newUser.id, email, error: emailError instanceof Error ? emailError.message : String(emailError) });
    }

    const response = NextResponse.json(
      { message: "Account created successfully. Please check your email to verify your account.", userId: newUser.id },
      { status: 201 }
    );
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("X-Content-Type-Options", "nosniff");

    return response;
  } catch (error) {
    console.error("[ERROR] Registration failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ message: "An error occurred during registration. Please try again later." }, { status: 500 });
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
