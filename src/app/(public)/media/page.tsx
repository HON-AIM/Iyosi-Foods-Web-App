import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Media & Updates | Iyosiola Group",
  description: "Latest news, press releases, blog articles, and media updates from Iyosiola Group.",
};

export default function MediaPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Media & Updates</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Stay informed about our latest news and activities
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">
            Media Hub
          </h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-12 text-center">
            Browse through our news updates, announcements, and media assets to stay informed about our activities, 
            achievements, and initiatives across Nigeria.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/media/press" className="group p-6 bg-white rounded-xl shadow-sm border border-surface-100 hover:shadow-lg hover:border-accent-300 transition-all text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">📰</span>
              </div>
              <h3 className="text-lg font-bold text-primary-900 mb-2 group-hover:text-accent-600 transition-colors">
                Press Releases
              </h3>
              <p className="text-surface-600 text-sm">
                Official announcements and corporate news
              </p>
            </Link>

            <Link href="/media/blogs" className="group p-6 bg-white rounded-xl shadow-sm border border-surface-100 hover:shadow-lg hover:border-accent-300 transition-all text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">📝</span>
              </div>
              <h3 className="text-lg font-bold text-primary-900 mb-2 group-hover:text-accent-600 transition-colors">
                Blogs & Articles
              </h3>
              <p className="text-surface-600 text-sm">
                Insights, stories, and thought pieces
              </p>
            </Link>

            <Link href="/media/gallery" className="group p-6 bg-white rounded-xl shadow-sm border border-surface-100 hover:shadow-lg hover:border-accent-300 transition-all text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">📸</span>
              </div>
              <h3 className="text-lg font-bold text-primary-900 mb-2 group-hover:text-accent-600 transition-colors">
                Photo Gallery
              </h3>
              <p className="text-surface-600 text-sm">
                Visual highlights and event images
              </p>
            </Link>

            <Link href="/media/social" className="group p-6 bg-white rounded-xl shadow-sm border border-surface-100 hover:shadow-lg hover:border-accent-300 transition-all text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="text-lg font-bold text-primary-900 mb-2 group-hover:text-accent-600 transition-colors">
                Social Media
              </h3>
              <p className="text-surface-600 text-sm">
                Connect with us on social platforms
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-8 text-center">Latest News</h2>
          <div className="space-y-4">
            {[
              {
                title: "Iyosiola Group Reports Record Growth in 2024",
                date: "March 2024",
                category: "Corporate News",
                excerpt: "Achieving unprecedented revenue growth and expanding our distribution network across Nigeria.",
              },
              {
                title: "New Flour Milling Facility Opens in Port Harcourt",
                date: "February 2024",
                category: "Expansion",
                excerpt: "State-of-the-art facility to increase production capacity and meet growing demand.",
              },
              {
                title: "Iyosiola Group Wins Industry Excellence Award",
                date: "January 2024",
                category: "Awards",
                excerpt: "Recognized for outstanding contributions to Nigeria's food security.",
              },
            ].map((news, i) => (
              <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-surface-100 hover:border-accent-300 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-medium text-accent-600 bg-accent-50 px-2 py-1 rounded">{news.category}</span>
                  <span className="text-xs text-surface-500">{news.date}</span>
                </div>
                <h3 className="text-base font-bold text-primary-900 mb-1">{news.title}</h3>
                <p className="text-sm text-surface-600">{news.excerpt}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16 text-center">
        <h2 className="text-2xl font-bold text-primary-900 mb-4">Stay Connected</h2>
        <p className="text-surface-600 mb-6 max-w-xl mx-auto">
          Follow us on social media for real-time updates
        </p>
        <div className="flex justify-center gap-4">
          <a href="#" className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors">
            <span className="sr-only">Facebook</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a href="#" className="bg-sky-500 hover:bg-sky-600 text-white p-3 rounded-full transition-colors">
            <span className="sr-only">Twitter</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
          </a>
          <a href="#" className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-full transition-colors">
            <span className="sr-only">Instagram</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.468 2.53c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/></svg>
          </a>
          <a href="#" className="bg-blue-700 hover:bg-blue-800 text-white p-3 rounded-full transition-colors">
            <span className="sr-only">LinkedIn</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
        </div>
      </section>

      <section className="bg-primary-900 text-white py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Media Inquiries</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          For media inquiries and interview requests, please contact our corporate communications team
        </p>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Contact Us
        </Link>
      </section>
    </div>
  );
}
