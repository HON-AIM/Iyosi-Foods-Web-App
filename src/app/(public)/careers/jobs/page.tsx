import { prisma } from "@/lib/db";
import Link from "next/link";
import { type Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Job Vacancies | Iyosi Foods LTD",
  description: "Explore career opportunities at Iyosi Foods LTD.",
};

export default async function JobsPage() {
  const settings = await prisma.storeSettings
    .findUnique({
      where: { id: "global" },
      select: { vacanciesActive: true, vacanciesMessage: true },
    })
    .catch(() => null);

  const vacanciesActive = settings?.vacanciesActive ?? false;
  const vacanciesMessage =
    settings?.vacanciesMessage ??
    "No available positions for now. Check back soon for exciting opportunities at Iyosi Foods LTD.";

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Job Vacancies</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Join the Iyosi Foods LTD team and be part of something great
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {vacanciesActive ? (
            // FUTURE: When admin activates vacancies, list them here from DB
            // For now, this branch shows a placeholder
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📋</span>
              </div>
              <h2 className="text-2xl font-bold text-primary-900 mb-3">Vacancies Are Open!</h2>
              <p className="text-surface-600 mb-6">
                We currently have open positions. Please submit your CV to apply.
              </p>
              <Link
                href="/careers/submit-cv"
                className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
              >
                Submit Your CV →
              </Link>
            </div>
          ) : (
            // Default state — no positions
            <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-surface-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-primary-900 mb-3">
                {vacanciesMessage}
              </h2>
              <p className="text-surface-600 max-w-md mx-auto mb-8">
                We are always looking for talented individuals. Submit your CV and we will reach
                out when a suitable opportunity arises.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/careers/submit-cv"
                  className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                >
                  Submit Your CV
                </Link>
                <Link
                  href="/contact"
                  className="inline-block border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-bold py-3 px-8 rounded-lg transition-colors"
                >
                  Contact HR
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Distributor / Partners CTA */}
      <section className="bg-primary-900 text-white py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Interested in Becoming a Distributor?</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          Partner with Iyosi Foods LTD and bring quality food products to your region.
        </p>
        <Link
          href="/careers/partners"
          className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
        >
          Apply as a Distributor →
        </Link>
      </section>
    </div>
  );
}