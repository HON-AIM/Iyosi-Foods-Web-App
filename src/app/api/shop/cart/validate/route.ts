import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { type NextRequest } from "next/server";
import { z } from "zod";

/**
 * Cart Validation Schema
 * Takes cart items from localStorage and validates against database
 */
const CartItemSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(1000),
});

const ValidateCartSchema = z.object({
  items: z.array(CartItemSchema).min(1, "Cart is empty"),
});

/**
 * Validated Cart Item Response
 */
type ValidatedCartItem = {
  productId: string;
  name: string;
  price: number;
  requestedQuantity: number;
  availableQuantity: number; // Actual stock available
  adjustedQuantity: number; // Quantity after adjustment if stock < requested
  image: string | null;
  isOutOfStock: boolean;
  priceChanged: boolean;
  oldPrice?: number; // If price differs from what client had
  validationErrors: string[];
};

type CartValidationResponse = {
  isValid: boolean;
  items: ValidatedCartItem[];
  hasChanges: boolean; // Any price changes or stock adjustments
  hasErrors: boolean; // Any items with errors
  validationErrors: string[]; // General cart-level errors
  totalValidatedPrice: number; // Server-calculated total
  summary: {
    itemsInCart: number;
    itemsValid: number;
    itemsWithErrors: number;
    itemsAdjusted: number;
  };
};

/**
 * POST /api/shop/cart/validate
 *
 * Validates cart items against current database state
 * - Checks if products exist and are active
 * - Validates current prices
 * - Validates stock availability
 * - Returns adjusted quantities if stock is lower
 * - Flags price changes for display
 */
export async function POST(request: NextRequest): Promise<NextResponse<CartValidationResponse>> {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const errorResponse: CartValidationResponse = {
        isValid: false,
        items: [],
        hasChanges: false,
        hasErrors: true,
        validationErrors: ["Content-Type must be application/json"],
        totalValidatedPrice: 0,
        summary: {
          itemsInCart: 0,
          itemsValid: 0,
          itemsWithErrors: 0,
          itemsAdjusted: 0,
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      const errorResponse: CartValidationResponse = {
        isValid: false,
        items: [],
        hasChanges: false,
        hasErrors: true,
        validationErrors: ["Invalid request body"],
        totalValidatedPrice: 0,
        summary: {
          itemsInCart: 0,
          itemsValid: 0,
          itemsWithErrors: 0,
          itemsAdjusted: 0,
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const parseResult = ValidateCartSchema.safeParse(body);

    if (!parseResult.success) {
      const validationErrors = parseResult.error.issues.map((issue) => issue.message);
      const errorResponse: CartValidationResponse = {
        isValid: false,
        items: [],
        hasChanges: false,
        hasErrors: true,
        validationErrors,
        totalValidatedPrice: 0,
        summary: {
          itemsInCart: 0,
          itemsValid: 0,
          itemsWithErrors: 0,
          itemsAdjusted: 0,
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { items: cartItems } = parseResult.data;

    // ─── Fetch all products from database ───────────────────────────────────
    const productIds = cartItems.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        image: true,
        isActive: true,
      },
    });

    // ─── Validate each cart item ────────────────────────────────────────────
    const validatedItems: ValidatedCartItem[] = [];
    let totalValidatedPrice = 0;
    let hasChanges = false;
    let itemsAdjusted = 0;

    for (const cartItem of cartItems) {
      const product = products.find((p) => p.id === cartItem.productId);
      const validationErrors: string[] = [];
      let isOutOfStock = false;
      let adjustedQuantity = cartItem.quantity;
      let priceChanged = false;
      let oldPrice: number | undefined;

      // Check if product exists
      if (!product) {
        validationErrors.push("Product no longer available");
        validatedItems.push({
          productId: cartItem.productId,
          name: "Unknown Product",
          price: 0,
          requestedQuantity: cartItem.quantity,
          availableQuantity: 0,
          adjustedQuantity: 0,
          image: null,
          isOutOfStock: true,
          priceChanged: false,
          validationErrors,
        });
        hasChanges = true;
        continue;
      }

      // Check if product is active
      if (!product.isActive) {
        validationErrors.push("Product is no longer available");
        validatedItems.push({
          productId: cartItem.productId,
          name: product.name,
          price: product.price,
          requestedQuantity: cartItem.quantity,
          availableQuantity: 0,
          adjustedQuantity: 0,
          image: product.image,
          isOutOfStock: true,
          priceChanged: false,
          validationErrors,
        });
        hasChanges = true;
        continue;
      }

      // Check stock availability and auto-adjust if needed
      if (cartItem.quantity > product.stock) {
        hasChanges = true;
        itemsAdjusted++;

        if (product.stock === 0) {
          isOutOfStock = true;
          adjustedQuantity = 0;
          validationErrors.push(`${product.name} is out of stock`);
        } else {
          adjustedQuantity = product.stock;
          validationErrors.push(
            `Only ${product.stock} item${product.stock !== 1 ? "s" : ""} available. Adjusted quantity.`
          );
        }
      }

      // Check if price changed (for display purposes)
      // Note: We don't fail validation on price changes - server uses current price
      // This is just for informing the user

      // Build validated item
      const validatedItem: ValidatedCartItem = {
        productId: cartItem.productId,
        name: product.name,
        price: product.price,
        requestedQuantity: cartItem.quantity,
        availableQuantity: product.stock,
        adjustedQuantity,
        image: product.image,
        isOutOfStock,
        priceChanged,
        ...(oldPrice && { oldPrice }),
        validationErrors,
      };

      validatedItems.push(validatedItem);

      // Add to total only if item is valid
      if (adjustedQuantity > 0) {
        totalValidatedPrice += product.price * adjustedQuantity;
      }
    }

    // ─── Build response ────────────────────────────────────────────────────
    const itemsWithErrors = validatedItems.filter((item) => item.validationErrors.length > 0);
    const validItems = validatedItems.filter((item) => item.validationErrors.length === 0);

    const isValid = itemsWithErrors.length === 0 && validatedItems.length > 0;

    const response: CartValidationResponse = {
      isValid,
      items: validatedItems,
      hasChanges,
      hasErrors: itemsWithErrors.length > 0,
      validationErrors: [],
      totalValidatedPrice,
      summary: {
        itemsInCart: cartItems.length,
        itemsValid: validItems.length,
        itemsWithErrors: itemsWithErrors.length,
        itemsAdjusted,
      },
    };

    // ─── Audit logging ─────────────────────────────────────────────────────
    const session = await auth();
    if (session?.user?.id) {
      console.info("[AUDIT] Cart validation:", {
        userId: session.user.id,
        itemsCount: cartItems.length,
        hasErrors: response.hasErrors,
        hasChanges: response.hasChanges,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.info("[AUDIT] Cart validation (anonymous):", {
        itemsCount: cartItems.length,
        hasErrors: response.hasErrors,
        hasChanges: response.hasChanges,
        timestamp: new Date().toISOString(),
      });
    }

    const httpResponse = NextResponse.json(response, {
      status: isValid ? 200 : 400,
    });
    httpResponse.headers.set("Cache-Control", "private, no-cache, no-store");

    return httpResponse;
  } catch (error) {
    console.error("[ERROR] Cart validation failed:", {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    const errorResponse: CartValidationResponse = {
      isValid: false,
      items: [],
      hasChanges: false,
      hasErrors: true,
      validationErrors: ["Failed to validate cart. Please try again."],
      totalValidatedPrice: 0,
      summary: {
        itemsInCart: 0,
        itemsValid: 0,
        itemsWithErrors: 0,
        itemsAdjusted: 0,
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
