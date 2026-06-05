import { NextResponse } from "next/server";
import { prisma, TransactionClient } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { type NextRequest } from "next/server";
import { z } from "zod";
import crypto from "crypto";

const ResendSchema = z.object({
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

    const validation = ResendSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid email" },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user || user.emailVerified) {
      const _dummy = crypto.randomBytes(32).toString("hex");
      return NextResponse.json(
        { message: "If this email exists, a verification link has been sent." },
        { status: 200 }
      );
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    await prisma.$transaction(async (tx: TransactionClient) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          verificationToken: verificationTokenHash,
          verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      await tx.verificationToken.create({
        data: {
          identifier: email,
          token: verificationTokenHash,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    });

    try {
      const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3001"}/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;

      await sendVerificationEmail(email, user.name || "User", verificationLink);

      console.info("[AUDIT] Verification email resent:", {
        userId: user.id,
        email,
        timestamp: new Date().toISOString(),
      });
    } catch (emailError) {
      console.error("[ERROR] Failed to send verification email:", {
        error: emailError instanceof Error ? emailError.message : String(emailError),
        userId: user.id,
      });
    }

    return NextResponse.json(
      { message: "If this email exists, a verification link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Resend verification failed:", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { message: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
