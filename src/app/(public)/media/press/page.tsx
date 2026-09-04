import { prisma } from "@/lib/db"
import Link from "next/link"
import { type Metadata } from "next"
import { format } from "date-fns"
import { FileText } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Press Releases | Iyosi Foods LTD",
  description: "Official press releases and announcements from Iyosi Foods LTD.",
}

export default async function PressPage() {
  const releases = await prisma.pressRelease.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, slug: true, category: true,
              excerpt: true, publishedAt: true, coverImage: true },
  }).catch(() => [])

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Press Releases</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Official announcements and corporate news from Iyosi Foods LTD
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        {releases.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-surface-300" />
            </div>
            <h2 className="text-2xl font-bold text-primary-900 mb-3">No Press Releases Yet</h2>
            <p className="text-surface-600">Check back soon for official announcements from Iyosi Foods LTD.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-5">
            {releases.map((release) => (
              <article key={release.id}
                className="bg-white p-6 rounded-xl shadow-sm border border-surface-100 hover:border-accent-300 hover:shadow-md transition-all">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-accent-700 bg-accent-50 px-3 py-1 rounded-full">
                    {release.category}
                  </span>
                  {release.publishedAt && (
                    <span className="text-sm text-surface-500">
                      {format(new Date(release.publishedAt), "MMMM yyyy")}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-primary-900 mb-2 leading-snug">{release.title}</h2>
                <p className="text-surface-600 mb-4 leading-relaxed">{release.excerpt}</p>
                <Link
                  href={`/media/press/${release.slug}`}
                  className="inline-flex items-center gap-1 text-accent-600 font-semibold hover:text-accent-700 hover:underline text-sm"
                >
                  Read Full Release →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="bg-primary-50 py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-primary-900 mb-4">Media Inquiries</h2>
          <p className="text-surface-600 mb-6">
            For press inquiries and interview requests, contact our communications team
          </p>
          <Link href="/contact"
            className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  )
}
