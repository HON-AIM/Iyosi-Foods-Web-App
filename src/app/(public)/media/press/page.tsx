import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Press Releases | Iyosiola Group",
  description: "Official press releases and announcements from Iyosiola Group.",
};

export default function PressPage() {
  const pressReleases = [
    {
      title: "Iyosiola Group Reports Record Revenue Growth in 2024",
      date: "March 2024",
      category: "Financial Results",
      excerpt: "Achieving unprecedented revenue growth of over 20% and expanding our distribution network across all 36 states in Nigeria. Profit after tax rises significantly.",
    },
    {
      title: "Iyosiola Group Expands Flour Milling Operations",
      date: "February 2024",
      category: "Expansion",
      excerpt: "Commissioning of new state-of-the-art flour milling facility in Port Harcourt to increase production capacity and meet growing market demand.",
    },
    {
      title: "Iyosiola Group Wins Multiple Industry Awards",
      date: "January 2024",
      category: "Awards",
      excerpt: "Recognized as Best FMCG Brand and Most Trusted Food Company at the annual Industry Excellence Awards ceremony.",
    },
    {
      title: "New Rice Mill Facility Opens in Kano",
      date: "December 2023",
      category: "Expansion",
      excerpt: "One of Nigeria's largest rice mills now operational, supporting local farmers and food security initiatives.",
    },
    {
      title: "Iyosiola Group Partners with Local Farmers",
      date: "November 2023",
      category: "Partnership",
      excerpt: "Signing of out-grower scheme agreements with over 50,000 rice farmers in Kano and Jigawa states.",
    },
    {
      title: "Iyosiola Group Achieves ISO Certification",
      date: "October 2023",
      category: "Quality",
      excerpt: "Company achieves ISO 9001:2015 and FSSC 22000 certifications for quality and food safety management systems.",
    },
    {
      title: "Launch of New Product Lines",
      date: "September 2023",
      category: "Product Launch",
      excerpt: "Introduction of new premium flour and semolina product lines to meet diverse customer needs.",
    },
    {
      title: "Corporate Responsibility Initiative",
      date: "August 2023",
      category: "CSR",
      excerpt: "Donation of educational materials and healthcare supplies to communities in operational areas.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Press Releases</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Official announcements and corporate news
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-lg text-surface-700 leading-relaxed mb-12 text-center">
            Stay updated with the latest news, announcements, and developments from Iyosiola Group. 
            Our press releases cover financial results, expansions, partnerships, awards, and corporate initiatives.
          </p>

          <div className="space-y-6">
            {pressReleases.map((release, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-surface-100 hover:border-accent-300 transition-colors">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-accent-600 bg-accent-50 px-3 py-1 rounded-full">
                    {release.category}
                  </span>
                  <span className="text-sm text-surface-500">{release.date}</span>
                </div>
                <h3 className="text-lg font-bold text-primary-900 mb-2">
                  {release.title}
                </h3>
                <p className="text-surface-600">{release.excerpt}</p>
                <Link href="#" className="inline-flex items-center text-accent-600 font-medium mt-3 hover:underline">
                  Read More <span className="ml-1">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-primary-900 mb-4">Media Inquiries</h2>
          <p className="text-surface-600 mb-6">
            For press inquiries and interview requests, please contact our corporate communications team
          </p>
          <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}