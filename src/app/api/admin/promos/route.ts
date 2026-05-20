import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { type NextRequest } from "next/server";
import { adminLimiter } from "@/lib/admin-rate-limiter";

/**
 * GET /api/admin/promos
 * Fetch all promotional banners (public for shop)
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

    const promos = await prisma.promoBanner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ promos }, { status: 200 });
  } catch (error) {
    console.error("[ERROR] Fetch promos failed:", error);
    return NextResponse.json(
      { message: "Failed to fetch promos" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/promos
 * Create a promotional banner
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
    const { title, subtitle, link, bgGradient, icon, sortOrder } = body;

    if (!title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    const promo = await prisma.promoBanner.create({
      data: {
        title,
        subtitle: subtitle || null,
        link: link || "/shop",
        bgGradient: bgGradient || "from-orange-500 to-red-500",
        icon: icon || "Zap",
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ message: "Promo created", promo }, { status: 201 });
  } catch (error) {
    console.error("[ERROR] Create promo failed:", error);
    return NextResponse.json({ message: "Failed to create promo" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/promos
 * Update a promotional banner
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
      return NextResponse.json({ message: "Promo ID is required" }, { status: 400 });
    }

    const promo = await prisma.promoBanner.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: "Promo updated", promo }, { status: 200 });
  } catch (error) {
    console.error("[ERROR] Update promo failed:", error);
    return NextResponse.json({ message: "Failed to update promo" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/promos
 * Delete a promotional banner
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
      return NextResponse.json({ message: "Promo ID is required" }, { status: 400 });
    }

    await prisma.promoBanner.delete({ where: { id } });

    return NextResponse.json({ message: "Promo deleted" }, { status: 200 });
  } catch (error) {
    console.error("[ERROR] Delete promo failed:", error);
    return NextResponse.json({ message: "Failed to delete promo" }, { status: 500 });
  }
}
