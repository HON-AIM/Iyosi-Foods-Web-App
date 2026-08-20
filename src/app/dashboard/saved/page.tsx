import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import SavedItemsClient from "./SavedItemsClient"

export const dynamic = "force-dynamic"

export default async function SavedItemsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const savedItems = await prisma.savedItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: { id: true, name: true, price: true, image: true, stock: true, category: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return <SavedItemsClient initialItems={savedItems} />
}
