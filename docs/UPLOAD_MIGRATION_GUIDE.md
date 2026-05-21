# Cloud Upload Migration Guide

## Overview

This guide walks you through migrating from local filesystem uploads to cloud-based storage using **Vercel Blob** (recommended) or **Cloudinary** (alternative).

### Key Benefits

✅ **Vercel Blob:**
- Zero-configuration (automatic with Vercel deployment)
- Integrated CDN with Vercel infrastructure
- Simple REST API
- Generous free tier
- **Recommended for Vercel deployments**

✅ **Cloudinary:**
- Advanced image transformations
- Responsive image delivery
- Built-in optimization features
- Better for complex image workflows
- **Recommended for heavy image manipulation**

---

## Part 1: Database Schema Update

Update your Prisma schema to track cloud storage metadata:

```prisma
model UploadedFile {
  id                String   @id @default(cuid())
  filename          String
  originalName      String
  mimeType          String
  size              Int
  originalSize      Int?     // Size before optimization
  url               String   // Public URL from cloud storage
  width             Int?     // Image width after optimization
  height            Int?     // Image height after optimization
  uploadedBy        String
  ipAddress         String
  checksum          String   // SHA256 hash
  storageProvider   String   @default("vercel-blob") // "vercel-blob" or "cloudinary"
  storagePath       String   // Path in cloud storage for deletion
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user User @relation(fields: [uploadedBy], references: [id], onDelete: Cascade)
  
  @@index([uploadedBy])
  @@index([createdAt])
}
```

Apply migration:
```bash
npm run prisma:migrate
```

---

## Part 2: Install Dependencies

### Option A: Vercel Blob (Recommended)

```bash
npm install @vercel/blob
# For image optimization (optional):
npm install sharp
```

### Option B: Cloudinary

```bash
npm install next-cloudinary
# For image optimization (optional):
npm install sharp
```

---

## Part 3: Environment Configuration

### For Vercel Blob

#### Local Development (.env.local)
```bash
# Vercel Blob token - get from https://vercel.com/account/storage/blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx

# Upload configuration
UPLOAD_PROVIDER=vercel-blob
OPTIMIZE_IMAGES=true
```

#### Vercel Production (Dashboard)
1. Go to project settings → Environment Variables
2. Add `BLOB_READ_WRITE_TOKEN` (auto-created if using Vercel Storage)
3. Add `UPLOAD_PROVIDER=vercel-blob`
4. Add `OPTIMIZE_IMAGES=true`

### For Cloudinary

#### Local Development (.env.local)
```bash
# Cloudinary credentials - get from https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Upload configuration
UPLOAD_PROVIDER=cloudinary
OPTIMIZE_IMAGES=true
```

#### Vercel Production (Dashboard)
1. Go to project settings → Environment Variables
2. Add all CLOUDINARY_* variables
3. Add `UPLOAD_PROVIDER=cloudinary`
4. Add `OPTIMIZE_IMAGES=true`

---

## Part 4: File Structure

The migration creates these new files:

```
src/lib/
├── image-optimizer.ts          # Image optimization utility
└── upload-config.ts            # Configuration management

src/app/api/upload/
└── route.ts                    # Refactored upload endpoint (Vercel Blob)

UPLOAD_CLOUDINARY_ALTERNATIVE.ts  # Alternative Cloudinary implementation
```

**Removed dependencies:**
- `fs/promises` (writeFile, mkdir, unlink)
- `path` (local path resolution)
- Local `public/uploads/` directory

---

## Part 5: Feature Breakdown

### Image Optimization

Automatically reduces file size while maintaining quality:

```
Original: 2.5MB (3200×2400) → Optimized: 340KB (2400×1800)
Compression: 86% reduction
```

**Optimization settings** (configurable in `image-optimizer.ts`):
- Max width: 2400px
- Max height: 2400px
- Quality: 85% (JPEG/WebP)
- Format: Maintains original (JPEG, PNG, WebP, GIF)

**Disable optimization** if needed:
```bash
OPTIMIZE_IMAGES=false
```

### File Validation

Checks performed before upload:

1. **MIME type validation** - Only images allowed
2. **File size validation** - 100 bytes to 10MB
3. **Magic byte validation** - Confirms actual file type
4. **Signature verification** - Detects fake/corrupt files

### Public URL Return

Upload endpoint now returns:

```json
{
  "message": "File uploaded successfully",
  "url": "https://[storage-url]/uploads/[uuid].jpg",
  "fileName": "3f4a2b1c-5d6e-7f8g-9h0i-1j2k3l4m5n6o.jpg",
  "mimeType": "image/jpeg",
  "size": 340000,
  "width": 2400,
  "height": 1800
}
```

---

## Part 6: Vercel Blob Setup

