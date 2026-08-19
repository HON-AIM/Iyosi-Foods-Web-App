import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blogs & Articles | Iyosiola Group",
  description: "Insights, stories, and thought pieces from Iyosiola Group.",
};

export default function BlogsPage() {
  const blogs = [
    {
      title: "The Future of Nigeria's Food Industry",
      author: "Executive Team",
      date: "March 2024",
      category: "Industry Insights",
      excerpt: "Exploring the trends and opportunities shaping Nigeria's food and agricultural sector in 2024 and beyond.",
      readTime: "5 min read",
    },
    {
      title: "Supporting Local Farmers: Our Out-Grower Scheme",
      author: "Operations Team",
      date: "February 2024",
      category: "Community",
      excerpt: "How our out-grower scheme is helping thousands of local farmers increase their incomes and improve food production.",
      readTime: "4 min read",
    },
    {
      title: "Quality Assurance: From Farm to Table",
      author: "Quality Team",
      date: "February 2024",
      category: "Quality",
      excerpt: "Understanding the rigorous quality control processes that ensure our products meet the highest standards.",
      readTime: "6 min read",
    },
    {
      title: "Sustainable Agriculture and Food Security",
      author: "Sustainability Team",
      date: "January 2024",
      category: "Sustainability",
      excerpt: "Our commitment to sustainable farming practices and how they contribute to Nigeria's food security.",
      readTime: "5 min read",
    },
    {
      title: "The Role of Agro-Allied Industries in Economic Development",
      author: "Business Development",
      date: "January 2024",
      category: "Economic Impact",
      excerpt: "How agro-allied industries are driving economic growth and creating jobs across Nigeria.",
      readTime: "4 min read",
    },
    {
      title: "Innovation in Food Processing Technology",
      author: "Technology Team",
      date: "December 2023",
      category: "Technology",
      excerpt: "Exploring the latest technology in food processing and how Iyosiola Group is adopting innovation.",
      readTime: "5 min read",
    },
    {
      title: "Nutrition and Food Safety: What You Need to Know",
      author: "Food Safety Team",
      date: "December 2023",
      category: "Health",
      excerpt: "Understanding food safety standards and how we ensure nutritious, safe products for families.",
      readTime: "4 min read",
    },
    {
      title: "Building a Sustainable Supply Chain",
      author: "Supply Chain Team",
      date: "November 2023",
      category: "Operations",
      excerpt: "Our approach to building a resilient and sustainable supply chain across Nigeria.",
      readTime: "5 min read",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Blogs & Articles</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Insights, stories, and thought pieces
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-lg text-surface-700 leading-relaxed mb-12 text-center">
            Explore our collection of articles covering industry insights, company stories, 
            sustainability initiatives, and thought leadership from the Iyosiola Group team.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blogs.map((blog, index) => (
              <article key={index} className="bg-white p-6 rounded-xl shadow-sm border border-surface-100 hover:border-accent-300 transition-colors">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-accent-600 bg-accent-50 px-2 py-1 rounded">
                    {blog.category}
                  </span>
                  <span className="text-xs text-surface-500">•</span>
                  <span className="text-xs text-surface-500">{blog.date}</span>
                </div>
                <h3 className="text-lg font-bold text-primary-900 mb-2 line-clamp-2">
                  {blog.title}
                </h3>
                <p className="text-surface-600 text-sm mb-4 line-clamp-3">
                  {blog.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-surface-500">By {blog.author}</span>
                  <span className="text-xs text-surface-500">{blog.readTime}</span>
                </div>
                <Link href="#" className="inline-flex items-center text-accent-600 font-medium mt-3 hover:underline">
                  Read Article <span className="ml-1">→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-primary-900 mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-surface-600 mb-6">
            Get the latest articles and updates delivered to your inbox
          </p>
          <form className="flex flex-wrap justify-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 min-w-[200px] px-4 py-3 rounded-lg border border-surface-200 focus:outline-none focus:border-accent-500"
            />
            <button type="submit" className="bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}