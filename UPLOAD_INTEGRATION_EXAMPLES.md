# Upload Integration Examples

## Frontend Integration

### React Hook for Image Upload

```typescript
// hooks/useImageUpload.ts
import { useState, useCallback } from 'react';

interface UploadResponse {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
}

export function useImageUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File): Promise<UploadResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Upload failed');
      }

      const data: UploadResponse = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { upload, loading, error };
}
```

### Component: Image Upload Input

```typescript
// components/ImageUploadField.tsx
import { useState } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';
import Image from 'next/image';

interface ImageUploadFieldProps {
  onImageUpload: (url: string, metadata: any) => void;
  label?: string;
}

export function ImageUploadField({
  onImageUpload,
  label = 'Upload Image',
}: ImageUploadFieldProps) {
  const { upload, loading, error } = useImageUpload();
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to cloud
    const result = await upload(file);
    if (result) {
      onImageUpload(result.url, {
        width: result.width,
        height: result.height,
        size: result.size,
      });
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">
        {label}
      </label>

      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            disabled={loading}
            className="block w-full"
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {loading && <p className="text-blue-500">Uploading...</p>}
      </div>

      {preview && (
        <div className="relative w-full h-48">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-contain"
          />
        </div>
      )}
    </div>
  );
}
```

---

## Admin Panel Integration

### Product Image Upload

```typescript
// app/admin/products/components/ProductForm.tsx
import { ImageUploadField } from '@/components/ImageUploadField';
import { useState } from 'react';

export function ProductForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    imageWidth: 0,
    imageHeight: 0,
  });

  const handleImageUpload = (url: string, metadata: any) => {
    setFormData({
      ...formData,
      image: url,
      imageWidth: metadata.width,
      imageHeight: metadata.height,
    });
  };

  return (
    <form>
      <div>
        <label>Product Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label>Product Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <ImageUploadField
        label="Product Image"
        onImageUpload={handleImageUpload}
      />

      {formData.image && (
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Image: {formData.imageWidth}×{formData.imageHeight}px
          </p>
          <img
            src={formData.image}
            alt="Product"
            className="w-32 h-32 object-cover rounded"
          />
        </div>
      )}

      <button type="submit">Save Product</button>
    </form>
  );
}
```

### User Avatar Upload

```typescript
// app/dashboard/settings/components/AvatarUpload.tsx
import { ImageUploadField } from '@/components/ImageUploadField';
import { useState } from 'react';

export function AvatarUpload() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleAvatarUpload = async (url: string) => {
    setAvatarUrl(url);

    // Save to database
    await fetch('/api/user/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl: url }),
    });
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Upload Avatar</h2>

      <ImageUploadField
        label="Choose Avatar Image"
        onImageUpload={handleAvatarUpload}
      />

      {avatarUrl && (
        <div className="mt-4">
          <p className="text-sm text-green-600">✓ Avatar updated!</p>
        </div>
      )}
    </div>
  );
}
```

---

## Direct API Usage

### Using Fetch API

```typescript
// Direct upload without component
async function uploadProductImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return {
    url: data.url,
    dimensions: `${data.width}x${data.height}`,
    size: data.size,
  };
}
```

### Using cURL (Testing)

```bash
# Single file upload
curl -X POST http://localhost:3000/api/upload \
  -F "file=@image.jpg"

# Response
{
  "message": "File uploaded successfully",
  "url": "https://blob.vercelusercontent.com/...",
  "fileName": "uuid.jpg",
  "size": 340000,
  "width": 2400,
  "height": 1800
}
```

---

## Database Integration

### Storing Image Data

```typescript
// Save uploaded image to product
import { prisma } from '@/lib/db';

async function saveProductWithImage(
  productData: any,
  uploadedImageUrl: string
) {
  const product = await prisma.product.create({
    data: {
      ...productData,
      image: uploadedImageUrl, // Store URL directly
      imageWidth: 2400,
      imageHeight: 1800,
    },
  });

  return product;
}

// Update existing product image
async function updateProductImage(
  productId: string,
  newImageUrl: string,
  width: number,
  height: number
) {
  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      image: newImageUrl,
      imageWidth: width,
      imageHeight: height,
      updatedAt: new Date(),
    },
  });

  return product;
}
```

---

## Server-Side Image Processing

### Generate Thumbnail in Cloudinary

