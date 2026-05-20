/**
 * Image Optimizer - Optimizes images before upload to cloud storage
 * Reduces file size and ensures consistent formats
 */

interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface OptimizedImage {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Optimize image for web - resize, compress, and convert format
 * Returns optimized buffer and metadata
 */
export async function optimizeImage(
  buffer: Buffer,
  mimeType: string,
  options: OptimizationOptions = {}
): Promise<OptimizedImage> {
  try {
    // Import sharp dynamically (optional dependency)
    const sharp = require("sharp");

    const {
      maxWidth = 2400,
      maxHeight = 2400,
      quality = 80,
    } = options;

    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Calculate dimensions maintaining aspect ratio
    let width = metadata.width || maxWidth;
    let height = metadata.height || maxHeight;

    if (width > maxWidth || height > maxHeight) {
      const scale = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    // Optimize based on format
    let optimized = image.resize(width, height, {
      fit: "inside",
      withoutEnlargement: true,
    });

    // Apply format-specific optimization
    if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
      optimized = optimized.jpeg({ quality, progressive: true });
    } else if (mimeType === "image/png") {
      optimized = optimized.png({ quality, progressive: true });
    } else if (mimeType === "image/webp") {
      optimized = optimized.webp({ quality });
    } else if (mimeType === "image/gif") {
      // GIF handled without modification
      return {
        buffer,
        mimeType,
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: buffer.length,
      };
    }

    const optimizedBuffer = await optimized.toBuffer();

    return {
      buffer: optimizedBuffer,
      mimeType,
      width,
      height,
      size: optimizedBuffer.length,
    };
  } catch (error) {
    // If sharp not available, return original
    console.warn("[WARN] Image optimization failed, using original:", error);
    return {
      buffer,
      mimeType,
      width: 0,
      height: 0,
      size: buffer.length,
    };
  }
}

/**
 * Generate WebP version of image for modern browsers
 * Falls back gracefully if sharp unavailable
 */
export async function generateWebPVersion(
  buffer: Buffer,
  options: OptimizationOptions = {}
): Promise<Buffer | null> {
  try {
    const sharp = require("sharp");
    const { quality = 80 } = options;

    return await sharp(buffer)
      .webp({ quality })
      .toBuffer();
  } catch (error) {
    console.warn("[WARN] WebP generation skipped:", error);
    return null;
  }
}

/**
 * Validate image signature (magic bytes) to prevent fake files
 */
export function isValidImageSignature(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  )
    return true;

  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46)
    return true;

  // WebP: RIFF header check
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.length >= 12 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  )
    return true;

  return false;
}
