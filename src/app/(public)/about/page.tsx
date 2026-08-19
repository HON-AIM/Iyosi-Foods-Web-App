import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Iyosiola Group | Premium Flour & Agro-Allied Products",
  description: "Learn about Iyosiola Group's legacy of excellence in Agriculture, Logistics, and Manufacturing across Africa.",
  keywords: "Iyosiola Group, flour milling, logistics, agro-allied, Nigerian company",
  openGraph: {
    title: "About Iyosiola Group",
    description: "A legacy of excellence. Driving value across Agriculture, Logistics, and Manufacturing.",
    type: "website",
    url: "https://iyosiolagroup.com/about",
    images: [
      {
        url: "/logo.jpg",
        width: 400,
        height: 400,
        alt: "Iyosiola Group Logo",
      },
    ],
  },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      {/* Header Section */}
      <section 
        className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500"
        role="banner"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 text-white">
          About Iyosiola Group
        </h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light leading-relaxed">
          A legacy of excellence. Driving value across Agriculture, Logistics, and Manufacturing.
        </p>
      </section>

      {/* Main Content Section */}
      <section className="container mx-auto px-4 py-12 md:py-16 flex flex-col md:flex-row gap-8 md:gap-12 items-center">
        {/* Logo Image */}
        <div className="md:w-1/2 flex justify-center order-2 md:order-1">
          <div className="relative w-full max-w-md aspect-square">
            <Image
              src="/logo.jpg"
              alt="Iyosiola Group Corporate Logo"
              fill
              priority
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
            />
          </div>
        </div>

        {/* Text Content */}
        <article className="md:w-1/2 text-surface-700 space-y-6 order-1 md:order-2">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-900 leading-tight">
            Our Corporate Heritage
          </h2>

          <div className="space-y-4 text-base md:text-lg leading-relaxed">
            <p>
              At <strong className="text-primary-900">Iyosiola Group</strong>, we are driven by a singular vision: 
              to be the cornerstone of Africa's economic development through diversified and sustainable business practices. 
              From our humble beginnings in agricultural trade, we have expanded into a formidable conglomerate.
            </p>

            <p>
              Our portfolio spans across essential sectors of the economy including state-of-the-art{" "}
              <strong className="text-primary-900">Flour Milling</strong>, integrated{" "}
              <strong className="text-primary-900">Logistics & Supply Chain</strong> networks, and expansive{" "}
              <strong className="text-primary-900">Agro-Allied</strong> investments. We are committed to delivering 
              uncompromised quality to our consumers and unparalleled value to our investors.
            </p>
          </div>

          {/* CTA Section */}
          <div className="pt-6 border-t-2 border-surface-200">
            <Link
              href="/contact"
              className="inline-flex items-center text-primary-600 font-bold hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded px-2 py-1 tracking-wide uppercase text-sm transition-colors duration-200"
              aria-label="Partner With The Group"
            >
              Partner With The Group
              <span className="ml-2" aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
      </section>

      {/* Additional Value Proposition Section */}
      <section className="bg-primary-50 py-12 md:py-16 px-4 md:px-8">
        <div className="container mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-primary-900 text-center mb-8">
            Why Choose Iyosiola Group?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h4 className="font-bold text-primary-900 mb-2">Quality Excellence</h4>
              <p className="text-surface-600 text-sm">Premium products</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h4 className="font-bold text-primary-900 mb-2">Sustainable Practices</h4>
              <p className="text-surface-600 text-sm">Environmentally responsible operations</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h4 className="font-bold text-primary-900 mb-2">Innovation & Efficiency</h4>
              <p className="text-surface-600 text-sm">Cutting-edge technology and processes</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
