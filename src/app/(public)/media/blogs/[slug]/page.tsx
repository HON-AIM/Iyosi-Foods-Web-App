import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { type Metadata } from "next";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await prisma.blogPost
    .findUnique({
      where: { slug, published: true },
      select: { title: true, excerpt: true },
    })
    .catch(() => null);
  if (!blog) return { title: "Article Not Found" };
  return { title: `${blog.title} | Iyosi Foods LTD`, description: blog.excerpt };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await prisma.blogPost
    .findUnique({
      where: { slug, published: true },
    })
    .catch(() => null);

  if (!blog) notFound();

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-12 px-4 md:px-8 border-b-8 border-accent-500">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/media/blogs"
            className="text-primary-300 hover:text-white text-sm mb-4 inline-block"
          >
            ← Back to Blogs
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold bg-accent-500/30 text-accent-300 px-2 py-0.5 rounded-full">
              {blog.category}
            </span>
            {blog.publishedAt && (
              <span className="text-xs text-primary-300">
                {format(new Date(blog.publishedAt), "MMMM d, yyyy")}
              </span>
            )}
            <span className="text-xs text-primary-300">• {blog.readTime}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{blog.title}</h1>
          <p className="text-primary-200">By {blog.author}</p>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 py-12 prose prose-lg">
        {blog.coverImage && (
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full rounded-xl mb-8 shadow-lg not-prose"
          />
        )}
        {/* Render content as simple paragraphs — upgrade to MDX later */}
        {blog.content.split("\n\n").map((para, i) => (
          <p key={i} className="text-surface-700 leading-relaxed mb-4">
            {para}
          </p>
        ))}
      </article>
    </div>
  );
}