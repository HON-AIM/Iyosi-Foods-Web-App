import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { tmpdir } from "os";
import { join } from "path";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function sanitizeFilename(filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "");
  const ext = safe.substring(safe.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return "";
  if (safe.includes("..")) return "";
  return safe;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const safeName = sanitizeFilename(filename);
    if (!safeName) {
      return NextResponse.json({ message: "Invalid filename" }, { status: 400 });
    }

    const fs = await import("fs/promises");
    const filePath = join(tmpdir(), "iyosiola-uploads", safeName);

    await fs.access(filePath);

    const buffer = await fs.readFile(filePath);

    const ext = safeName.substring(safeName.lastIndexOf(".")).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
    };
    const contentType = mimeMap[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }
}
