import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const release = await prisma.pressRelease.update({
    where: { id },
    data: { ...body, publishedAt: body.published ? new Date() : null },
  })
  return NextResponse.json({ release })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.pressRelease.delete({ where: { id } })
  return NextResponse.json({ message: "Deleted" })
}
