# Cloud Upload Implementation - Quick Reference

## 5-Minute Setup

### 1. Update Database
```bash
npm run prisma:migrate
```

### 2. Install Package
```bash
npm install @vercel/blob sharp
```

### 3. Set Environment
```bash
# .env.local
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
UPLOAD_PROVIDER=vercel-blob
OPTIMIZE_IMAGES=true
```

### 4. Test
```bash
npm run dev
# Upload image from admin panel
```

---

## File Changes Summary

### New Files Created
| File | Purpose |
|------|---------|
| `src/lib/image-optimizer.ts` | Image compression & optimization |
| `src/lib/upload-config.ts` | Storage provider configuration |
| `UPLOAD_CLOUDINARY_ALTERNATIVE.ts` | Alternative Cloudinary implementation |

### Files Modified
| File | Changes |
|------|---------|
| `src/app/api/upload/route.ts` | Cloud storage integration (Vercel Blob) |
| `prisma/schema.prisma` | Added new fields to `UploadedFile` model |

### Files Removed
- ❌ Local filesystem dependencies (`fs/promises`, `path`)
- ❌ Local upload directory `/public/uploads/`

---

## Before → After Comparison

### Before (Local Filesystem)
```typescript
// Storage
await writeFile(filePath, buffer); // Local disk

// Response
return { url: `/uploads/${filename}` }; // Relative path
```

### After (Cloud Storage)
```typescript
// Storage
const blob = await put(pathname, uploadBuffer, {...}); // Cloud

// Response
return { url: blob.url }; // Public CDN URL
```

---

## Configuration Options

### Vercel Blob (Recommended)
```bash
UPLOAD_PROVIDER=vercel-blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
OPTIMIZE_IMAGES=true
```

### Cloudinary Alternative
```bash
UPLOAD_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPTIMIZE_IMAGES=true
```

---

## Feature Checklist

✅ **File Validation**
- MIME type checking (JPEG, PNG, WebP, GIF only)
- File size limits (100B - 10MB)
- Magic byte signature validation

✅ **Image Optimization**
- Automatic compression (85% quality)
- Dimension limiting (2400×2400px max)
- Format preservation (JPEG→JPEG, PNG→PNG, etc.)
- ~80% size reduction typical

✅ **Security**
- Admin-only endpoint
- SHA256 checksums stored
- IP address logging
- Path traversal protection

✅ **Metadata Tracking**
- Original vs optimized sizes
- Image dimensions (width/height)
- Storage provider recorded
- Cloud storage path for deletion

---

## Response Examples

### Upload Success
```json
{
  "message": "File uploaded successfully",
  "url": "https://blob.vercelusercontent.com/...",
  "fileName": "3f4a2b1c-5d6e-7f8g.jpg",
  "mimeType": "image/jpeg",
  "size": 340000,
  "width": 2400,
  "height": 1800
}
```

### Upload Failure
```json
{
  "message": "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed."
}
// Status: 400
```

---

## Environment Variables

### Required for Vercel Blob
- `BLOB_READ_WRITE_TOKEN` - From Vercel Storage dashboard
- `UPLOAD_PROVIDER` - Set to `vercel-blob`

### Required for Cloudinary
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `UPLOAD_PROVIDER` - Set to `cloudinary`

### Optional
- `OPTIMIZE_IMAGES` - Default: `true`

---

## Testing Checklist

- [ ] Image uploads successfully
- [ ] Public URL is accessible
- [ ] Image dimensions are returned
- [ ] Compression reduced file size
- [ ] Invalid files rejected
- [ ] Only admins can upload
- [ ] Metadata saved to database
- [ ] Works in production

---

## Costs

| Provider | Free Tier | Typical | Scaling |
|----------|-----------|---------|---------|
| Vercel Blob | 100GB/mo | <$1/mo | $0.15/GB |
| Cloudinary | 25 credits | <$5/mo | Variable |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Token not found | Add to `.env.local`, restart dev server |
| Upload fails | Check env vars, verify auth, check logs |
| Images not accessible | Verify provider authentication, check CDN |
| Optimization fails | Install `sharp` with `npm install sharp` |
| Permission denied | Ensure admin role, check NextAuth session |

---

## Migration From Local Uploads

### Option 1: Dual-write During Transition
```typescript
// Save to cloud AND local for fallback
await put(pathname, buffer);
await writeFile(localPath, buffer);
```

### Option 2: Batch Migrate Existing Files
```bash
# Process existing /public/uploads files
# Upload each to cloud storage
# Update database URLs
# Delete local copies
```

### Option 3: Clean Start
```bash
# Delete /public/uploads directory
# Deploy cloud version
# Users re-upload as needed
```

---

## Monitoring

### Vercel Blob Dashboard
- Storage usage
- Request counts
- Bandwidth usage

### Cloudinary Dashboard
- Transformation history
- Credits remaining
- Optimization stats

---

## Production Deployment

1. Add env vars to Vercel project settings
2. Redeploy application
3. Test upload on production
4. Monitor storage metrics
5. Set up cost alerts (optional)

**Don't forget:** Remove `/public/uploads` directory from production once migration complete.

---

## Further Reading

- [Full Migration Guide](./UPLOAD_MIGRATION_GUIDE.md)
- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Image Optimization Best Practices](https://www.smashingmagazine.com/2019/05/web-image-optimization/)
