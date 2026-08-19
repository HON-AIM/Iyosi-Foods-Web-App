import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Photo Gallery | Iyosiola Group",
  description: "Visual highlights and event images from Iyosiola Group.",
};

export default function GalleryPage() {
  const categories = [
    "Corporate Events",
    "_factory",
    "Community",
    "Awards",
    "Products",
  ];

  const galleryItems = [
    { title: "Annual General Meeting 2024", category: "Corporate Events", icon: "🏢" },
    { title: "Port Harcourt Facility Tour", category: "Corporate Events", icon: "🏭" },
    { title: "Flour Production Line", category: "_factory", icon: "🌾" },
    { title: "Rice Milling Operations", category: "_factory", icon: "🍚" },
    { title: "Sugar Refinery", category: "_factory", icon: "🧂" },
    { title: "Community Outreach Program", category: "Community", icon: "🤝" },
    { title: " farmers Training", category: "Community", icon: "👨‍🌾" },
    { title: "Industry Awards Ceremony", category: "Awards", icon: "🏆" },
    { title: "Product Showcase", category: "Products", icon: "📦" },
    { title: "Quality Inspection", category: "Products", icon: "✅" },
    { title: "Leadership Team", category: "Corporate Events", icon: "👔" },
    { title: "Distribution Center", category: "_factory", icon: "🚚" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Photo Gallery</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Visual highlights and event moments
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {categories.map((cat, i) => (
              <button
                key={i}
                className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-surface-200 hover:border-accent-500 hover:text-accent-600 transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {galleryItems.map((item, i) => (
              <div
                key={i}
                className="aspect-square bg-white rounded-xl shadow-sm border border-surface-100 hover:shadow-lg hover:border-accent-300 transition-all cursor-pointer flex flex-col items-center justify-center"
              >
                <span className="text-4xl mb-2">{item.icon}</span>
                <span className="text-xs text-center text-surface-700 px-2">{item.title}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-surface-500 text-sm mt-8">
            Click on an image to view larger version
          </p>
        </div>
      </section>

      <section className="bg-primary-50 py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-primary-900 mb-4">Share Your Moments</h2>
          <p className="text-surface-600 mb-6">
            Tag us on social media with #IyosiolaGroup to be featured
          </p>
        </div>
      </section>
    </div>
  );
}