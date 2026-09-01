import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const BlogSchema = z.object({
  title: z.string().min(5).max(200).trim(),
  slug: z
    .string()
    .min(3)
    .max(100)
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  author: z
    .string()
    .min(2)
    .max(100)
    .trim()
    .default("Iyosi Foods LTD Team"),
  category: z.string().min(2).max(50).trim(),
  excerpt: z.string().min(10).max(500).trim(),
  content: z.string().min(50).trim(),
  coverImage: z.string().url().optional().nullable(),
  readTime: z.string().max(20).default("5 min read"),
  published: z.boolean().default(false),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const blogs = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ blogs });
  } catch (error) {
    console.error(
      "[ERROR] Fetch blogs failed:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ message: "Failed to fetch blogs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json().catch(() => null);
    const result = BlogSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: result.error.issues },
        { status: 400 }
      );
    }
    const blog = await prisma.blogPost.create({
      data: {
        ...result.data,
        publishedAt: result.data.published ? new Date() : null,
      },
    });
    return NextResponse.json({ blog }, { status: 201 });
  } catch (error) {
    console.error(
      "[ERROR] Create blog failed:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ message: "Failed to create blog" }, { status: 500 });
  }
}