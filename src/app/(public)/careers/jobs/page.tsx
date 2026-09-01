import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Job Vacancies | Iyosi Foods LTD",
  description: "Explore job openings and career opportunities at Iyosi Foods LTD.",
};

export default function JobsPage() {
  const departments = [
    {
      name: "Operations",
      jobs: 5,
      icon: "⚙️",
    },
    {
      name: "Sales & Marketing",
      jobs: 8,
      icon: "📈",
    },
    {
      name: "Finance",
      jobs: 3,
      icon: "💰",
    },
    {
      name: "Human Resources",
      jobs: 2,
      icon: "👥",
    },
    {
      name: "Production",
      jobs: 12,
      icon: "🏭",
    },
    {
      name: "Logistics",
      jobs: 6,
      icon: "🚚",
    },
  ];

  const recentJobs = [
    {
      title: "Production Manager",
      department: "Production",
      location: "Port Harcourt, Rivers State",
      type: "Full-time",
      deadline: "April 30, 2024",
    },
    {
      title: "Sales Executive",
      department: "Sales & Marketing",
      location: "Lagos",
      type: "Full-time",
      deadline: "April 25, 2024",
    },
    {
      title: "Finance Analyst",
      department: "Finance",
      location: "Lagos",
      type: "Full-time",
      deadline: "April 28, 2024",
    },
    {
      title: "Warehouse Supervisor",
      department: "Logistics",
      location: "Kano",
      type: "Full-time",
      deadline: "April 20, 2024",
    },
    {
      title: "Quality Control Officer",
      department: "Production",
      location: "Port Harcourt, Rivers State",
      type: "Full-time",
      deadline: "April 25, 2024",
    },
    {
      title: "HR Manager",
      department: "Human Resources",
      location: "Lagos",
      type: "Full-time",
      deadline: "April 30, 2024",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Job Vacancies</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Explore open positions and join our team
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-4 mb-8">
            <input
              type="text"
              placeholder="Search jobs..."
              className="flex-1 min-w-[200px] px-4 py-3 rounded-lg border border-surface-200 focus:outline-none focus:border-accent-500"
            />
            <select className="px-4 py-3 rounded-lg border border-surface-200 focus:outline-none focus:border-accent-500">
              <option>All Locations</option>
              <option>Lagos</option>
              <option>Port Harcourt</option>
              <option>Kano</option>
              <option>Abuja</option>
            </select>
            <select className="px-4 py-3 rounded-lg border border-surface-200 focus:outline-none focus:border-accent-500">
              <option>All Departments</option>
              {departments.map((dept, i) => (
                <option key={i}>{dept.name}</option>
              ))}
            </select>
          </div>

          <h2 className="text-lg font-bold text-primary-900 mb-4">Browse by Department</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
            {departments.map((dept, i) => (
              <button
                key={i}
                className="bg-white p-4 rounded-lg shadow-sm border border-surface-100 hover:border-accent-300 transition-colors text-center"
              >
                <span className="text-2xl block mb-1">{dept.icon}</span>
                <span className="text-sm font-medium text-primary-900">{dept.name}</span>
                <span className="text-xs text-accent-600 block">({dept.jobs} jobs)</span>
              </button>
            ))}
          </div>

          <h2 className="text-lg font-bold text-primary-900 mb-4">Recent Openings</h2>
          <div className="space-y-4">
            {recentJobs.map((job, i) => (
              <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-surface-100 hover:border-accent-300 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-primary-900 mb-1">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-surface-600">
                      <span className="bg-surface-100 px-2 py-0.5 rounded">{job.department}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>{job.type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-surface-500 mb-2">Deadline: {job.deadline}</p>
                    <button className="bg-accent-500 hover:bg-accent-600 text-white font-bold py-2 px-4 rounded text-sm transition-colors">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-primary-900 mb-4">Don&apos;t See the Right Role?</h2>
          <p className="text-surface-600 mb-6">
            Send us your CV and we&apos;ll keep you in mind for future opportunities
          </p>
          <Link href="/careers/submit-cv" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            Submit Your CV
          </Link>
        </div>
      </section>

      <section className="bg-primary-900 text-white py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Have Questions?</h2>
        <p className="text-primary-100 mb-6">
          Contact our HR team for career-related inquiries
        </p>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Contact HR
        </Link>
      </section>
    </div>
  );
}