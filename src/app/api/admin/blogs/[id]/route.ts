import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const blog = await prisma.blogPost.update({
      where: { id },
      data: {
        ...body,
        publishedAt: body.published ? new Date() : null,
      },
    });
    return NextResponse.json({ blog });
  } catch (error) {
    console.error(
      "[ERROR] Update blog failed:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ message: "Failed to update blog" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ message: "Blog deleted" });
  } catch (error) {
    console.error(
      "[ERROR] Delete blog failed:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json({ message: "Failed to delete blog" }, { status: 500 });
  }
}