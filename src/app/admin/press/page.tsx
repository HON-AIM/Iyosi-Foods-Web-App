"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Upload,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

type PressRelease = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const EMPTY_FORM = {
  title: "",
  slug: "",
  category: "Corporate News",
  excerpt: "",
  content: "",
  coverImage: "",
  published: false,
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function AdminPressPage() {
  const router = useRouter();
  const [releases, setReleases] = useState<PressRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok || response.status === 401) {
          router.push("/login");
          return;
        }
      } catch (error) {
        console.error(
          "[ERROR] Auth check failed:",
          error instanceof Error ? error.message : String(error)
        );
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  const fetchReleases = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/press");
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to load press releases");
      }
      const data = await response.json();
      setReleases(data.releases || []);
    } catch (error) {
      console.error(
        "[ERROR] Error fetching press releases:",
        error instanceof Error ? error.message : String(error)
      );
      toast.error("Failed to load press releases");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  const openNewRelease = () => {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setIsEditing(false);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditRelease = (release: PressRelease) => {
    setForm({
      title: release.title,
      slug: release.slug,
      category: release.category,
      excerpt: release.excerpt,
      content: release.content,
      coverImage: release.coverImage || "",
      published: release.published,
    });
    setImageFile(null);
    setIsEditing(true);
    setEditingId(release.id);
    setIsModalOpen(true);
  };

  const handleFieldChange = (
    field: keyof typeof EMPTY_FORM,
    value: string | boolean
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    setImageFile(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.coverImage || null;

    setIsUploading(true);
    const formDataObj = new FormData();
    formDataObj.append("file", imageFile);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataObj,
      });

      if (res.status === 401) {
        router.push("/login");
        return null;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Upload failed");
      }

      const data = await res.json();
      return data.url || null;
    } catch (error) {
      console.error(
        "[ERROR] Upload failed:",
        error instanceof Error ? error.message : String(error)
      );
      const message =
        error instanceof Error ? error.message : "Image upload failed";
      toast.error(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let coverImage = form.coverImage;
      if (imageFile) {
        const uploadToast = toast.loading("Uploading cover image...");
        const uploadedUrl = await uploadImage();
        toast.dismiss(uploadToast);
        if (!uploadedUrl) {
          toast.error("Cover image upload failed");
          return;
        }
        coverImage = uploadedUrl;
      }

      const payload = {
        title: form.title,
        slug: form.slug,
        category: form.category,
        excerpt: form.excerpt,
        content: form.content,
        coverImage: coverImage || null,
        published: form.published,
      };

      let response: Response;
      if (isEditing && editingId) {
        response = await fetch(`/api/admin/press/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/admin/press", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message =
          data?.errors?.[0]?.message ||
          data?.message ||
          "Failed to save press release";
        toast.error(message);
        return;
      }

      toast.success(isEditing ? "Press release updated" : "Press release created");
      setIsModalOpen(false);
      fetchReleases();
    } catch (error) {
      console.error(
        "[ERROR] Error saving press release:",
        error instanceof Error ? error.message : String(error)
      );
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/press/${id}`, {
        method: "DELETE",
      });
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to delete press release");
      }
      setReleases((prev) => prev.filter((r) => r.id !== id));
      toast.success("Press release deleted");
    } catch (error) {
      console.error(
        "[ERROR] Error deleting press release:",
        error instanceof Error ? error.message : String(error)
      );
      toast.error("Failed to delete press release");
    } finally {
      setDeletingId(null);
    }
  };

  const unescapeSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Press Releases</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage official press releases and announcements
          </p>
        </div>
        <button
          onClick={openNewRelease}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Release
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : releases.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">No press releases yet</h2>
          <p className="text-sm text-gray-500 mb-6">
            Click &quot;New Release&quot; to create your first press release.
          </p>
          <button
            onClick={openNewRelease}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
          >
            Create First Release
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="divide-y divide-gray-100">
            {releases.map((release) => (
              <div
                key={release.id}
                className="flex flex-wrap items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                {release.coverImage ? (
                  <img
                    src={release.coverImage}
                    alt={release.title}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-7 w-7 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        release.published
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {release.published ? (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <EyeOff className="h-3 w-3" /> Draft
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">{release.category}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {release.title}
                  </h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    /media/press/{release.slug}
                  </p>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {release.publishedAt
                    ? format(new Date(release.publishedAt), "MMM d, yyyy")
                    : format(new Date(release.createdAt), "MMM d, yyyy")}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditRelease(release)}
                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label={`Edit ${release.title}`}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(release.id, release.title)}
                    disabled={deletingId === release.id}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    aria-label={`Delete ${release.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {isEditing ? "Edit Press Release" : "New Press Release"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    handleFieldChange("title", e.target.value);
                    if (!isEditing && !form.slug) {
                      handleFieldChange("slug", unescapeSlug(e.target.value));
                    }
                  }}
                  required
                  minLength={5}
                  maxLength={300}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder="e.g. Iyosi Foods LTD Reports Record Revenue"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) =>
                      handleFieldChange("slug", unescapeSlug(e.target.value))
                    }
                    required
                    minLength={3}
                    maxLength={120}
                    pattern="[a-z0-9-]+"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                    placeholder="iyosi-foods-record-revenue"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    lowercase letters, numbers, and hyphens
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) =>
                      handleFieldChange("category", e.target.value)
                    }
                    required
                    minLength={2}
                    maxLength={80}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                    placeholder="Corporate News"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Excerpt
                </label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) =>
                    handleFieldChange("excerpt", e.target.value)
                  }
                  required
                  minLength={10}
                  maxLength={600}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
                  placeholder="A short summary shown on the press releases listing page..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    handleFieldChange("content", e.target.value)
                  }
                  required
                  minLength={30}
                  rows={8}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder={"Write the full press release here.\n\nUse blank lines to separate paragraphs..."}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {(form.coverImage || imageFile) && (
                    <img
                      src={
                        imageFile
                          ? URL.createObjectURL(imageFile)
                          : form.coverImage
                      }
                      alt="Cover preview"
                      className="w-24 h-16 rounded-lg object-cover border border-gray-200"
                    />
                  )}
                  <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm cursor-pointer transition-colors flex items-center">
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? "Uploading..." : "Upload Cover Image"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {!form.coverImage && !imageFile && (
                    <span className="text-xs text-gray-400">
                      or paste an image URL below
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  value={form.coverImage}
                  onChange={(e) => {
                    handleFieldChange("coverImage", e.target.value);
                    setImageFile(null);
                  }}
                  className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder="https://... (optional image URL)"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) =>
                      handleFieldChange("published", e.target.checked)
                    }
                    className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Published
                  </span>
                </label>
                <span className="text-xs text-gray-400">
                  {form.published
                    ? "Release will be live on /media/press"
                    : "Saved as draft, hidden from public"}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors flex items-center disabled:opacity-70 shadow-sm"
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : isEditing ? (
                    "Save Changes"
                  ) : (
                    "Create Release"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
