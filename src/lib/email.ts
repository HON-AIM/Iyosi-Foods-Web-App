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
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
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
    from: `"Iyosi Foods LTD" <${process.env.EMAIL_FROM || "iyosifoods@gmail.com"}>`,
    to: email,
    subject: "Verify your email address - Iyosi Foods LTD",
    text: `Welcome to Iyosi Foods LTD, ${safeName}!\n\nPlease verify your email by visiting: ${verificationLink}\n\nThis link expires in 24 hours.\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #333;">Welcome to Iyosi Foods LTD, ${safeName}!</h2>
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
    from: `"Iyosi Foods LTD" <${process.env.EMAIL_FROM || "iyosifoods@gmail.com"}>`,
    to: email,
    subject: "Reset your password - Iyosi Foods LTD",
    text: `Reset Your Password\n\nHello ${safeName},\n\nWe received a request to reset the password for your Iyosi Foods LTD account.\n\nClick the link below to reset your password (expires in 1 hour):\n${resetLink}\n\nIf you didn't request a new password, you can safely ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
        <p style="color: #555; font-size: 16px;">Hello ${safeName},</p>
        <p style="color: #555; font-size: 16px;">We received a request to reset the password for your Iyosi Foods LTD account associated with this email address.</p>
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
    from: `"Iyosi Foods Store" <${process.env.EMAIL_FROM || "iyosifoods@gmail.com"}>`,
    to: email,
    subject: safeSubject,
    text: `A message from the Iyosi Foods Store Team:\n\n${content}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
           <h2 style="color: #2c3e50; margin: 0;">Iyosi Foods Store</h2>
           <p style="color: #7f8c8d; font-size: 14px; margin-top: 5px;">A message from our team</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; color: #333; line-height: 1.6;">
          ${safeContent}
        </div>
        
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          This email was sent by the Iyosi Foods LTD Admin. Please do not reply directly to this email unless specifically instructed.
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
    from: `"Iyosi Foods Store" <${process.env.EMAIL_FROM || "iyosifoods@gmail.com"}>`,
    to: email,
    subject: `Order Update: ${safeStatus} - Iyosi Foods LTD`,
    text: `Hello ${safeName},\n\nYour order #${safeOrderId} has been updated to: ${safeStatus}.\n\nThank you for shopping with Iyosi Foods LTD.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Order Status Update</h2>
        <p style="color: #555;">Hello ${safeName},</p>
        <p style="color: #555;">Your order <strong>#${safeOrderId}</strong> has been updated:</p>
        <div style="text-align: center; margin: 20px 0; padding: 15px; background-color: #f0f9ff; border-radius: 6px;">
          <p style="font-size: 18px; font-weight: bold; color: #1e3a8a; margin: 0;">${safeStatus}</p>
        </div>
        <p style="color: #888; font-size: 12px; text-align: center;">Thank you for shopping with Iyosi Foods LTD.</p>
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
  const safeOrderNumber = escapeHtml(order.orderNumber);
  const safeShippingAddr = escapeHtml(order.shippingAddr);
  const formattedTotal = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(order.totalAmount);

  const formatNaira = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f5f5f5;font-size:14px;color:#374151;">
          ${escapeHtml(item.productName)}
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f5f5f5;font-size:14px;color:#374151;text-align:center;">
          x${item.quantity}
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f5f5f5;font-size:14px;color:#374151;text-align:right;font-weight:bold;">
          ${formatNaira(item.price * item.quantity)}
        </td>
      </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background-color:#f9fafb;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:24px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            
            <!-- HEADER -->
            <tr>
              <td style="background:linear-gradient(135deg,#166534,#15803d);padding:32px 24px;text-align:center;">
                <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">&#10004;&#65039; Order Confirmed!</h1>
                <p style="color:#bbf7d0;margin:8px 0 0;font-size:14px;">Thank you for shopping with Iyosi Foods LTD</p>
              </td>
            </tr>

            <!-- ORDER DETAILS -->
            <tr>
              <td style="padding:24px;">
                <p style="color:#374151;font-size:15px;margin:0 0 16px;">
                  Hello <strong>${safeName}</strong>,
                </p>
                <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
                  Great news! Your payment has been confirmed and your order is now being processed.
                  You can track your order status at any time from your dashboard.
                </p>

                <!-- ORDER NUMBER BOX -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:10px;margin-bottom:24px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0;font-size:12px;color:#15803d;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Order Number</p>
                      <p style="margin:6px 0 0;font-size:22px;font-weight:800;color:#166534;font-family:monospace;">#${safeOrderNumber}</p>
                    </td>
                  </tr>
                </table>

                <!-- ITEMS TABLE -->
                <p style="color:#374151;font-size:14px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">Items Ordered</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                  <thead>
                    <tr style="background:#f9fafb;">
                      <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Product</th>
                      <th style="padding:10px 16px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Qty</th>
                      <th style="padding:10px 16px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>${itemsHtml}</tbody>
                  <tfoot>
                    <tr style="background:#f0fdf4;">
                      <td colspan="2" style="padding:14px 16px;font-weight:800;font-size:15px;color:#166534;">Total Paid</td>
                      <td style="padding:14px 16px;font-weight:800;font-size:15px;color:#166534;text-align:right;">${formattedTotal}</td>
                    </tr>
                  </tfoot>
                </table>

                <!-- SHIPPING -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;margin-bottom:24px;">
                  <tr>
                    <td style="padding:16px;">
                      <p style="margin:0 0 6px;font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;">Delivering To</p>
                      <p style="margin:0;font-size:14px;color:#374151;">${safeShippingAddr}</p>
                    </td>
                  </tr>
                </table>

                <!-- TRACK ORDER BUTTON -->
                <div style="text-align:center;margin-bottom:24px;">
                  <a href="${process.env.NEXTAUTH_URL || "https://iyosifoods.com"}/dashboard/orders"
                    style="display:inline-block;background:linear-gradient(135deg,#166534,#15803d);color:white;font-weight:800;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">
                    &#128230; Track Your Order &#8594;
                  </a>
                  <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
                    Log into your Iyosi Foods dashboard to track your order in real time
                  </p>
                </div>

                <!-- WHAT'S NEXT -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:8px;">
                  <tr>
                    <td style="padding:16px;">
                      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400e;">What happens next?</p>
                      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                        1. Your order is being prepared by our team<br>
                        2. You will receive a shipping notification when dispatched<br>
                        3. You will receive a delivery confirmation when it arrives
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background:#f9fafb;padding:20px 24px;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">Questions? Email us at</p>
                <a href="mailto:iyosifoods@gmail.com" style="color:#15803d;font-size:13px;font-weight:600;">iyosifoods@gmail.com</a>
                <p style="margin:12px 0 0;font-size:11px;color:#d1d5db;">&copy; 2025 Iyosi Foods LTD. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    `;

  await transporter.sendMail({
    from: `"Iyosi Foods LTD" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `&#10004;&#65039; Order Confirmed: #${order.orderNumber} — Iyosi Foods LTD`,
    text: `Hi ${safeName}, your order ${order.orderNumber} has been confirmed and payment received. Total: ${formattedTotal}. Shipping to: ${order.shippingAddr}. We will update you when your order is on its way.`,
    html,
  });
}

