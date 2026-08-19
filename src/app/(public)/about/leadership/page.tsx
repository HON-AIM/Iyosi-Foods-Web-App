import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Leadership | Iyosiola Group",
  description: "Meet the leadership team driving Iyosiola Group's vision and mission in Nigeria's food industry.",
};

export default function LeadershipPage() {
  const boardMembers = [
    {
      name: "Executive Chairman",
      role: "Chairman",
      bio: "A foremost industrialist and philanthropist leading strategic direction and corporate governance for over 20 years. Known for transforming businesses and contributing to Nigeria's economic development through strategic investments in key sectors.",
      image: null,
    },
    {
      name: "Managing Director",
      role: "Executive Director",
      bio: "A distinguished business leader with over 20 years of experience in operations, manufacturing, supply chain management and business development. Has a track record of consistently delivering growth and profitability.",
      image: null,
    },
    {
      name: "Operations Director",
      role: "Executive Director",
      bio: "Overseeing day-to-day operations and business growth across all divisions. Brings extensive experience in food processing and manufacturing operations.",
      image: null,
    },
    {
      name: "Finance Director",
      role: "Executive Director",
      bio: "Managing financial strategy, reporting, and corporate governance. Expert in financial planning, risk management, and stakeholder relations.",
      image: null,
    },
  ];

  const managementTeam = [
    {
      name: "Chief Operations Officer",
      role: "Senior Management",
      bio: "Leading operational excellence and execution across all business units.",
    },
    {
      name: "Chief Financial Officer",
      role: "Senior Management",
      bio: "Overseeing financial strategy, reporting, and strategic finance initiatives.",
    },
    {
      name: "General Manager, Sales & Distribution",
      role: "Senior Management",
      bio: "Driving sales strategy and distribution network across Nigeria.",
    },
    {
      name: "General Manager, Marketing",
      role: "Senior Management",
      bio: "Leading marketing and corporate communications initiatives.",
    },
    {
      name: "Divisional Director - Flour",
      role: "Division Head",
      bio: "Overseeing flour milling operations with extensive experience in food processing.",
    },
    {
      name: "Divisional Director - Rice",
      role: "Division Head",
      bio: "Leading rice processing and distribution operations.",
    },
    {
      name: "General Manager, Human Resources",
      role: "Senior Management",
      bio: "Driving people strategy and organizational development.",
    },
    {
      name: "Company Secretary",
      role: "Senior Management",
      bio: "Managing corporate governance, legal affairs, and board matters.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Our Leadership</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Meet the team driving our vision and mission
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">
            Board of Directors
          </h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-12 text-center">
            Our Board of Directors provides strategic oversight and policy direction. Their collective expertise 
            and leadership ensure we maintain the highest standards of corporate governance while pursuing 
            our growth objectives.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {boardMembers.map((member, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-surface-100">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-3xl font-bold text-primary-900">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-primary-900 text-center">{member.name}</h3>
                <p className="text-accent-600 font-medium text-sm text-center mb-3">{member.role}</p>
                <p className="text-surface-600 text-sm text-center">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">
            Senior Management
          </h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-12 text-center">
            Our management team comprises professionals with deep operational and technical experience, 
            locally and internationally, from diverse sectors. Their expertise drives our day-to-day 
            operations and long-term strategy.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {managementTeam.map((member, index) => (
              <div key={index} className="bg-white p-5 rounded-xl shadow-sm">
                <h3 className="text-base font-bold text-primary-900">{member.name}</h3>
                <p className="text-accent-600 font-medium text-xs mb-2">{member.role}</p>
                <p className="text-surface-600 text-xs">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">
            Corporate Governance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Board of Directors", desc: "Strategic oversight and policy direction" },
              { title: "Management Team", desc: "Operational excellence and execution" },
              { title: "Audit Committee", desc: "Financial oversight and compliance" },
              { title: "Risk Management", desc: "Enterprise risk assessment and mitigation" },
              { title: "ESG Committee", desc: "Sustainability and impact initiatives" },
              { title: "Compliance", desc: "Regulatory adherence and best practices" },
            ].map((item, i) => (
              <div key={i} className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-accent-500">
                <h3 className="font-bold text-primary-900 mb-1">{item.title}</h3>
                <p className="text-surface-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-4">
            Join Our Team
          </h2>
          <p className="text-surface-600 mb-6 max-w-xl mx-auto">
            Explore career opportunities and grow with Iyosiola Group
          </p>
          <a href="/careers" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            View Careers
          </a>
        </div>
      </section>
    </div>
  );
}