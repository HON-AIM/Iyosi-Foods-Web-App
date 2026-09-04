import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const PressSchema = z.object({
  title: z.string().min(5).max(300).trim(),
  slug: z.string().min(3).max(120).trim().toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  category: z.string().min(2).max(80).trim(),
  excerpt: z.string().min(10).max(600).trim(),
  content: z.string().min(30).trim(),
  coverImage: z.string().url().optional().nullable(),
  published: z.boolean().default(false),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const releases = await prisma.pressRelease.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json({ releases })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const body = await request.json().catch(() => null)
  const result = PressSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ message: "Validation failed", errors: result.error.issues }, { status: 400 })
  const release = await prisma.pressRelease.create({
    data: { ...result.data, publishedAt: result.data.published ? new Date() : null }
  })
  return NextResponse.json({ release }, { status: 201 })
}
