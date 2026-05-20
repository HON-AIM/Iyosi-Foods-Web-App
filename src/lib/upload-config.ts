/**
 * Upload Configuration - Supports Vercel Blob and Cloudinary
 * Set UPLOAD_PROVIDER env var to choose storage backend
 */

export type UploadProvider = "vercel-blob" | "cloudinary";

export interface UploadConfig {
  provider: UploadProvider;
  allowedMimeTypes: Set<string>;
  maxFileSize: number; // bytes
  minFileSize: number; // bytes
  optimizeImages: boolean;
  publicCdnUrl: string; // Base URL for public access
}

/**
 * Get active upload configuration from environment
 */
export function getUploadConfig(): UploadConfig {
  const provider = (process.env.UPLOAD_PROVIDER || "vercel-blob") as UploadProvider;

  // Validate provider
  if (!["vercel-blob", "cloudinary"].includes(provider)) {
    throw new Error(`Invalid UPLOAD_PROVIDER: ${provider}. Must be 'vercel-blob' or 'cloudinary'`);
  }

  // Provider-specific config
  const cdnUrls: Record<UploadProvider, string> = {
    "vercel-blob": process.env.BLOB_STORE_ID || "",
    cloudinary: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
  };

  return {
    provider,
    allowedMimeTypes: new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]),
    maxFileSize: 10 * 1024 * 1024, // 10MB
    minFileSize: 100, // 100 bytes
    optimizeImages: process.env.OPTIMIZE_IMAGES !== "false",
    publicCdnUrl: cdnUrls[provider],
  };
}

/**
 * Validate provider configuration at startup
 */
export function validateUploadConfig(): void {
  const config = getUploadConfig();

  switch (config.provider) {
    case "vercel-blob":
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error(
          "BLOB_READ_WRITE_TOKEN environment variable is required for Vercel Blob"
        );
      }
      break;

    case "cloudinary":
      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        throw new Error(
          "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables are required for Cloudinary"
        );
      }
      break;
  }

  console.info(`[INFO] Upload provider configured: ${config.provider}`);
}

/**
 * Check if image optimization should be applied
 */
export function shouldOptimizeImages(): boolean {
  return getUploadConfig().optimizeImages;
}

/**
 * Get MIME type extension mapping
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return extMap[mimeType] || "jpg";
}
