import { NextResponse } from "next/server";
import { prisma, TransactionClient } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * DELETE /api/admin/customers/[id]
 * Delete a customer and all associated data
 *
 * @requires Admin role
 * @param id - Customer ID to delete
 * @returns { message: string } - Success or error message
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Authenticate and verify admin role
    const session = await auth();

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

    // ✅ Validate ID parameter
    const { id } = await params;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        { message: "Bad Request: Invalid customer ID" },
        { status: 400 }
      );
    }

    // ✅ Prevent deleting own account
    if (session.user?.id === id) {
      return NextResponse.json(
        { message: "Bad Request: You cannot delete your own admin account" },
        { status: 400 }
      );
    }

    // ✅ Verify customer exists before attempting deletion
    const customerExists = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!customerExists) {
      return NextResponse.json(
        { message: "Not Found: Customer does not exist" },
        { status: 404 }
      );
    }

    // ✅ Prevent accidental deletion of other admins
    if (customerExists.role === "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Cannot delete admin accounts" },
        { status: 403 }
      );
    }

    // ✅ Use transaction for atomic deletion
    // Delete all dependent records in the correct order
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // Delete reviews by this user
      await tx.review.deleteMany({
        where: { userId: id },
      });

      // Delete addresses associated with this user
      await tx.address.deleteMany({
        where: { userId: id },
      });

      // Find all orders for this user
      const userOrders = await tx.order.findMany({
        where: { userId: id },
        select: { id: true },
      });

      const orderIds = userOrders.map((o) => o.id);

      // Delete order items for these orders
      if (orderIds.length > 0) {
        await tx.orderItem.deleteMany({
          where: { orderId: { in: orderIds } },
        });

        // Delete the orders
        await tx.order.deleteMany({
          where: { id: { in: orderIds } },
        });
      }

      // Delete all sessions for this user (logout all devices)
      await tx.session.deleteMany({
        where: { userId: id },
      });

      // Delete auth accounts (NextAuth)
      await tx.account.deleteMany({
        where: { userId: id },
      });

      // Finally, delete the user
      const deletedUser = await tx.user.delete({
        where: { id },
        select: { id: true, name: true, email: true },
      });

      return deletedUser;
    });

    // ✅ Log admin action for audit trail
    console.info(
      `[AUDIT] Admin ${session.user.id} (${session.user.email}) deleted customer: ${result.name} (${result.email})`
    );

    return NextResponse.json(
      {
        message: `Customer "${result.name || result.email}" deleted successfully`,
        customerId: result.id,
      },
      { status: 200 }
    );
  } catch (error) {
    // ✅ Differentiate error types
    if (error instanceof Error) {
      if (error.message.includes("Record to delete does not exist")) {
        console.warn("Customer not found:", error.message);
        return NextResponse.json(
          { message: "Not Found: Customer does not exist" },
          { status: 404 }
        );
      }

      if (error.message.includes("Foreign key constraint failed")) {
        console.error("Foreign key constraint error:", error.message);
        return NextResponse.json(
          {
            message:
              "Conflict: Cannot delete customer due to database constraints",
          },
          { status: 409 }
        );
      }
    }

    console.error("[ERROR] Delete customer failed:", error);
    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to delete customer. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * Optional: Implement soft delete alternative
 * Instead of hard delete, mark user as deleted with timestamp
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        { message: "Bad Request: Invalid customer ID" },
        { status: 400 }
      );
    }

    if (session.user?.id === id) {
      return NextResponse.json(
        { message: "Bad Request: You cannot deactivate your own account" },
        { status: 400 }
      );
    }

    // Soft delete: Mark user as inactive
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
      select: { id: true, name: true, email: true },
    });

    console.info(
      `[AUDIT] Admin ${session.user.id} deactivated customer: ${updatedUser.name} (${updatedUser.email})`
    );

    return NextResponse.json(
      {
        message: `Customer "${updatedUser.name}" has been deactivated`,
        customerId: updatedUser.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Deactivate customer failed:", error);
    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to deactivate customer. Please try again.",
      },
      { status: 500 }
    );
  }
}
