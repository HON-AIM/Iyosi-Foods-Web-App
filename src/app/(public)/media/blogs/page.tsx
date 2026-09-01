import { prisma } from "@/lib/db";
import Link from "next/link";
import { type Metadata } from "next";
import { format } from "date-fns";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blogs & Articles | Iyosi Foods LTD",
  description: "Insights, stories, and thought pieces from Iyosi Foods LTD.",
};

export default async function BlogsPage() {
  const blogs = await prisma.blogPost
    .findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        author: true,
        category: true,
        excerpt: true,
        readTime: true,
        publishedAt: true,
        coverImage: true,
      },
    })
    .catch(() => []);

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Blogs & Articles</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Insights, stories, and thought pieces from Iyosi Foods LTD
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        {blogs.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-primary-900 mb-3">Coming Soon</h2>
            <p className="text-surface-600">
              Our team is working on insightful articles. Check back soon!
            </p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <article
                key={blog.id}
                className="bg-white rounded-xl shadow-sm border border-surface-100 hover:shadow-md transition-shadow overflow-hidden"
              >
                {blog.coverImage && (
                  <div className="h-48 relative overflow-hidden">
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full">
                      {blog.category}
                    </span>
                    {blog.publishedAt && (
                      <span className="text-xs text-surface-400">
                        {format(new Date(blog.publishedAt), "MMM yyyy")}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-primary-900 mb-2 line-clamp-2">
                    {blog.title}
                  </h2>
                  <p className="text-sm text-surface-600 mb-4 line-clamp-3">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-400">{blog.readTime}</span>
                    <Link
                      href={`/media/blogs/${blog.slug}`}
                      className="text-sm font-semibold text-accent-600 hover:text-accent-700 hover:underline flex items-center gap-1"
                    >
                      Read Article →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}