import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { type NextRequest } from "next/server";
import { z } from "zod";

const ContactSchema = z.object({
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  email: z.string().email().max(100).trim().toLowerCase(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional().or(z.literal("")),
  subject: z.string().min(5).max(100).trim(),
  category: z.enum(["BUSINESS_INQUIRY", "INVESTMENT", "PRODUCT_SUPPORT", "COMPLAINT", "OTHER"]),
  message: z.string().min(10).max(5000).trim(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    const validation = ContactSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return NextResponse.json({ message: "Validation failed", errors }, { status: 400 });
    }

    const { firstName, lastName, email, phone, subject, category, message } = validation.data;
    const fullName = `${firstName} ${lastName}`;

    // Send confirmation email to the user
    try {
      await sendEmail({
        to: email,
        subject: "We received your message - Iyosi Foods Foods",
        template: "contact-confirmation",
        data: { subject, message },
      });
    } catch (emailError) {
      console.error("[ERROR] Failed to send contact confirmation email:", emailError);
    }

    // Notify company
    try {
      const { transporter } = await import("@/lib/email");
      await transporter.sendMail({
        from: `"Iyosi Foods Foods Contact" <${process.env.EMAIL_FROM || "israelmiracle12@gmail.com"}>`,
        to: process.env.EMAIL_FROM || "israelmiracle12@gmail.com",
        subject: `[Contact Form] ${category} - ${subject}`,
        text: `New contact form submission:\n\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone || "N/A"}\nCategory: ${category}\nSubject: ${subject}\nMessage:\n${message}`,
      });
    } catch (emailError) {
      console.error("[ERROR] Failed to notify company of contact form:", emailError);
    }

    return NextResponse.json(
      { success: true, message: "Thank you! Your message has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Contact form submission failed:", error);
    return NextResponse.json(
      { message: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
