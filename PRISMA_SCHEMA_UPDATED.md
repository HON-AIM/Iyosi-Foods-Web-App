/**
 * Updated Prisma Schema - Production Ready
 * Key Changes:
 * 1. Float → Decimal for all monetary values
 * 2. Enhanced validation with @db.Decimal(10, 2)
 * 3. Better ordering/sorting fields
 * 4. Ready for real review counts and categories
 * 
 * APPLY THIS BY:
 * 1. Copy the Product, Order, OrderItem models below
 * 2. Replace existing models in schema.prisma
 * 3. Run: npx prisma migrate dev --name update_decimal_types
 */

// ============================================================================
// PRODUCT MODEL - Updated with Decimal pricing
// ============================================================================

model Product {
  id           String      @id @default(cuid())
  name         String      @db.VarChar(200)
  description  String      @db.Text
  price        Decimal     @db.Decimal(10, 2)  // Changed: Float → Decimal
  stock        Int         @default(0)
  image        String?     @db.Text
  category     Category    @default(BAKING)
  isActive     Boolean     @default(true)
  deactivatedAt DateTime?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  
  // Relations
  orderItems   OrderItem[]
  reviews      Review[]
  savedBy      SavedItem[]
  productAuditLogs ProductAuditLog[]
  
  @@index([category])
  @@index([isActive])
  @@index([createdAt])
}

enum Category {
  BAKING
  WHEAT
  ALL_PURPOSE
  SEMOLINA
}

// ============================================================================
// ORDER MODEL - Updated with Decimal and better orderNumber
// ============================================================================

model Order {
  id           String      @id @default(cuid())
  orderNumber  String      @unique  // ORD-XXXXXXXXXXXXX (12 char nanoid)
  userId       String
  status       OrderStatus @default(PENDING)
  
  // Financial fields - Changed: Float → Decimal
  subtotal     Decimal?    @db.Decimal(10, 2)  // Sum of all items
  taxAmount    Decimal?    @db.Decimal(10, 2)  // 7.5% VAT
  totalAmount  Decimal     @db.Decimal(10, 2)  // subtotal + tax
  
  // Shipping/Delivery
  shippingAddr String
  shippingAddressData String? @db.Text
  
  // Additional fields
  notes        String?
  couponCode   String?
  paymentRef   String?     @unique
  
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  
  // Relations
  user         User        @relation(fields: [userId], references: [id])
  items        OrderItem[]
  logs         OrderLog[]
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@index([orderNumber])
}

enum OrderStatus {
  PENDING
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

// ============================================================================
// ORDER ITEM MODEL - Updated with Decimal
// ============================================================================

model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  productId String
  quantity  Int      @default(1)
  
  // Financial fields - Changed: Float → Decimal
  price     Decimal  @db.Decimal(10, 2)  // Price at time of order
  subtotal  Decimal? @db.Decimal(10, 2)  // price × quantity
  
  createdAt DateTime @default(now())
  
  // Relations
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@index([orderId])
  @@index([productId])
}

// ============================================================================
// REVIEW MODEL - Ready for real review counting
// ============================================================================

model Review {
  id        String   @id @default(cuid())
  userId    String
  productId String
  rating    Int      @db.SmallInt  // 1-5
  comment   String?  @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@unique([userId, productId])  // One review per user per product
  @@index([productId])
  @@index([userId])
  @@index([rating])
  @@index([createdAt])
}

// ============================================================================
// HELPER FUNCTIONS FOR CALCULATION
// ============================================================================

/**
 * Use these utility functions in your API routes
 * 
 * Example usage:
 * const { tax, total } = calculateOrderTotals(subtotal);
 */

export const TAX_RATE = '0.075'; // 7.5% VAT

export function calculateOrderTotals(subtotal: Decimal) {
  const { Decimal } = require('@prisma/client/runtime/library');
  
  const tax = subtotal.times(TAX_RATE).toDecimalPlaces(2);
  const total = subtotal.plus(tax).toDecimalPlaces(2);
  
  return { tax, total };
}

export function generateOrderNumber(): string {
  const { customAlphabet } = require('nanoid');
  const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);
  return `ORD-${nanoid()}`;
}

// ============================================================================
// MIGRATION SQL (if using raw SQL)
// ============================================================================

/**
 * PostgreSQL Migration Script
 * Run this if Prisma migration fails or you need more control
 * 
 * WARNING: Back up database before running!
 */

/*
-- Step 1: Create new Decimal columns
ALTER TABLE "Product" ADD COLUMN "price_new" NUMERIC(10, 2);
ALTER TABLE "Order" ADD COLUMN "subtotal_new" NUMERIC(10, 2);
ALTER TABLE "Order" ADD COLUMN "taxAmount_new" NUMERIC(10, 2);
ALTER TABLE "Order" ADD COLUMN "totalAmount_new" NUMERIC(10, 2);
ALTER TABLE "OrderItem" ADD COLUMN "price_new" NUMERIC(10, 2);
ALTER TABLE "OrderItem" ADD COLUMN "subtotal_new" NUMERIC(10, 2);

-- Step 2: Migrate data (with rounding to 2 decimal places)
UPDATE "Product" 
SET "price_new" = ROUND(CAST("price" AS NUMERIC), 2)
WHERE "price_new" IS NULL;

UPDATE "Order"
SET 
  "subtotal_new" = ROUND(CAST("subtotal" AS NUMERIC), 2),
  "taxAmount_new" = ROUND(CAST("taxAmount" AS NUMERIC), 2),
  "totalAmount_new" = ROUND(CAST("totalAmount" AS NUMERIC), 2)
WHERE "totalAmount_new" IS NULL;

UPDATE "OrderItem"
SET 
  "price_new" = ROUND(CAST("price" AS NUMERIC), 2),
  "subtotal_new" = ROUND(CAST("subtotal" AS NUMERIC), 2)
WHERE "price_new" IS NULL;

-- Step 3: Drop old columns
ALTER TABLE "Product" DROP COLUMN "price";
ALTER TABLE "Order" DROP COLUMN "subtotal", DROP COLUMN "taxAmount", DROP COLUMN "totalAmount";
ALTER TABLE "OrderItem" DROP COLUMN "price", DROP COLUMN "subtotal";

-- Step 4: Rename new columns
ALTER TABLE "Product" RENAME COLUMN "price_new" TO "price";
ALTER TABLE "Order" RENAME COLUMN "subtotal_new" TO "subtotal";
ALTER TABLE "Order" RENAME COLUMN "taxAmount_new" TO "taxAmount";
ALTER TABLE "Order" RENAME COLUMN "totalAmount_new" TO "totalAmount";
ALTER TABLE "OrderItem" RENAME COLUMN "price_new" TO "price";
ALTER TABLE "OrderItem" RENAME COLUMN "subtotal_new" TO "subtotal";

-- Verify
SELECT COUNT(*), SUM(price) FROM "Product";
SELECT COUNT(*), SUM("totalAmount") FROM "Order";
*/
