import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { type NextRequest } from "next/server";
import crypto from "crypto";

// Ensure this route uses the Node.js runtime and allows up to 6MB body
export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MIN_FILE_SIZE_BYTES = 100;

function isValidImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true;
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 && (buffer[4] === 0x39 || buffer[4] === 0x37)) return true;

  return false;
}

function getExtensionFromMimeType(mimeType: string): string {
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return extMap[mimeType] || "jpg";
}

function generateSafeFilename(mimeType: string): string {
  const uuid = crypto.randomUUID();
  const randomSuffix = crypto.randomBytes(4).toString("hex");
  const ext = getExtensionFromMimeType(mimeType);
  return `${uuid}-${randomSuffix}.${ext}`;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized: Admin access required" }, { status: 401 });
    }

    // ─── BLOB TOKEN CHECK (REQUIRED) ─────────────────────────────────────────
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      console.error("[ERROR] BLOB_READ_WRITE_TOKEN is not configured. Available env vars with BLOB:",
        Object.keys(process.env).filter(k => k.includes("BLOB")).join(", ") || "none"
      );
      return NextResponse.json(
        {
          message: "Server error: File storage is not configured. Please add BLOB_READ_WRITE_TOKEN to environment variables.",
          hint: "Vercel Dashboard → Settings → Environment Variables → add BLOB_READ_WRITE_TOKEN. For local dev, add to .env and restart the dev server.",
        },
        { status: 503 }
      );
    }

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ message: "Bad Request: Expected multipart/form-data" }, { status: 400 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ message: "Bad Request: Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Bad Request: No file provided or invalid file" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ message: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed." }, { status: 400 });
    }

    if (file.size < MIN_FILE_SIZE_BYTES || file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ message: "Bad Request: File size must be between 100 bytes and 5MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!isValidImageBuffer(buffer)) {
      return NextResponse.json({ message: "File content does not match an allowed image format." }, { status: 400 });
    }

    const filename = generateSafeFilename(file.type);

    // ─── BLOB UPLOAD ─────────────────────────────────────────────────────────
    let blob;
    try {
      blob = await put(`products/${filename}`, buffer, {
        access: "public",
        contentType: file.type,
        token: blobToken,
      });
    } catch (uploadError) {
      const errorMessage = uploadError instanceof Error ? uploadError.message : String(uploadError);
      console.error("[ERROR] Vercel Blob upload failed:", {
        error: errorMessage,
        stack: uploadError instanceof Error ? uploadError.stack : undefined,
        filename,
        size: buffer.length,
        mimeType: file.type,
      });
      return NextResponse.json(
        { message: `Image upload failed: ${errorMessage}` },
        { status: 500 }
      );
    }

    const fileUrl = blob.url;

    // ─── SAVE METADATA ───────────────────────────────────────────────────────
    try {
      await prisma.uploadedFile.create({
        data: {
          filename,
          originalName: file.name.replace(/[\/\\]/g, "_").slice(0, 255),
          mimeType: file.type,
          size: buffer.length,
          url: fileUrl,
          uploadedBy: session.user.id,
          ipAddress: clientIp,
          checksum: crypto.createHash("sha256").update(buffer).digest("hex"),
        },
      });
    } catch (dbError) {
      // If DB save fails, clean up the uploaded blob to avoid orphans
      try {
        await del(fileUrl);
      } catch {}
      console.error("[ERROR] Failed to create upload record:", { error: dbError instanceof Error ? dbError.message : String(dbError) });
      return NextResponse.json({ message: "Server error: Failed to save upload metadata" }, { status: 500 });
    }

    console.info("[AUDIT] File uploaded successfully:", {
      adminId: session.user.id,
      filename,
      url: fileUrl,
      size: buffer.length,
      ip: clientIp,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { message: "File uploaded successfully", url: fileUrl, fileName: filename },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ERROR] Upload failed:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ message: "An error occurred while uploading the file" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get("pageSize") || "20")));
    const skip = (page - 1) * pageSize;

    const [uploads, total] = await Promise.all([
      prisma.uploadedFile.findMany({
        where: { uploadedBy: session.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.uploadedFile.count({ where: { uploadedBy: session.user.id } }),
    ]);

    return NextResponse.json({ uploads, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } }, { status: 200 });
  } catch (error) {
    console.error("[ERROR] GET uploads failed:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ message: "Failed to fetch uploads" }, { status: 500 });
  }
}
