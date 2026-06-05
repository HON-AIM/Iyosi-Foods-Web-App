"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { MessageSquare, Send, Users, Trash2, Search, AlertCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import { SkeletonTable } from "@/components/admin/SkeletonTable";

type User = {
  id: string;
  name: string | null;
  email: string | null;
};

type Message = {
  id: string;
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  user: User;
};

const MAX_SUBJECT_LENGTH = 100;
const MAX_CONTENT_LENGTH = 5000;

export default function AdminMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({
    targetUserId: "",
    subject: "",
    content: "",
  });
  const [composeErrors, setComposeErrors] = useState<Record<string, string>>({});
  const modalRef = useRef<HTMLDivElement>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok || response.status === 401) {
          router.push("/login");
        }
      } catch (error) {
        console.error("[ERROR] Auth check failed:", error instanceof Error ? error.message : String(error));
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch both messages and users to populate the compose dropdown
      const [messagesRes, usersRes] = await Promise.all([
        fetch("/api/admin/messages"),
        fetch("/api/admin/customers"),
      ]);

      // Handle auth errors
      if (messagesRes.status === 401 || usersRes.status === 401) {
        router.push("/login");
        return;
      }

      // Handle permission errors
      if (messagesRes.status === 403 || usersRes.status === 403) {
        setError("You do not have permission to access this resource");
        return;
      }

      if (!messagesRes.ok || !usersRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const messagesData = await messagesRes.json();
      const usersData = await usersRes.json();

      setMessages(messagesData.messages || []);
      setUsers(usersData.customers || []);
    } catch (error) {
      console.error("[ERROR] Error fetching data:", error instanceof Error ? error.message : String(error));
      setError("Failed to load communication data");
      toast.error("An error occurred loading communication data");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle modal focus trap and escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isComposeOpen) {
        setIsComposeOpen(false);
      }
    };

    if (isComposeOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isComposeOpen]);

  const validateComposeForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!composeData.targetUserId) {
      errors.targetUserId = "Please select a recipient";
    }

    if (!composeData.subject.trim()) {
      errors.subject = "Subject is required";
    } else if (composeData.subject.length > MAX_SUBJECT_LENGTH) {
      errors.subject = `Subject must be ${MAX_SUBJECT_LENGTH} characters or less`;
    }

    if (!composeData.content.trim()) {
      errors.content = "Message content is required";
    } else if (composeData.content.length > MAX_CONTENT_LENGTH) {
      errors.content = `Content must be ${MAX_CONTENT_LENGTH} characters or less`;
    }

    setComposeErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateComposeForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(composeData),
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        toast.error("You do not have permission to send messages");
        return;
      }

      if (response.ok) {
        toast.success("Message sent successfully");
        setIsComposeOpen(false);
        setComposeData({ targetUserId: "", subject: "", content: "" });
        setComposeErrors({});
        // Refresh to get the fully populated message with user info
        await fetchData();
      } else {
        const data = await response.json();
        toast.error(
          data.message || "Failed to send message. Please try again."
        );
      }
    } catch (error) {
      console.error("[ERROR] Error sending message:", error instanceof Error ? error.message : String(error));
      toast.error("An error occurred while sending the message");
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string, subject: string) => {
    const confirmed = window.confirm(
      `⚠️ DELETE MESSAGE\n\nSubject: "${subject}"\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/messages/${id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        toast.error("You do not have permission to delete messages");
        return;
      }

      if (response.ok) {
        toast.success("Message deleted successfully");
        setMessages((prev) => prev.filter((m) => m.id !== id));
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to delete message");
      }
    } catch (error) {
      console.error("[ERROR] Error deleting message:", error instanceof Error ? error.message : String(error));
      toast.error("An error occurred while deleting the message");
    }
  };

  const filteredMessages = messages.filter((msg) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      msg.subject.toLowerCase().includes(searchLower) ||
      msg.content.toLowerCase().includes(searchLower) ||
      (msg.user?.name && msg.user.name.toLowerCase().includes(searchLower)) ||
      (msg.user?.email && msg.user.email.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-28 animate-pulse" />
        <SkeletonTable
          headers={["From", "Subject", "Date", "Status", "Actions"]}
          rows={8}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Communication Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Send messages to customers and view communication history
          </p>
        </div>
        <button
          onClick={() => setIsComposeOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
          aria-label="Compose new message"
        >
          <Send className="h-4 w-4 mr-2" aria-hidden="true" />
          Compose Message
        </button>
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compose-modal-title"
        >
          <div
            ref={modalRef}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 id="compose-modal-title" className="text-xl font-bold text-gray-900">
                New Message
              </h2>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                aria-label="Close compose modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSend} className="p-6 space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="recipient-select"
                  className="block text-sm font-medium text-gray-700"
                >
                  Recipient <span className="text-red-500">*</span>
                </label>
                <select
                  id="recipient-select"
                  required
                  value={composeData.targetUserId}
                  onChange={(e) =>
                    setComposeData({
                      ...composeData,
                      targetUserId: e.target.value,
                    })
                  }
                  aria-invalid={!!composeErrors.targetUserId}
                  aria-describedby={
                    composeErrors.targetUserId
                      ? "recipient-error"
                      : undefined
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white ${
                    composeErrors.targetUserId
                      ? "border-red-500"
                      : "border-gray-200"
                  }`}
                >
                  <option value="" disabled>
                    Select a customer...
                  </option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || "Unknown"} ({u.email || "no-email"})
                    </option>
                  ))}
                </select>
                {composeErrors.targetUserId && (
                  <p id="recipient-error" className="text-xs text-red-500">
                    {composeErrors.targetUserId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="subject-input"
                  className="block text-sm font-medium text-gray-700"
                >
                  Subject <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="subject-input"
                    type="text"
                    required
                    value={composeData.subject}
                    onChange={(e) =>
                      setComposeData({
                        ...composeData,
                        subject: e.target.value.slice(0, MAX_SUBJECT_LENGTH),
                      })
                    }
                    aria-invalid={!!composeErrors.subject}
                    aria-describedby={
                      composeErrors.subject ? "subject-error" : "subject-count"
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all ${
                      composeErrors.subject
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                    placeholder="e.g. Order Update"
                  />
                </div>
                <div className="flex justify-between">
                  {composeErrors.subject ? (
                    <p id="subject-error" className="text-xs text-red-500">
                      {composeErrors.subject}
                    </p>
                  ) : (
                    <p
                      id="subject-count"
                      className="text-xs text-gray-500"
                    >
                      {composeData.subject.length}/{MAX_SUBJECT_LENGTH}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="content-textarea"
                  className="block text-sm font-medium text-gray-700"
                >
                  Message Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content-textarea"
                  required
                  rows={4}
                  value={composeData.content}
                  onChange={(e) =>
                    setComposeData({
                      ...composeData,
                      content: e.target.value.slice(0, MAX_CONTENT_LENGTH),
                    })
                  }
                  aria-invalid={!!composeErrors.content}
                  aria-describedby={
                    composeErrors.content
                      ? "content-error"
                      : "content-count"
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none ${
                    composeErrors.content
                      ? "border-red-500"
                      : "border-gray-200"
                  }`}
                  placeholder="Type your message here..."
                />
                <div className="flex justify-between">
                  {composeErrors.content ? (
                    <p id="content-error" className="text-xs text-red-500">
                      {composeErrors.content}
                    </p>
                  ) : (
                    <p
                      id="content-count"
                      className="text-xs text-gray-500"
                    >
                      {composeData.content.length}/{MAX_CONTENT_LENGTH}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-busy={isSending}
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search
                className="h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <input
              type="text"
              placeholder="Search sent messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search messages"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white"
            />
          </div>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageSquare
                className="h-6 w-6 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <p className="text-gray-500 font-medium">
              {searchTerm
                ? "No messages match your search."
                : "No messages found in history."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredMessages.map((msg) => (
              <li
                key={msg.id}
                className="p-6 hover:bg-gray-50 transition-colors grid grid-cols-1 md:grid-cols-12 gap-4"
              >
                <div className="md:col-span-3 flex items-start space-x-3">
                  <div className="h-10 w-10 flex-shrink-0 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                    {msg.user?.name
                      ? msg.user.name.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-0.5">
                      Sent To
                    </span>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {msg.user?.name || "Unknown User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {msg.user?.email || "no-email"}
                    </p>
                  </div>
                </div>
                <div className="md:col-span-7">
                  <p className="text-sm font-bold text-gray-900 mb-1">
                    {msg.subject}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {msg.content}
                  </p>
                </div>
                <div className="md:col-span-2 flex flex-col items-end justify-between">
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {format(new Date(msg.createdAt), "MMM dd, yyyy")}
                  </span>
                  <div className="mt-2 flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                        msg.isRead
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {msg.isRead ? "Read" : "Unread"}
                    </span>
                    <button
                      onClick={() => handleDelete(msg.id, msg.subject)}
                      className="text-gray-400 hover:text-red-600 p-1 transition-colors rounded hover:bg-red-50"
                      title={`Delete message: ${msg.subject}`}
                      aria-label={`Delete message: ${msg.subject}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