### Step 1: Create Storage (One-time)
1. Go to [https://vercel.com/account/storage](https://vercel.com/account/storage)
2. Click "Create Database" → Select "Blob"
3. Name: `iyosiola-uploads`
4. Region: Choose closest to you (US, EU, etc.)

### Step 2: Get Token
1. Storage dashboard → Click on your database
2. Copy "Read/Write Token"
3. Add to `.env.local` and Vercel dashboard

### Step 3: Verify Connection
```bash
npm install @vercel/blob
npm run dev
# Try uploading an image from admin panel
```

### Step 4: Test Upload
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-image.jpg"
```

---

## Part 7: Cloudinary Setup

### Step 1: Create Account
1. Sign up at [https://cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy:
   - Cloud Name
   - API Key
   - Click "Generate" for API Secret

### Step 2: Configure Environment
```bash
# .env.local
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
UPLOAD_PROVIDER=cloudinary
```

### Step 3: Test Upload
```bash
npm run dev
# Upload from admin panel and verify URL format
```

### Step 4: (Optional) Generate Signed URLs
If you want to restrict access:

```typescript
// In Cloudinary alternative route
const expiresIn = Math.floor(Date.now() / 1000) + 3600; // 1 hour
const signature = v2.utils.api_sign_request(
  { public_id: publicId, expires: expiresIn },
  process.env.CLOUDINARY_API_SECRET
);
// Return signed URL...
```

---

## Part 8: Migration Checklist

- [ ] Update Prisma schema
- [ ] Run `npm run prisma:migrate`
- [ ] Install dependencies (`@vercel/blob` or `next-cloudinary` + `sharp`)
- [ ] Choose storage provider (Vercel Blob or Cloudinary)
- [ ] Create cloud storage account
- [ ] Add environment variables locally
- [ ] Test locally: `npm run dev`
- [ ] Upload test image
- [ ] Verify URL is accessible
- [ ] Remove `/public/uploads` directory
- [ ] Commit code changes
- [ ] Add environment variables to Vercel dashboard
- [ ] Deploy to Vercel
- [ ] Test on production
- [ ] (Optional) Set up CDN optimization rules

---

## Part 9: API Usage

### Upload Endpoint

**POST** `/api/upload`

```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer [session-token]" \
  -F "file=@image.jpg"
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "url": "https://storage-url/uploads/uuid.jpg",
  "fileName": "uuid.jpg",
  "mimeType": "image/jpeg",
  "size": 340000,
  "width": 2400,
  "height": 1800
}
```

### List Uploads

**GET** `/api/upload?page=1&pageSize=20`

```bash
curl http://localhost:3000/api/upload \
  -H "Authorization: Bearer [session-token]"
```

**Response:**
```json
{
  "uploads": [
    {
      "id": "...",
      "filename": "...",
      "url": "https://...",
      "mimeType": "image/jpeg",
      "size": 340000,
      "width": 2400,
      "height": 1800,
      "createdAt": "2026-04-30T..."
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

## Part 10: Troubleshooting

### "BLOB_READ_WRITE_TOKEN not found"
- Check `.env.local` exists in project root
- Verify token is copied correctly from Vercel dashboard
- Restart dev server after adding env var

### Upload returns 500 error
- Check upload utility files are created (`image-optimizer.ts`, `upload-config.ts`)
- Verify environment variables are set
- Check server logs for detailed error

### Image optimization fails silently
- `sharp` is optional; install with `npm install sharp`
- Check logs for warnings
- Images still upload even if optimization fails

### URLs not accessible
- Verify storage provider authentication
- Check CDN is configured (Vercel Blob auto-configured)
- For Cloudinary, verify API credentials
- Check file access permissions

### Performance issues
- Enable caching: Add `Cache-Control` headers
- Use CDN URL transformations (Cloudinary)
- Consider serving WebP to modern browsers
- Monitor storage usage in dashboard

---

## Part 11: Cost Comparison

### Vercel Blob
- **Free tier:** 100GB/month
- **Typical usage:** <$1/month for small-medium sites
- **Scaling:** Pay-as-you-go ($0.15/GB over limit)

### Cloudinary
- **Free tier:** 25 credits/month (~10GB photos)
- **Typical usage:** <$5/month with optimization
- **Scaling:** More expensive but better for image manipulation

**Recommendation:** Start with Vercel Blob (included in Vercel plan), migrate to Cloudinary if you need advanced image features.

---

## Part 12: Next Steps

### Immediate
1. ✅ Update database schema
2. ✅ Install dependencies
3. ✅ Configure environment
4. ✅ Test locally
5. ✅ Deploy to production

### Short-term
- Set up monitoring for storage usage
- Configure automated cleanup of old uploads
- Add WebP generation for modern browsers
- Implement responsive image serving

### Long-term
- Advanced image optimization based on device
- Machine learning-powered image analysis
- Automated backup to secondary storage
- Usage analytics and reporting

---

## Support

**Vercel Blob Documentation:**
https://vercel.com/docs/storage/vercel-blob

**Cloudinary Documentation:**
https://cloudinary.com/documentation

**Sharp (Image Optimization):**
https://sharp.pixelplumbing.com/
