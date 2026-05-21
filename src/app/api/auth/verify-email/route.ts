import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { type NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";

const VerifyEmailSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Invalid request" },
        { status: 400 }
      );
    }

    const validation = VerifyEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid verification data" },
        { status: 400 }
      );
    }

    const { token, email } = validation.data;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Check VerificationToken table first (primary storage from register)
    const verificationRecord = await prisma.verificationToken.findUnique({
      where: { token: tokenHash },
    });

    if (verificationRecord) {
      if (new Date() > verificationRecord.expires) {
        await prisma.verificationToken.delete({ where: { token: tokenHash } });
        return NextResponse.json(
          { message: "Verification link has expired" },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { email: verificationRecord.identifier },
        data: { emailVerified: new Date() },
      });

      await prisma.verificationToken.delete({ where: { token: tokenHash } });

      return NextResponse.json(
        { message: "Email verified successfully! You can now sign in." },
        { status: 200 }
      );
    }

    // Fallback: check User model (used by resend-verification route)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        verificationToken: true,
        verificationTokenExpires: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 400 }
      );
    }

    if (user.verificationToken !== tokenHash) {
      return NextResponse.json(
        { message: "Invalid verification link" },
        { status: 400 }
      );
    }

    if (
      !user.verificationTokenExpires ||
      new Date() > user.verificationTokenExpires
    ) {
      return NextResponse.json(
        { message: "Verification link has expired" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    console.info("[AUDIT] Email verified:", {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "Email verified successfully! You can now sign in." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Email verification failed:", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { message: "An error occurred during verification. Please try again later." },
      { status: 500 }
    );
  }
}