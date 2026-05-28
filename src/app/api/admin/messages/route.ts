import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendAdminDirectMessage } from "@/lib/email";
import { type NextRequest } from "next/server";
import { checkAdminRateLimit, rateLimitResponse } from "@/lib/admin-rate-limiter";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_SUBJECT_LENGTH = 200;
const MAX_CONTENT_LENGTH = 5000;

/**
 * GET /api/admin/messages
 * Fetch paginated list of messages with optional filters
 *
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 20, max: 100)
 * @query search - Search by sender name or email
 * @query status - Filter by status (unread, read, responded, closed)
 * @returns { messages, pagination, stats }
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
    const { success, resetAt } = await checkAdminRateLimit(ip);
    if (!success) {
      const { body, headers } = rateLimitResponse(resetAt);
      return NextResponse.json(body, { status: 429, headers });
    }

    const session = await auth();

    // ✅ Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized: Please login" },
        { status: 401 }
      );
    }

    // ✅ Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // ✅ Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") || DEFAULT_LIMIT.toString(), 10))
    );
    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "").trim();

    const skip = (page - 1) * limit;

    // ✅ Build filter conditions
    const where = {
      ...(search && {
        OR: [
          { user: { name: { contains: search, mode: "insensitive" as const } } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
      ...(status &&
        ["unread", "read", "responded", "closed"].includes(status) && {
          status,
        }),
    };

    // ✅ Fetch messages and total in parallel
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        select: {
          id: true,
          subject: true,
          content: true,
          isRead: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.message.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    // ✅ Get read counts for dashboard stats
    const [unreadCount, readCount] = await Promise.all([
      prisma.message.count({
        where: { ...where, isRead: false },
      }),
      prisma.message.count({
        where: { ...where, isRead: true },
      }),
    ]);

    return NextResponse.json(
      {
        messages,
        pagination: {
          total,
          page,
          limit,
          pages,
        },
        stats: {
          unreadCount,
          readCount,
          totalCount: total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Fetch messages failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to fetch messages. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/messages
 * Send a message to a user (both dashboard and email)
 *
 * @requires Admin role
 * @body targetUserId - User ID to send message to
 * @body subject - Message subject
 * @body content - Message content
 * @returns { message, data }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
    const { success, resetAt } = await checkAdminRateLimit(ip);
    if (!success) {
      const { body, headers } = rateLimitResponse(resetAt);
      return NextResponse.json(body, { status: 429, headers });
    }

    const session = await auth();

    // ✅ Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized: Please login" },
        { status: 401 }
      );
    }

    // ✅ Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Bad Request: Invalid request body" },
        { status: 400 }
      );
    }

    const { targetUserId, subject, content } = body;

    // ✅ Validate required fields
    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json(
        { message: "Bad Request: Invalid targetUserId" },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      return NextResponse.json(
        { message: "Bad Request: Subject is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { message: "Bad Request: Content is required" },
        { status: 400 }
      );
    }

    // ✅ Validate subject length
    if (subject.length > MAX_SUBJECT_LENGTH) {
      return NextResponse.json(
        { message: `Bad Request: Subject must be ${MAX_SUBJECT_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // ✅ Validate content length
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { message: `Bad Request: Content must be ${MAX_CONTENT_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // ✅ Prevent self-messaging
    if (session.user.id === targetUserId) {
      return NextResponse.json(
        { message: "Bad Request: You cannot send messages to yourself" },
        { status: 400 }
      );
    }

    // ✅ Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: "Not Found: Target user does not exist" },
        { status: 404 }
      );
    }

    // ✅ Prevent messaging other admins (optional policy)
    if (targetUser.role === "ADMIN") {
      return NextResponse.json(
        {
          message:
            "Bad Request: Cannot send messages to admin accounts from this interface",
        },
        { status: 400 }
      );
    }

    // ✅ Create message in database
    const message = await prisma.message.create({
      data: {
        userId: targetUserId,
        subject: subject.trim(),
        content: content.trim(),
        isRead: false,
      },
      select: {
        id: true,
        subject: true,
        content: true,
        isRead: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    // ✅ Send email asynchronously (don't block the response)
    let emailSent = false;
    if (targetUser.email) {
      try {
        await sendAdminDirectMessage(
          targetUser.email,
          subject.trim(),
          content.trim()
        );
        emailSent = true;
      } catch (emailError) {
        console.warn("[WARN] Failed to send email:", {
          targetUserId,
          targetEmail: targetUser.email,
          error: emailError instanceof Error ? emailError.message : String(emailError),
        });
        // Don't fail the entire request if email fails
      }
    }

    // ✅ Log admin action for audit trail
    console.info("[AUDIT] Admin sent message to user:", {
      adminId: session.user.id,
      adminEmail: session.user.email,
      targetUserId,
      targetEmail: targetUser.email,
      messageId: message.id,
      emailSent,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message: emailSent
          ? "Message sent successfully via dashboard and email"
          : "Message saved to dashboard (email delivery failed)",
        data: message,
        emailSent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ERROR] Send message failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to send message. Please try again.",
      },
      { status: 500 }
    );
  }
}
