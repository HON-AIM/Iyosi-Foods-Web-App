import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const session = await auth();

  if (!session?.user?.id) return null;

  const messages = await prisma.message.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[400px]">
      <div className="border-b border-gray-100 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center justify-center">
          <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Your inbox is empty</h3>
          <p className="text-gray-500 mb-6 max-w-sm">
            {"You don't have any messages yet. We'll send you updates about your account and orders here."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
          {messages.map((message) => (
            <li key={message.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4
                      className={`text-base ${
                        !message.isRead
                          ? "font-bold text-gray-900"
                          : "font-medium text-gray-700"
                      }`}
                    >
                      {message.subject}
                    </h4>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {format(new Date(message.createdAt), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <p
                    className={`text-sm ${
                      !message.isRead ? "text-gray-800" : "text-gray-500"
                    } line-clamp-2`}
                  >
                    {message.content}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
