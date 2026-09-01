import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Photo Gallery | Iyosi Foods LTD",
  description: "Visual highlights and event images from Iyosi Foods LTD.",
};

export default function GalleryPage() {
  const categories = [
    "Corporate Events",
    "Factory",
    "Community",
    "Awards",
    "Products",
  ];

  // ⚡ TO ADD REAL PHOTOS: Replace image: null with the actual image URL
  // Upload images via Admin → Products (upload endpoint) and paste the blob URL here
  // Future enhancement: Move this to a DB model for full admin control
  const galleryItems = [
    { title: "Annual General Meeting 2025", category: "Corporate Events", icon: "🏢", image: null },
    { title: "Port Harcourt Facility Tour", category: "Corporate Events", icon: "🏭", image: null },
    { title: "Flour Production Line", category: "Factory", icon: "🌾", image: null },
    { title: "Rice Milling Operations", category: "Factory", icon: "🍚", image: null },
    { title: "Sugar Refinery", category: "Factory", icon: "🧂", image: null },
    { title: "Community Outreach Program", category: "Community", icon: "🤝", image: null },
    { title: "Farmers Training", category: "Community", icon: "👨‍🌾", image: null },
    { title: "Industry Awards Ceremony", category: "Awards", icon: "🏆", image: null },
    { title: "Product Showcase", category: "Products", icon: "📦", image: null },
    { title: "Quality Inspection", category: "Products", icon: "✅", image: null },
    { title: "Leadership Team", category: "Corporate Events", icon: "👔", image: null },
    { title: "Distribution Center", category: "Factory", icon: "🚚", image: null },
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
        <div className="max-w-5xl mx-auto">
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
                className="group aspect-square bg-white rounded-xl shadow-sm border border-surface-100 hover:shadow-lg hover:border-accent-300 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center relative"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <span className="text-4xl mb-2">{item.icon}</span>
                    <span className="text-xs text-surface-600 font-medium">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-surface-400 mt-0.5 uppercase tracking-wide">
                      {item.category}
                    </span>
                  </div>
                )}
                {item.image && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <span className="text-white text-xs font-semibold">
                      {item.title}
                    </span>
                  </div>
                )}
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
            Tag us on social media with #IyosiFoodsLTD to be featured
          </p>
        </div>
      </section>
    </div>
  );
}