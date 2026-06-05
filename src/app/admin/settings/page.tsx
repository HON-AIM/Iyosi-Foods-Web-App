"use client";

import { useState, useEffect } from "react";
import { Save, Megaphone } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [announcementText, setAnnouncementText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setAnnouncementText(data.settings?.announcementText || "");
      }
    } catch (error) {
      console.error("[ERROR] Error fetching settings:", error instanceof Error ? error.message : String(error));
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementText }),
      });

      if (response.ok) {
        toast.success("Settings saved successfully");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      console.error("[ERROR] Error saving settings:", error instanceof Error ? error.message : String(error));
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage global configurations for your e-commerce storefront
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
           <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center space-x-3">
             <Megaphone className="h-5 w-5 text-gray-600" />
             <h2 className="text-lg font-bold text-gray-900">Global Announcements</h2>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="space-y-2">
              <label htmlFor="announcementText" className="block text-sm font-medium text-gray-700">
                Top Banner Announcement
              </label>
              <p className="text-xs text-gray-500 mb-2">
                 This text will be displayed prominently at the very top of the `/shop` storefront. Leave blank to hide the banner.
              </p>
              <input
                type="text"
                id="announcementText"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                placeholder="e.g. Free delivery on orders over ₦50,000 in select areas!"
              />
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
