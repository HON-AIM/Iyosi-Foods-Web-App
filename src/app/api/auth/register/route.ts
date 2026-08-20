import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma, TransactionClient } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";
import { type NextRequest } from "next/server";
import { registrationLimiter, checkLimit } from "@/lib/redis-rate-limiter";
import { RegisterSchema } from "@/schemas/auth.schema";

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
    const { success, resetAt } = await checkLimit(registrationLimiter, ip);
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
      return NextResponse.json(
        {
          message: "Too many registration attempts. Please try again later.",
          retryAfter,
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
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
      newUser = await prisma.$transaction(async (tx: TransactionClient) => {
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

        // Check if the existing user is already verified
        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, emailVerified: true, name: true },
        });

        if (existingUser?.emailVerified) {
          return NextResponse.json(
            { message: "This email is already registered and verified. Please log in." },
            { status: 409 }
          );
        }

        // User exists but not verified — auto-resend verification email
        try {
          const newToken = crypto.randomBytes(VERIFICATION_TOKEN_LENGTH).toString("hex");
          const newTokenHash = crypto.createHash("sha256").update(newToken).digest("hex");
          const newTokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

          await prisma.$transaction(async (tx: TransactionClient) => {
            // Delete old verification tokens for this user
            await tx.verificationToken.deleteMany({ where: { identifier: email } });

            // Store new token on User
            await tx.user.update({
              where: { id: existingUser!.id },
              data: {
                verificationToken: newTokenHash,
                verificationTokenExpires: newTokenExpiry,
              },
            });

            // Store new token in VerificationToken table
            await tx.verificationToken.create({
              data: {
                identifier: email,
                token: newTokenHash,
                expires: newTokenExpiry,
              },
            });
          }, { timeout: 10000 });

          // Send new verification email
          const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3001"}/verify?token=${newToken}&email=${encodeURIComponent(email)}`;
          await sendVerificationEmail(email, existingUser!.name || "User", verificationUrl);
          console.info("[AUDIT] Re-sent verification email for existing unverified account:", { email, ip: clientIp });

          return NextResponse.json(
            { message: "An account with this email exists but is not verified. A new verification email has been sent. Please check your inbox." },
            { status: 200 }
          );
        } catch (resendError) {
          console.error("[ERROR] Failed to resend verification email:", { email, error: resendError instanceof Error ? resendError.message : String(resendError) });
          return NextResponse.json(
            { message: "An account with this email exists but is not verified. We could not resend the verification email. Please try again later." },
            { status: 500 }
          );
        }
      }
      throw txError;
    }

    const token = crypto.randomBytes(VERIFICATION_TOKEN_LENGTH).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const tokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

    try {
      await prisma.$transaction(async (tx: TransactionClient) => {
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

    let emailSent = false;
    try {
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3001"}/verify?token=${token}&email=${encodeURIComponent(email)}`;
      await sendVerificationEmail(email, name, verificationUrl);
      emailSent = true;
      console.info("[AUDIT] Registration email sent:", { userId: newUser.id, email, ip: clientIp, timestamp: new Date().toISOString() });
    } catch (emailError) {
      console.error("[ERROR] Failed to send verification email:", { userId: newUser.id, email, error: emailError instanceof Error ? emailError.message : String(emailError) });
    }

    const response = NextResponse.json(
      {
        message: emailSent
          ? "Account created successfully. Please check your email to verify your account."
          : "Account created but we could not send the verification email. Please use the resend button on the login page.",
        userId: newUser.id,
        emailSent,
      },
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
