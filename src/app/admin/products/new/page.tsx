"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PackageX, Save, ArrowLeft, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_PRICE = 0;
const MAX_PRICE = 999999999;
const MIN_STOCK = 0;
const MAX_STOCK = 999999;

type FormData = {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  image: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function AddProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "BAKING",
    image: "",
  });

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok || response.status === 401) {
          router.push("/login");
          return;
        }
        setIsAuthorized(true);
      } catch (error) {
        console.error("[ERROR] Auth check failed:", error);
        router.push("/login");
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Product name is required";
    } else if (formData.name.length > 100) {
      errors.name = "Product name must be 100 characters or less";
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.length > 2000) {
      errors.description = "Description must be 2000 characters or less";
    }

    if (!formData.price) {
      errors.price = "Price is required";
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < MIN_PRICE || price > MAX_PRICE) {
        errors.price = `Price must be between ${MIN_PRICE} and ${MAX_PRICE}`;
      }
    }

    if (!formData.stock) {
      errors.stock = "Stock quantity is required";
    } else {
      const stock = parseInt(formData.stock, 10);
      if (isNaN(stock) || stock < MIN_STOCK || stock > MAX_STOCK) {
        errors.stock = `Stock must be between ${MIN_STOCK} and ${MAX_STOCK}`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (formErrors[name as keyof FormData]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error("Only JPEG, PNG, and WebP images are allowed");
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Image must be smaller than 5MB");
        return;
      }

      // Revoke previous preview URL
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

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
      console.error("[ERROR] Upload failed:", error);
      const message =
        error instanceof Error ? error.message : "Image upload failed";
      toast.error(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrl = formData.image;

      if (imageFile) {
        const uploadToast = toast.loading("Uploading image...");
        const url = await uploadImage();

        if (url) {
          uploadedImageUrl = url;
          toast.success("Image uploaded", { id: uploadToast });
        } else {
          toast.error("Image upload failed. Please try again.", {
            id: uploadToast,
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare final data with proper types
      const finalData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        category: formData.category,
        image: uploadedImageUrl,
      };

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });

      if (response.status === 401 || response.status === 403) {
        toast.error("Unauthorized: You do not have permission to create products");
        router.push("/login");
        return;
      }

      if (response.ok) {
        toast.success("✅ Product created successfully!");
        router.push("/admin/products");
      } else {
        const data = await response.json();
        toast.error(
          data.message || "Failed to create product. Please try again."
        );
      }
    } catch (error) {
      console.error("[ERROR] Error creating product:", error);
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/products"
          className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          aria-label="Go back to products"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-sm text-gray-500">
            Create a new item in your product catalog
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              maxLength={100}
              value={formData.name}
              onChange={handleChange}
              aria-invalid={!!formErrors.name}
              aria-describedby={formErrors.name ? "name-error" : undefined}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all ${
                formErrors.name ? "border-red-500" : "border-gray-200"
              }`}
              placeholder="e.g. Premium Baking Flour 50kg"
            />
            {formErrors.name && (
              <p id="name-error" className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {formErrors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              maxLength={2000}
              rows={4}
              value={formData.description}
              onChange={handleChange}
              aria-invalid={!!formErrors.description}
              aria-describedby={
                formErrors.description ? "description-error" : "description-count"
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none ${
                formErrors.description ? "border-red-500" : "border-gray-200"
              }`}
              placeholder="Describe the product details and benefits..."
            />
            <div className="flex justify-between items-start">
              {formErrors.description ? (
                <p id="description-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {formErrors.description}
                </p>
              ) : (
                <p id="description-count" className="text-xs text-gray-500">
                  {formData.description.length}/2000 characters
                </p>
              )}
            </div>
          </div>

          {/* Price & Stock Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price */}
            <div className="space-y-2">
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700"
              >
                Price (NGN) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                required
                min={MIN_PRICE}
                max={MAX_PRICE}
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                aria-invalid={!!formErrors.price}
                aria-describedby={formErrors.price ? "price-error" : undefined}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all ${
                  formErrors.price ? "border-red-500" : "border-gray-200"
                }`}
                placeholder="e.g. 50000"
              />
              {formErrors.price && (
                <p id="price-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {formErrors.price}
                </p>
              )}
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <label
                htmlFor="stock"
                className="block text-sm font-medium text-gray-700"
              >
                Initial Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                required
                min={MIN_STOCK}
                max={MAX_STOCK}
                value={formData.stock}
                onChange={handleChange}
                aria-invalid={!!formErrors.stock}
                aria-describedby={formErrors.stock ? "stock-error" : undefined}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all ${
                  formErrors.stock ? "border-red-500" : "border-gray-200"
                }`}
                placeholder="e.g. 100"
              />
              {formErrors.stock && (
                <p id="stock-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {formErrors.stock}
                </p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              aria-label="Select product category"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white"
            >
              <option value="BAKING">Baking</option>
              <option value="SEMOLINA">Semolina</option>
              <option value="WHEAT">Wheat</option>
              <option value="ALL_PURPOSE">All Purpose</option>
            </select>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Product Image
            </label>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 flex-shrink-0">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Product preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <PackageX
                      className="h-8 w-8 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="imageFile"
                  name="imageFile"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100 transition-all cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Upload product image"
                />
                <p className="text-xs text-gray-500 mt-2">
                  JPEG, PNG, or WebP • Max 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
            <Link
              href="/admin/products"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Save Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
