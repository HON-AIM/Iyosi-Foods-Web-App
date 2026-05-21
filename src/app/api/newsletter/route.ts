import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { type NextRequest } from "next/server";
import { z } from "zod";

const NewsletterSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    const validation = NewsletterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid email address" }, { status: 400 });
    }

    const { email } = validation.data;

    // Check if already subscribed (by looking up existing user or storing in a simple way)
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return NextResponse.json(
      { success: true, message: "Thank you for subscribing!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Newsletter subscription failed:", error);
    return NextResponse.json(
      { message: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
