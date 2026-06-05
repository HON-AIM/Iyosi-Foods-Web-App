import nodemailer from "nodemailer";

function validateEmailConfig(): void {
  const requiredEnvVars = [
    "EMAIL_SERVER_HOST",
    "EMAIL_SERVER_PORT",
    "EMAIL_SERVER_USER",
    "EMAIL_SERVER_PASSWORD",
    "EMAIL_FROM",
  ];

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      console.warn(`[WARN] Missing environment variable: ${varName}`);
    }
  }
}

validateEmailConfig();

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || "smtp.example.com",
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendVerificationEmail(email: string, name: string, verificationLink: string) {
  const safeName = escapeHtml(name || "User");

  await transporter.sendMail({
    from: `"Iyosiola Foods" <${process.env.EMAIL_FROM || "israelmiracle12@gmail.com"}>`,
    to: email,
    subject: "Verify your email address - Iyosiola Foods",
    text: `Welcome to Iyosiola Foods, ${safeName}!\n\nPlease verify your email by visiting: ${verificationLink}\n\nThis link expires in 24 hours.\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #333;">Welcome to Iyosiola Foods, ${safeName}!</h2>
        <p style="color: #555;">Please confirm your email address to activate your account and access your dashboard.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="color: #888; font-size: 12px;">This link expires in 24 hours. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, resetLink: string) {
  const safeName = escapeHtml(name || "User");

  await transporter.sendMail({
    from: `"Iyosiola Foods" <${process.env.EMAIL_FROM || "israelmiracle12@gmail.com"}>`,
    to: email,
    subject: "Reset your password - Iyosiola Foods",
    text: `Reset Your Password\n\nHello ${safeName},\n\nWe received a request to reset the password for your Iyosiola Foods account.\n\nClick the link below to reset your password (expires in 1 hour):\n${resetLink}\n\nIf you didn't request a new password, you can safely ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
        <p style="color: #555; font-size: 16px;">Hello ${safeName},</p>
        <p style="color: #555; font-size: 16px;">We received a request to reset the password for your Iyosiola Foods account associated with this email address.</p>
        <p style="color: #555; font-size: 16px;">You can reset your password by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #888; font-size: 14px; text-align: center;">This link will expire in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px; text-align: center;">If you didn't request a new password, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendAdminDirectMessage(
  email: string,
  subject: string,
  content: string
) {
  const safeSubject = escapeHtml(subject);
  const safeContent = escapeHtml(content).replace(/\n/g, "<br />");

  await transporter.sendMail({
    from: `"Iyosiola Store" <${process.env.EMAIL_FROM || "israelmiracle12@gmail.com"}>`,
    to: email,
    subject: safeSubject,
    text: `A message from the Iyosiola Store Team:\n\n${content}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
           <h2 style="color: #2c3e50; margin: 0;">Iyosiola Store</h2>
           <p style="color: #7f8c8d; font-size: 14px; margin-top: 5px;">A message from our team</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; color: #333; line-height: 1.6;">
          ${safeContent}
        </div>
        
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          This email was sent by the Iyosiola Group Admin. Please do not reply directly to this email unless specifically instructed.
        </p>
      </div>
    `,
  });
}

export async function sendOrderStatusUpdate(
  email: string,
  name: string,
  orderId: string,
  status: string
) {
  const safeName = escapeHtml(name || "Customer");
  const safeOrderId = escapeHtml(orderId);
  const safeStatus = escapeHtml(status);

  await transporter.sendMail({
    from: `"Iyosiola Store" <${process.env.EMAIL_FROM || "israelmiracle12@gmail.com"}>`,
    to: email,
    subject: `Order Update: ${safeStatus} - Iyosiola Foods`,
    text: `Hello ${safeName},\n\nYour order #${safeOrderId} has been updated to: ${safeStatus}.\n\nThank you for shopping with Iyosiola Foods.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Order Status Update</h2>
        <p style="color: #555;">Hello ${safeName},</p>
        <p style="color: #555;">Your order <strong>#${safeOrderId}</strong> has been updated:</p>
        <div style="text-align: center; margin: 20px 0; padding: 15px; background-color: #f0f9ff; border-radius: 6px;">
          <p style="font-size: 18px; font-weight: bold; color: #1e3a8a; margin: 0;">${safeStatus}</p>
        </div>
        <p style="color: #888; font-size: 12px; text-align: center;">Thank you for shopping with Iyosiola Foods.</p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  order: {
    orderNumber: string;
    totalAmount: number;
    shippingAddr: string;
    items: Array<{ productName: string; quantity: number; price: number }>;
  }
) {
  const safeName = escapeHtml(name || "Customer");
  const formattedTotal = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(order.totalAmount);

  const itemRows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(item.productName)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(item.price * item.quantity)}</td>
        </tr>`
    )
    .join("");

  await transporter.sendMail({
    from: `"Iyosiola Foods" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Order Confirmed — ${order.orderNumber} | Iyosiola Foods`,
    text: `Hi ${safeName}, your order ${order.orderNumber} has been confirmed and payment received. Total: ${formattedTotal}. Shipping to: ${order.shippingAddr}. We will update you when your order is on its way.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eaeaea;border-radius:10px;">
        <h2 style="color:#166534;">Order Confirmed ✅</h2>
        <p style="color:#555;">Hi ${safeName}, thank you for your order. We have received your payment and are preparing your items.</p>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0 0 8px;font-size:13px;color:#888;">ORDER NUMBER</p>
          <p style="margin:0;font-size:18px;font-weight:bold;color:#111;">${escapeHtml(order.orderNumber)}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:10px 12px;text-align:left;font-size:13px;color:#555;">Product</th>
              <th style="padding:10px 12px;text-align:center;font-size:13px;color:#555;">Qty</th>
              <th style="padding:10px 12px;text-align:right;font-size:13px;color:#555;">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="text-align:right;margin-bottom:20px;">
          <strong style="font-size:16px;">Total: ${formattedTotal}</strong>
        </div>
        <p style="color:#555;font-size:14px;"><strong>Shipping to:</strong> ${escapeHtml(order.shippingAddr)}</p>
        <p style="color:#888;font-size:12px;margin-top:24px;">Questions? Contact us at ${process.env.EMAIL_FROM}</p>
      </div>
    `,
  });
}

interface SendEmailOptions {
  to: string;
  subject: string;
  template: "email-verification" | "password-reset" | "contact-confirmation" | "admin-message";
  data: Record<string, string>;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, template, data } = options;

  switch (template) {
    case "email-verification":
      await sendVerificationEmail(
        to,
        data.name || "User",
        data.verificationLink || ""
      );
      break;
    case "password-reset":
      await sendPasswordResetEmail(
        to,
        data.name || "User",
        data.resetLink || ""
      );
      break;
    case "contact-confirmation":
      await transporter.sendMail({
        from: `"Iyosiola Foods" <${process.env.EMAIL_FROM || "israelmiracle12@gmail.com"}>`,
        to,
        subject: "We received your message - Iyosiola Foods",
        text: `Thank you for contacting Iyosiola Foods!\n\nWe have received your message and will get back to you within 24 business hours.\n\nYour submitted message:\n${data.message || ""}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #333;">Thank You for Contacting Us!</h2>
            <p style="color: #555;">We have received your message and will get back to you within 24 business hours.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #666; font-size: 14px;"><strong>Subject:</strong> ${escapeHtml(data.subject || "")}</p>
              <p style="color: #666; font-size: 14px;"><strong>Message:</strong></p>
              <p style="color: #333;">${escapeHtml(data.message || "").replace(/\n/g, "<br />")}</p>
            </div>
            <p style="color: #888; font-size: 12px;">If you have any urgent inquiries, please call us at +234 800 IYOSIOLA.</p>
          </div>
        `,
      });
      break;
    case "admin-message":
      await sendAdminDirectMessage(to, subject, data.content || "");
      break;
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}
