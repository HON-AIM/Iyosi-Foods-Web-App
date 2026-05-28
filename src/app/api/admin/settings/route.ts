import { NextResponse } from "next/server";
import { prisma, TransactionClient } from "@/lib/db";
import { auth } from "@/lib/auth";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { checkAdminRateLimit, rateLimitResponse } from "@/lib/admin-rate-limiter";

// ✅ Define store settings schema for validation
const StoreSettingsSchema = z.object({
  announcementText: z
    .string()
    .max(500, "Announcement must be 500 characters or less")
    .trim()
    .optional(),
  storeName: z
    .string()
    .min(2, "Store name must be at least 2 characters")
    .max(100, "Store name must be 100 characters or less")
    .trim()
    .optional(),
  storeDescription: z
    .string()
    .max(1000, "Store description must be 1000 characters or less")
    .trim()
    .optional(),
  storeEmail: z
    .string()
    .email("Invalid store email")
    .optional(),
  storePhone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(20, "Phone must be 20 digits or less")
    .optional(),
  storeAddress: z
    .string()
    .max(500, "Address must be 500 characters or less")
    .trim()
    .optional(),
  maintenanceMode: z
    .boolean()
    .optional(),
  maintenanceMessage: z
    .string()
    .max(500, "Maintenance message must be 500 characters or less")
    .trim()
    .optional(),
  deliveryFee: z
    .number()
    .nonnegative("Delivery fee cannot be negative")
    .optional(),
  minimumOrderAmount: z
    .number()
    .positive("Minimum order must be greater than 0")
    .optional(),
  taxPercentage: z
    .number()
    .min(0, "Tax percentage cannot be negative")
    .max(100, "Tax percentage cannot exceed 100")
    .optional(),
  flashSaleEndTime: z
    .string()
    .datetime({ message: "Invalid date format" })
    .optional()
    .nullable(),
});

type StoreSettings = z.infer<typeof StoreSettingsSchema>;

/**
 * GET /api/admin/settings
 * Fetch store settings (public endpoint)
 *
 * @returns { settings } - Store configuration
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

    // ✅ Fetch settings from database
    const settings = await prisma.storeSettings.findFirst({
      where: { id: "global" },
    });

    // ✅ Return empty object if no settings exist yet
    if (!settings) {
      return NextResponse.json(
        {
          id: "global",
          announcementText: "",
          storeName: "Iyosi Foods",
          storeDescription: "",
          storeEmail: "",
          storePhone: "",
          storeAddress: "",
          maintenanceMode: false,
          maintenanceMessage: "",
          deliveryFee: 0,
          minimumOrderAmount: 0,
          taxPercentage: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { status: 200 }
      );
    }

    // ✅ Log public access
    console.info("[LOG] Store settings accessed:", {
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error("[ERROR] Fetch settings failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to fetch settings. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings
 * Update store settings
 *
 * @requires Admin role
 * @body announcementText - Store announcement
 * @body storeName - Store name
 * @body storeDescription - Store description
 * @body storeEmail - Store email
 * @body storePhone - Store phone
 * @body storeAddress - Store address
 * @body maintenanceMode - Enable/disable maintenance mode
 * @body maintenanceMessage - Maintenance mode message
 * @body deliveryFee - Delivery fee amount
 * @body minimumOrderAmount - Minimum order amount
 * @body taxPercentage - Tax percentage
 * @returns { message, settings, changes } - Updated settings
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

    // ✅ Parse request body safely
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Bad Request: Invalid request body" },
        { status: 400 }
      );
    }

    // ✅ Validate request body using Zod schema
    const parseResult = StoreSettingsSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return NextResponse.json(
        { message: "Validation failed", errors },
        { status: 400 }
      );
    }

    // ✅ Get current settings to track changes
    const currentSettings = await prisma.storeSettings.findFirst({
      where: { id: "global" },
    });

    // ✅ Track changes for audit log
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, newValue] of Object.entries(parseResult.data)) {
      if (newValue !== undefined) {
        const oldValue = currentSettings?.[key as keyof typeof currentSettings];
        if (oldValue !== newValue) {
          changes[key] = { old: oldValue, new: newValue };
        }
      }
    }

    // ✅ Update settings in transaction
    let updatedSettings;
    try {
      updatedSettings = await prisma.$transaction(
        async (tx: TransactionClient) => {
          // ✅ Upsert settings
          const updated = await tx.storeSettings.upsert({
            where: { id: "global" },
            update: parseResult.data,
            create: { id: "global", ...parseResult.data },
          });

          return updated;
        },
        { timeout: 10000 }
      );
    } catch (txError) {
      console.error("[ERROR] Transaction failed during settings update:", {
        error: txError instanceof Error ? txError.message : String(txError),
      });

      return NextResponse.json(
        {
          message:
            "Failed to update settings. Please try again. If the problem persists, contact support.",
        },
        { status: 409 }
      );
    }

    // ✅ Log admin action for audit trail
    console.info("[AUDIT] Admin updated store settings:", {
      adminId: session.user?.id,
      adminEmail: session.user?.email,
      changesCount: Object.keys(changes).length,
      changedFields: Object.keys(changes),
      maintenanceModeChanged: "maintenanceMode" in changes,
      timestamp: new Date().toISOString(),
    });

    // ✅ If maintenance mode was toggled, log specifically
    if ("maintenanceMode" in changes) {
      const isMaintenanceEnabled = parseResult.data.maintenanceMode;
      console.warn(`[ALERT] Maintenance mode ${isMaintenanceEnabled ? "ENABLED" : "DISABLED"}`, {
        adminId: session.user?.id,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        message: "Settings updated successfully",
        settings: updatedSettings,
        changes: Object.keys(changes),
        changesCount: Object.keys(changes).length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Update settings failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to update settings. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/settings
 * Reset settings to defaults
 *
 * @requires Admin role
 * @returns { message, settings } - Reset settings
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const { reset } = body;

    if (reset !== true) {
      return NextResponse.json(
        { message: "Bad Request: Use reset: true to reset settings" },
        { status: 400 }
      );
    }

    // ✅ Get current settings before reset
    const currentSettings = await prisma.storeSettings.findFirst({
      where: { id: "global" },
    });

    // ✅ Reset in transaction
    const resetSettings = await prisma.$transaction(
      async (tx: TransactionClient) => {
        const updated = await tx.storeSettings.update({
          where: { id: "global" },
          data: {
            announcementText: "",
          },
        });

        return updated;
      },
      { timeout: 10000 }
    );

    console.warn("[AUDIT] Admin reset store settings:", {
      adminId: session.user?.id,
      adminEmail: session.user?.email,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message: "Settings reset to defaults successfully",
        settings: resetSettings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Reset settings failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to reset settings. Please try again.",
      },
      { status: 500 }
    );
  }
}