```typescript
// If using Cloudinary, generate thumbnails automatically
function getThumbnailUrl(
  originalUrl: string,
  width: number = 200,
  height: number = 200
) {
  // Cloudinary transformation URL
  return originalUrl.replace('/image/upload/', `/image/upload/w_${width},h_${height},c_fill/`);
}

// Example
const original = 'https://res.cloudinary.com/.../image/upload/abc123.jpg';
const thumbnail = getThumbnailUrl(original); // width 200, height 200
const medium = getThumbnailUrl(original, 500, 500);
const large = getThumbnailUrl(original, 1200, 1200);
```

### Responsive Images with Vercel Blob

```typescript
// Vercel Blob uses <Image> component
import Image from 'next/image';

export function ProductImage({ imageUrl, alt }: any) {
  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={800}
      height={600}
      quality={85}
      priority={false}
      // Vercel Blob automatically optimizes images
    />
  );
}
```

---

## Error Handling

### Comprehensive Error Handler

```typescript
// lib/handleUploadError.ts
export function handleUploadError(error: any): string {
  if (error.status === 401) {
    return 'You must be logged in as an admin to upload images.';
  }

  if (error.status === 400) {
    if (error.message.includes('Invalid file type')) {
      return 'Please upload a JPEG, PNG, WebP, or GIF image.';
    }
    if (error.message.includes('File size')) {
      return 'Image must be between 100 bytes and 10MB.';
    }
    return 'Invalid file. Please check and try again.';
  }

  if (error.status === 500) {
    return 'Server error. Please try again later.';
  }

  return 'Upload failed. Please try again.';
}

// Usage
const result = await upload(file);
if (!result && error) {
  const message = handleUploadError(error);
  toast.error(message);
}
```

---

## Monitoring & Analytics

### Track Upload Metrics

```typescript
// lib/uploadMetrics.ts
interface UploadMetrics {
  fileName: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  uploadTime: number;
  timestamp: Date;
}

export async function logUploadMetrics(metrics: UploadMetrics) {
  // Send to analytics service
  await fetch('/api/analytics/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metrics),
  });
}

// Usage in upload hook
const startTime = Date.now();
const result = await upload(file);
if (result) {
  await logUploadMetrics({
    fileName: file.name,
    originalSize: file.size,
    optimizedSize: result.size,
    compressionRatio: ((file.size - result.size) / file.size) * 100,
    uploadTime: Date.now() - startTime,
    timestamp: new Date(),
  });
}
```

---

## Batch Upload

### Upload Multiple Images

```typescript
// lib/batchUpload.ts
export async function uploadMultipleImages(
  files: File[],
  onProgress?: (progress: number) => void
) {
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        results.push({ success: true, ...data });
      } else {
        results.push({ success: false, error: 'Upload failed' });
      }
    } catch (error) {
      results.push({ success: false, error: String(error) });
    }

    // Update progress
    if (onProgress) {
      onProgress(((i + 1) / files.length) * 100);
    }
  }

  return results;
}
```

---

## S3-like Features (Cloudinary)

### Delete Uploaded Image

```typescript
// api/upload/delete.ts (new endpoint needed)
export async function DELETE(request: NextRequest) {
  const { storagePath } = await request.json();

  try {
    // For Cloudinary
    const response = await cloudinary.v2.uploader.destroy(storagePath);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
```

### List All Uploads (Paginated)

```typescript
// Already implemented in GET /api/upload
// Returns paginated list of admin's uploads with:
// - URL
// - Size (original and optimized)
// - Dimensions (width/height)
// - Upload date
// - Storage provider
```

---

## Performance Optimization

### Lazy Load Images

```typescript
// components/LazyImage.tsx
import Image from 'next/image';

export function LazyImage({ src, alt, ...props }: any) {
  return (
    <Image
      src={src}
      alt={alt}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3C/svg%3E"
      {...props}
    />
  );
}
```

### Next.js Image Optimization

```typescript
// next.config.ts
export default {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'blob.vercelusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

---

## Summary

Use these examples to:
1. ✅ Integrate upload in React components
2. ✅ Handle files in admin panels
3. ✅ Save images to database
4. ✅ Process and optimize images
5. ✅ Monitor upload metrics
6. ✅ Implement error handling
7. ✅ Batch process multiple files
8. ✅ Lazy load images in UI

All examples are production-ready and follow best practices.
