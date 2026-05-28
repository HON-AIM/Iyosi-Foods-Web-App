import { NextResponse } from "next/server";
import { prisma, TransactionClient } from "@/lib/db";
import { auth } from "@/lib/auth";
import { type NextRequest } from "next/server";

/**
 * GET /api/admin/reviews/[id]
 * Fetch a specific review with details
 *
 * @requires Admin role
 * @param id - Review ID
 * @returns { review } - Review details with product and user info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // ✅ Correct status code: 401 for missing session, 403 for insufficient permissions
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized: Please login" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // ✅ Validate ID parameter
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        { message: "Bad Request: Invalid review ID" },
        { status: 400 }
      );
    }

    // ✅ Fetch review with related data
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { id: true, name: true } },
      },
    });

    if (!review) {
      return NextResponse.json(
        { message: "Not Found: Review does not exist" },
        { status: 404 }
      );
    }

    // ✅ Log admin access for audit trail
    console.info("[AUDIT] Admin viewed review:", {
      adminId: session.user.id,
      adminEmail: session.user.email,
      reviewId: id,
      productId: review.productId,
      userId: review.userId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ review }, { status: 200 });
  } catch (error) {
    console.error("[ERROR] Fetch review failed:", {
      reviewId: (await params).id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to fetch review. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/reviews/[id]
 * Delete a review (soft or hard delete based on history)
 *
 * @requires Admin role
 * @param id - Review ID
 * @body reason - Reason for deletion (optional)
 * @returns { message, reviewId, softDeleted } - Deletion confirmation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // ✅ Correct status code: 401 for missing session, 403 for insufficient permissions
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized: Please login" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // ✅ Validate ID parameter
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        { message: "Bad Request: Invalid review ID" },
        { status: 400 }
      );
    }

    // ✅ Parse request body for deletion reason
    const body = await request.json().catch(() => ({}));
    const reason = (body?.reason || "").trim() || "No reason provided";

    // ✅ Verify review exists
    const review = await prisma.review.findUnique({
      where: { id },
      select: {
        id: true,
        rating: true,
        comment: true,
        userId: true,
        productId: true,
        user: { select: { name: true, email: true } },
        product: { select: { name: true } },
      },
    });

    if (!review) {
      return NextResponse.json(
        { message: "Not Found: Review does not exist" },
        { status: 404 }
      );
    }

    // ✅ Use transaction for atomic deletion
    let result;
    try {
      result = await prisma.$transaction(
        async (tx: TransactionClient) => {
          // Delete the review
          const deletedReview = await tx.review.delete({
            where: { id },
            include: {
              user: { select: { name: true, email: true } },
              product: { select: { name: true } },
            },
          });

          return deletedReview;
        },
        { timeout: 10000 }
      );
    } catch (txError) {
      if (
        txError instanceof Error &&
        txError.message.includes("Record to delete does not exist")
      ) {
        return NextResponse.json(
          { message: "Not Found: Review does not exist" },
          { status: 404 }
        );
      }

      throw txError;
    }

    // ✅ Log admin action for audit trail
    console.info("[AUDIT] Admin deleted review:", {
      adminId: session.user?.id,
      adminEmail: session.user?.email,
      reviewId: id,
      productId: review.productId,
      productName: review.product.name,
      userId: review.userId,
      userName: review.user.name,
      reason,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message: `Review deleted successfully. (Reason: ${reason})`,
        reviewId: result.id,
        deletedReview: {
          rating: result.rating,
          comment: result.comment,
          user: result.user.name,
          product: result.product.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Delete review failed:", {
      reviewId: (await params).id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to delete review. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/reviews/[id]
 * Update review moderation status (hide/show)
 *
 * @requires Admin role
 * @param id - Review ID
 * @body isHidden - Hide or show review (true/false)
 * @body reason - Reason for moderation
 * @returns { message, review } - Updated review
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json(
    { message: "Review moderation is not supported in the current schema" },
    { status: 501 }
  );
}
