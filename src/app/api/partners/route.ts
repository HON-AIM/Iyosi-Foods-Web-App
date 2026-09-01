import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { z } from "zod";

const PartnerSchema = z.object({
  companyName: z.string().min(2).max(200).trim(),
  contactPerson: z.string().min(2).max(100).trim(),
  email: z.string().email().max(100).trim().toLowerCase(),
  phone: z.string().min(5).max(30).trim(),
  address: z.string().min(5).max(500).trim(),
  description: z.string().min(10).max(5000).trim(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    const validation = PartnerSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return NextResponse.json({ message: "Validation failed", errors }, { status: 400 });
    }

    const { companyName, contactPerson, email, phone, address, description } = validation.data;

    // Notify company
    try {
      const { transporter } = await import("@/lib/email");
      await transporter.sendMail({
        from: `"Iyosi Foods Partnerships" <${process.env.EMAIL_FROM}>`,
        to: process.env.CONTACT_TO_EMAIL || process.env.EMAIL_FROM || "iyosifoods@gmail.com",
        subject: `New Partner Application: ${companyName}`,
        text: `New distributor partnership application:\n\nCompany: ${companyName}\nContact: ${contactPerson}\nEmail: ${email}\nPhone: ${phone}\nAddress: ${address}\n\nDescription:\n${description}`,
      });
    } catch (emailError) {
      console.error("[ERROR] Failed to notify company of partner application:", emailError);
    }

    return NextResponse.json(
      { success: true, message: "Application submitted successfully! Our team will contact you within 3-5 business days." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Partner application failed:", error);
    return NextResponse.json(
      { message: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
