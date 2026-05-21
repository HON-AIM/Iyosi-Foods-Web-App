import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { type NextRequest } from "next/server";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "cv");

function generateSafeFilename(originalName: string): string {
  const ext = path.extname(originalName) || ".pdf";
  const hash = crypto.randomBytes(16).toString("hex");
  return `${hash}${ext}`;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ message: "Expected multipart/form-data" }, { status: 400 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ message: "Invalid form data" }, { status: 400 });
    }

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const position = formData.get("position") as string;
    const coverLetter = formData.get("coverLetter") as string;
    const file = formData.get("cv");

    if (!firstName || !lastName || !email || !file) {
      return NextResponse.json({ message: "First name, last name, email, and CV file are required" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Invalid CV file" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ message: "Invalid file type. Accepted: PDF, DOC, DOCX, JPEG, PNG" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: "File size must be under 10MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = generateSafeFilename(file.name);

    await mkdir(UPLOAD_DIR, { recursive: true });
    const filePath = path.join(UPLOAD_DIR, filename);
    await writeFile(filePath, buffer);

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     request.headers.get("x-real-ip") ||
                     "unknown";

    const application = await prisma.jobApplication.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        phone: phone || null,
        position: position || null,
        cvFilename: filename,
        cvOriginalName: file.name,
        cvMimeType: file.type,
        cvSize: buffer.length,
        cvUrl: `/uploads/cv/${filename}`,
        coverLetter: coverLetter || null,
        ipAddress: clientIp,
      },
    });

    // Notify company
    try {
      const { transporter } = await import("@/lib/email");
      await transporter.sendMail({
        from: `"Iyosiola Careers" <${process.env.EMAIL_FROM || "israelmiracle12@gmail.com"}>`,
        to: process.env.EMAIL_FROM || "israelmiracle12@gmail.com",
        subject: `New CV Submission: ${firstName} ${lastName}${position ? ` - ${position}` : ""}`,
        text: `New CV received:\n\nName: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone || "N/A"}\nPosition: ${position || "Not specified"}\nCV: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/uploads/cv/${filename}`,
      });
    } catch (emailError) {
      console.error("[ERROR] Failed to notify company of CV submission:", emailError);
    }

    return NextResponse.json(
      { success: true, message: "CV submitted successfully! We'll be in touch.", applicationId: application.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ERROR] CV submission failed:", error);
    return NextResponse.json(
      { message: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
