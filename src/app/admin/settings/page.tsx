"use client";

import { useState, useEffect } from "react";
import { Save, Megaphone } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [announcementText, setAnnouncementText] = useState("");
  const [yearsExcellence, setYearsExcellence] = useState(5);
  const [productCategories, setProductCategories] = useState(6);
  const [employees, setEmployees] = useState(50);
  const [operationalReach, setOperationalReach] = useState("Nationwide");
  const [ctaHeadline, setCtaHeadline] = useState(
    "Committed to Quality & Nourishing West Africa"
  );
  const [ctaSubtext, setCtaSubtext] = useState("");
  const [vacanciesActive, setVacanciesActive] = useState(false);
  const [vacanciesMessage, setVacanciesMessage] = useState(
    "No available positions for now."
  );
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
        setYearsExcellence(
          typeof data.settings?.yearsExcellence === "number"
            ? data.settings.yearsExcellence
            : 5
        );
        setProductCategories(
          typeof data.settings?.productCategories === "number"
            ? data.settings.productCategories
            : 6
        );
        setEmployees(
          typeof data.settings?.dedicatedEmployees === "number"
            ? data.settings.dedicatedEmployees
            : 50
        );
        setOperationalReach(
          data.settings?.operationalReach || "Nationwide"
        );
        setCtaHeadline(
          data.settings?.ctaHeadline ||
            "Committed to Quality & Nourishing West Africa"
        );
        setCtaSubtext(data.settings?.ctaSubtext || "");
        setVacanciesActive(!!data.settings?.vacanciesActive);
        setVacanciesMessage(
          data.settings?.vacanciesMessage ||
            "No available positions for now."
        );
      }
    } catch (error) {
      console.error(
        "[ERROR] Error fetching settings:",
        error instanceof Error ? error.message : String(error)
      );
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberChange = (
    setter: (v: number) => void,
    value: string
  ) => {
    const parsed = parseInt(value, 10);
    setter(Number.isNaN(parsed) ? 0 : parsed);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcementText,
          yearsExcellence,
          productCategories,
          dedicatedEmployees: employees,
          operationalReach,
          ctaHeadline,
          ctaSubtext,
          vacanciesActive,
          vacanciesMessage,
        }),
      });

      if (response.ok) {
        toast.success("Settings saved successfully");
      } else {
        const err = await response.json().catch(() => null);
        toast.error(err?.message || "Failed to save settings");
      }
    } catch (error) {
      console.error(
        "[ERROR] Error saving settings:",
        error instanceof Error ? error.message : String(error)
      );
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
        <form onSubmit={handleSave} className="space-y-6">
          {/* Announcements */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <Megaphone className="h-5 w-5 text-gray-600" />
              <h2 className="font-bold text-gray-900">Global Announcements</h2>
            </div>
            <div className="space-y-2">
              <label htmlFor="announcementText" className="block text-sm font-medium text-gray-700">
                Top Banner Announcement
              </label>
              <p className="text-xs text-gray-500 mb-2">
                This text will be displayed prominently at the very top of the storefront. Leave blank to hide the banner.
              </p>
              <input
                type="text"
                id="announcementText"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="e.g. Free delivery on orders over ₦50,000!"
              />
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              📊 Homepage Stats
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Excellence</label>
                <input type="number" value={yearsExcellence} min={0}
                  onChange={e => handleNumberChange(setYearsExcellence, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Categories</label>
                <input type="number" value={productCategories} min={0}
                  onChange={e => handleNumberChange(setProductCategories, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dedicated Employees</label>
                <input type="number" value={employees} min={0}
                  onChange={e => handleNumberChange(setEmployees, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operational Reach</label>
                <input type="text" value={operationalReach}
                  onChange={e => setOperationalReach(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Homepage CTA Text</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <input type="text" value={ctaHeadline} onChange={e => setCtaHeadline(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub-text</label>
                <textarea rows={3} value={ctaSubtext} onChange={e => setCtaSubtext(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Vacancies Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Job Vacancies</h2>
            <div className="flex items-center gap-3 mb-3">
              <label className="text-sm font-medium text-gray-700">Vacancies Active</label>
              <button type="button" onClick={() => setVacanciesActive(!vacanciesActive)}>
                {vacanciesActive
                  ? <span className="text-green-600 font-bold">ON ✅</span>
                  : <span className="text-gray-400 font-bold">OFF ❌</span>
                }
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message when vacancies are OFF
              </label>
              <textarea rows={2} value={vacanciesMessage} onChange={e => setVacanciesMessage(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
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
      )}
    </div>
  );
}