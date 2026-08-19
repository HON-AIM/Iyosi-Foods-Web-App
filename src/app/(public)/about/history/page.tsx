import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our History | Iyosiola Group",
  description: "Discover the journey of Iyosiola Group from humble beginnings to becoming a leader in Nigeria's food industry.",
};

export default function HistoryPage() {
  const timeline = [
    { year: "2015", title: "Foundation", desc: "Iyosiola Group was established as a trading company to undertake importation of food products and agricultural produce." },
    { year: "2017", title: "Entry into Flour Milling", desc: "We ventured into flour milling operations, establishing state-of-the-art processing facilities." },
    { year: "2019", title: "Expansion into Rice", desc: "Incorporated Iyosiola Rice Limited to source and distribute premium quality rice across Nigeria." },
    { year: "2021", title: "Diversification", desc: "Expanded operations to include Edible Oils and Agro-Allied products, becoming a full-line FMCG company." },
    { year: "2022", title: "Distribution Network", desc: "Established nationwide distribution network with strategic partnerships across all 36 states." },
    { year: "2023", title: "Growth & Recognition", desc: "Achieved significant market share and industry recognition for quality products." },
    { year: "2024", title: "Market Leadership", desc: "Positioned as a leading food company serving households and businesses across Nigeria." },
    { year: "2025", title: "Future Vision", desc: "Continuing to expand our reach and impact, nourishing lives across Nigeria and beyond." },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Our History</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          A journey of growth, innovation, and commitment to excellence
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">Our Journey</h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-12 text-center">
            Our journey started with the edible oils business following the acquisition of processing facilities in the year 2015. 
            Subsequently, we ventured into the refining and processing of flour through Iyosiola Flour Limited. Iyosiola Rice Limited was incorporated in 2019, 
            while Iyosiola Pasta and Agro-Allied divisions were established in 2021.
          </p>

          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-accent-500 transform md:-translate-x-1/2"></div>
            
            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-accent-500 rounded-full transform -translate-x-1/2 z-10"></div>
                  
                  <div className={`ml-12 md:ml-0 md:w-5/12 ${index % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8 md:text-left'}`}>
                    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 md:border-l-0 border-accent-500">
                      <span className="text-accent-600 font-bold text-sm">{item.year}</span>
                      <h3 className="text-lg font-bold text-primary-900">{item.title}</h3>
                      <p className="text-surface-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                  
                  <div className="hidden md:block md:w-5/12"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">Milestones & Achievements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { year: "2017", title: "First Flour Mill", desc: "Established first flour milling facility" },
              { year: "2019", title: "Rice Division", desc: "Launched rice distribution" },
              { year: "2021", title: "FMCG Status", desc: "Full FMCG operations" },
              { year: "2022", title: "36 States", desc: "Nationwide coverage" },
              { year: "2023", title: "Awards", desc: "Industry recognition" },
              { year: "2024", title: "Growth", desc: "Market expansion" },
            ].map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm text-center">
                <span className="text-accent-600 font-bold text-xl block mb-1">{item.year}</span>
                <h3 className="font-bold text-primary-900">{item.title}</h3>
                <p className="text-surface-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-4">Our Journey Continues</h2>
        <p className="text-surface-600 mb-6 max-w-2xl mx-auto">
          Today, Iyosiola Group stands as a testament to resilience, innovation, and unwavering 
          commitment to quality. We continue to expand our reach and impact across Nigeria, 
          nourishing lives and building a sustainable future.
        </p>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Partner With Us
        </Link>
      </section>

      <section className="bg-primary-900 text-white py-12 px-4 text-center">
        <h3 className="text-2xl font-bold mb-4">Be Part of Our Future</h3>
        <Link href="/careers" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Join Our Team
        </Link>
      </section>
    </div>
  );
}