export async function sendDeliveryConfirmationEmail({
  email,
  name,
  orderNumber,
}: {
  email: string;
  name: string;
  orderNumber: string;
}) {
  const safeName = escapeHtml(name || "Valued Customer");
  const safeOrderNumber = escapeHtml(orderNumber);

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;background:#f9fafb;padding:24px 0;margin:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center">
          <table width="600" style="max-width:600px;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#166534,#15803d);padding:32px 24px;text-align:center;">
                <h1 style="color:white;margin:0;font-size:24px;">&#127881; Your Order Has Arrived!</h1>
                <p style="color:#bbf7d0;margin:8px 0 0;font-size:14px;">Order successfully delivered</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 24px;">
                <p style="color:#374151;font-size:15px;">Hello <strong>${safeName}</strong>,</p>
                <p style="color:#6b7280;font-size:14px;line-height:1.6;">
                  Great news! Your order <strong style="color:#166534;">#${safeOrderNumber}</strong> has been successfully delivered. 
                  We hope you love your Iyosi Foods products!
                </p>
                <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:10px;padding:20px;margin:20px 0;text-align:center;">
                  <p style="margin:0;font-size:32px;">&#127806;</p>
                  <p style="margin:8px 0 0;font-size:16px;font-weight:700;color:#166534;">Delivered Successfully</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#15803d;">Order #${safeOrderNumber}</p>
                </div>
                <p style="color:#374151;font-size:14px;line-height:1.6;">
                  Enjoyed your purchase? We would love to hear from you! 
                  Leave a review from your dashboard to help other customers.
                </p>
                <div style="text-align:center;margin:24px 0;">
                  <a href="${process.env.NEXTAUTH_URL || "https://iyosifoods.com"}/dashboard/orders"
                    style="display:inline-block;background:#166534;color:white;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:14px;">
                    View Order History
                  </a>
                </div>
                <p style="color:#9ca3af;font-size:12px;text-align:center;">
                  Need help? <a href="mailto:iyosifoods@gmail.com" style="color:#15803d;">iyosifoods@gmail.com</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f9fafb;padding:16px 24px;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="margin:0;font-size:11px;color:#d1d5db;">&copy; 2025 Iyosi Foods LTD. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Iyosi Foods LTD" <${process.env.EMAIL_FROM || "iyosifoods@gmail.com"}>`,
    to: email,
    subject: `&#127881; Delivered: Your Iyosi Foods Order #${orderNumber}`,
    text: `Hello ${safeName}, your order #${safeOrderNumber} has been successfully delivered. We hope you love your Iyosi Foods products! View your order history at ${process.env.NEXTAUTH_URL || "https://iyosifoods.com"}/dashboard/orders`,
    html,
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
        from: `"Iyosi Foods LTD" <${process.env.EMAIL_FROM || "iyosifoods@gmail.com"}>`,
        to,
        subject: "We received your message - Iyosi Foods LTD",
        text: `Thank you for contacting Iyosi Foods LTD!\n\nWe have received your message and will get back to you within 24 business hours.\n\nYour submitted message:\n${data.message || ""}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #333;">Thank You for Contacting Us!</h2>
            <p style="color: #555;">We have received your message and will get back to you within 24 business hours.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="color: #666; font-size: 14px;"><strong>Subject:</strong> ${escapeHtml(data.subject || "")}</p>
              <p style="color: #666; font-size: 14px;"><strong>Message:</strong></p>
              <p style="color: #333;">${escapeHtml(data.message || "").replace(/\n/g, "<br />")}</p>
            </div>
            <p style="color: #888; font-size: 12px;">If you have any urgent inquiries, please call us at +234 800 Iyosi Foods.</p>
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
