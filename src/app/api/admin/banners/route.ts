import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { type NextRequest } from "next/server";
import { adminLimiter } from "@/lib/admin-rate-limiter";

/**
 * GET /api/admin/banners
 * Fetch all hero banners (public for shop, ordered by sortOrder)
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
    const allowed = await adminLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const banners = await prisma.heroBanner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ banners }, { status: 200 });
  } catch (error) {
    console.error("[ERROR] Fetch banners failed:", error);
    return NextResponse.json(
      { message: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/banners
 * Create a new hero banner
 * @requires Admin role
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
    const allowed = await adminLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, subtitle, ctaText, ctaLink, badgeText, bgColor, textColor, image, sortOrder } = body;

    if (!title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    const banner = await prisma.heroBanner.create({
      data: {
        title,
        subtitle: subtitle || null,
        ctaText: ctaText || "SHOP NOW",
        ctaLink: ctaLink || "/shop",
        badgeText: badgeText || null,
        bgColor: bgColor || "#1e3a8a",
        textColor: textColor || "#ffffff",
        image: image || null,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ message: "Banner created", banner }, { status: 201 });
  } catch (error) {
    console.error("[ERROR] Create banner failed:", error);
    return NextResponse.json({ message: "Failed to create banner" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/banners
 * Update a hero banner
 * @requires Admin role
 */
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
    const allowed = await adminLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ message: "Banner ID is required" }, { status: 400 });
    }

    const banner = await prisma.heroBanner.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: "Banner updated", banner }, { status: 200 });
  } catch (error) {
    console.error("[ERROR] Update banner failed:", error);
    return NextResponse.json({ message: "Failed to update banner" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/banners
 * Delete a hero banner
 * @requires Admin role
 */
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
    const allowed = await adminLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Banner ID is required" }, { status: 400 });
    }

    await prisma.heroBanner.delete({ where: { id } });

    return NextResponse.json({ message: "Banner deleted" }, { status: 200 });
  } catch (error) {
    console.error("[ERROR] Delete banner failed:", error);
    return NextResponse.json({ message: "Failed to delete banner" }, { status: 500 });
  }
}
