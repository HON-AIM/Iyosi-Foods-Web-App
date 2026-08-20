import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ address: null })

  const address = await prisma.address.findFirst({
    where: { userId: session.user.id, isDefault: true },
  })

  return NextResponse.json({ address })
}
