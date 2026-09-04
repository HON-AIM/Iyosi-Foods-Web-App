import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { type Metadata } from "next"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const release = await prisma.pressRelease.findUnique({ where: { slug, published: true }, select: { title: true, excerpt: true } }).catch(() => null)
  if (!release) return { title: "Not Found" }
  return { title: `${release.title} | Iyosi Foods LTD Press`, description: release.excerpt }
}

export default async function PressReleasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const release = await prisma.pressRelease.findUnique({ where: { slug, published: true } }).catch(() => null)
  if (!release) notFound()

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-12 px-4 md:px-8 border-b-8 border-accent-500">
        <div className="max-w-3xl mx-auto">
          <Link href="/media/press" className="text-primary-300 hover:text-white text-sm mb-4 inline-block">
            ← All Press Releases
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-semibold bg-accent-500/30 text-accent-300 px-2 py-0.5 rounded-full">
              {release.category}
            </span>
            {release.publishedAt && (
              <span className="text-sm text-primary-300">
                {format(new Date(release.publishedAt), "MMMM d, yyyy")}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">{release.title}</h1>
          <p className="text-primary-200 mt-3 text-sm font-medium">Iyosi Foods LTD — Official Press Release</p>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 py-12 w-full">
        {release.coverImage && (
          <img src={release.coverImage} alt={release.title}
            className="w-full rounded-xl mb-8 shadow-lg" />
        )}
        <div className="prose prose-lg max-w-none">
          {release.content.split("\n\n").map((para, i) => (
            <p key={i} className="text-surface-700 leading-relaxed mb-4">{para}</p>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-surface-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-surface-400">
            For media inquiries: <a href="mailto:iyosifoods@gmail.com" className="text-accent-600 hover:underline">iyosifoods@gmail.com</a>
          </p>
          <Link href="/media/press"
            className="text-sm font-semibold text-accent-600 hover:underline">
            ← Back to Press Releases
          </Link>
        </div>
      </article>
    </div>
  )
}
