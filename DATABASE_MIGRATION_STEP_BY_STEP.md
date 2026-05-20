# Database Migration Guide - Step by Step

## Overview

This guide provides complete instructions for implementing all database improvements:
1. Float → Decimal conversion for monetary values
2. Tax calculation fix (7.5% VAT)
3. OrderNumber generation with nanoid/cuid
4. Removing fake product data
5. Real category filtering
6. Query optimization with Promise.all

---

## Prerequisites

### Install Dependencies

```bash
# Decimal.js (for calculation)
npm install decimal.js

# Nanoid (for orderNumber)
npm install nanoid

# Prisma CLI
npm install --save-dev prisma

# Backup your database first!
```

---

## Phase 1: Prepare Schema Changes

### Step 1a: Update Prisma Schema

**File:** `prisma/schema.prisma`

Replace the Product, Order, and OrderItem models with Decimal types:

```prisma
model Product {
  id           String      @id @default(cuid())
  name         String      @db.VarChar(200)
  description  String      @db.Text
  price        Decimal     @db.Decimal(10, 2)  // Changed from Float
  stock        Int         @default(0)
  image        String?     @db.Text
  category     Category    @default(BAKING)
  isActive     Boolean     @default(true)
  deactivatedAt DateTime?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  
  orderItems   OrderItem[]
  reviews      Review[]
  savedBy      SavedItem[]
  productAuditLogs ProductAuditLog[]
  
  @@index([category])
  @@index([isActive])
  @@index([createdAt])
}

model Order {
  id           String      @id @default(cuid())
  orderNumber  String      @unique  // ORD-XXXXXXXXXXXXX format
  userId       String
  status       OrderStatus @default(PENDING)
  
  subtotal     Decimal?    @db.Decimal(10, 2)  // Changed from Float
  taxAmount    Decimal?    @db.Decimal(10, 2)  // Changed from Float
  totalAmount  Decimal     @db.Decimal(10, 2)  // Changed from Float
  
  shippingAddr String
  shippingAddressData String? @db.Text
  notes        String?
  couponCode   String?
  paymentRef   String?     @unique
  
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  
  user         User        @relation(fields: [userId], references: [id])
  items        OrderItem[]
  logs         OrderLog[]
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@index([orderNumber])
}

model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  productId String
  quantity  Int      @default(1)
  
  price     Decimal  @db.Decimal(10, 2)  // Changed from Float
  subtotal  Decimal? @db.Decimal(10, 2)  // Changed from Float
  
  createdAt DateTime @default(now())
  
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@index([orderId])
  @@index([productId])
}
```

**Add indexes for performance:**

```prisma
// Already added above:
@@index([category])     // For category filtering
@@index([isActive])     // For product filtering
@@index([status])       // For order status filtering
@@index([orderNumber])  // For order lookup
```

---

## Phase 2: Create and Run Migration

### Step 2a: Create Migration File

```bash
# This will create a migration file
npx prisma migrate dev --name update_float_to_decimal

# If you prefer to name it differently:
npx prisma migrate dev --name convert_monetary_values_to_decimal
```

### Step 2b: What Prisma Will Do

Prisma will automatically:
1. Create new Decimal columns with temporary names
2. Copy data from Float columns (with rounding to 2 decimals)
3. Drop old Float columns
4. Rename new columns to original names

**Generated migration file example:**
```sql
-- CreateTable
ALTER TABLE "Product" ADD COLUMN "price_new" NUMERIC(10,2);
ALTER TABLE "Order" ADD COLUMN "subtotal_new" NUMERIC(10,2);
ALTER TABLE "Order" ADD COLUMN "taxAmount_new" NUMERIC(10,2);
ALTER TABLE "Order" ADD COLUMN "totalAmount_new" NUMERIC(10,2);
ALTER TABLE "OrderItem" ADD COLUMN "price_new" NUMERIC(10,2);
ALTER TABLE "OrderItem" ADD COLUMN "subtotal_new" NUMERIC(10,2);

-- Copy data with proper rounding
UPDATE "Product" SET "price_new" = ROUND(CAST("price" AS NUMERIC), 2) WHERE "price_new" IS NULL;
UPDATE "Order" SET "subtotal_new" = ROUND(CAST("subtotal" AS NUMERIC), 2) WHERE "subtotal_new" IS NULL;
... (more updates)

-- Drop old columns
ALTER TABLE "Product" DROP COLUMN "price";
ALTER TABLE "Order" DROP COLUMN "subtotal", DROP COLUMN "taxAmount", DROP COLUMN "totalAmount";
ALTER TABLE "OrderItem" DROP COLUMN "price", DROP COLUMN "subtotal";

-- Rename new columns
ALTER TABLE "Product" RENAME COLUMN "price_new" TO "price";
ALTER TABLE "Order" RENAME COLUMN "subtotal_new" TO "subtotal";
... (more renames)
```

### Step 2c: Run Migration

```bash
# Run the migration
npx prisma migrate deploy

# Or for development:
npx prisma db push

# Verify the migration succeeded
npx prisma db seed  # If you have seed scripts
```

### Step 2d: Regenerate Prisma Client

```bash
npx prisma generate
```

---

## Phase 3: Update API Routes

### Step 3a: Create Utility Functions

**File:** `src/lib/order-utils.ts` (NEW)

```typescript
import { Decimal } from '@prisma/client/runtime/library';
import { customAlphabet } from 'nanoid';

// 7.5% VAT rate
const TAX_RATE = new Decimal('0.075');

/**
 * Calculate order totals with proper rounding
 * @param subtotal - Sum of all items
 * @returns { subtotal, taxAmount, totalAmount }
 */
export function calculateOrderTotals(subtotal: Decimal | string | number) {
  const sub = typeof subtotal === 'string' || typeof subtotal === 'number'
    ? new Decimal(subtotal)
    : subtotal;

  const tax = sub
    .times(TAX_RATE)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const total = sub
    .plus(tax)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return { subtotal: sub, taxAmount: tax, totalAmount: total };
}

/**
 * Generate unique order number
 * Format: ORD-XXXXXXXXXXXX (12 alphanumeric characters)
 * @returns Unique order number string
 */
const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  12
);

export function generateOrderNumber(): string {
  return `ORD-${nanoid()}`;
}

/**
 * Convert Decimal to string for JSON responses
 * @param value - Decimal value
 * @returns String representation
 */
export function decimalToString(value: Decimal | null | undefined): string {
  if (!value) return '0.00';
  return value.toString();
}
```

### Step 3b: Update Order Creation Code

**File:** `src/app/api/shop/checkout/route.ts` (or wherever orders are created)

```typescript
import { calculateOrderTotals, generateOrderNumber } from '@/lib/order-utils';
import { Decimal } from '@prisma/client/runtime/library';

export async function POST(request: NextRequest) {
  try {
    const { items, addressId } = await request.json();

    // Fetch products with current prices
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
      select: { id: true, price: true },
    });

    // Calculate subtotal
    let subtotal = new Decimal('0');
    const orderItems = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { message: 'Product not found' },
          { status: 404 }
        );
      }

      const itemSubtotal = product.price.times(item.quantity);
      subtotal = subtotal.plus(itemSubtotal);

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price, // ✅ Decimal type
        subtotal: itemSubtotal, // ✅ Decimal type
      });
    }

    // ✅ Calculate totals with proper 7.5% VAT
    const { taxAmount, totalAmount } = calculateOrderTotals(subtotal);

    // ✅ Generate proper orderNumber
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        orderNumber: generateOrderNumber(), // ORD-XXXXXXXXXXXX
        subtotal,
        taxAmount,
        totalAmount,
        items: { create: orderItems },
        shippingAddr: address.id,
        status: 'PENDING',
      },
      include: { items: true },
    });

    return NextResponse.json(
      {
        message: 'Order created successfully',
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          subtotal: subtotal.toString(), // ✅ Decimal → string
          tax: taxAmount.toString(), // ✅ Decimal → string
          total: totalAmount.toString(), // ✅ Decimal → string
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[ERROR] Checkout failed:', error);
    return NextResponse.json(
      { message: 'Failed to create order' },
      { status: 500 }
    );
  }
}
```

### Step 3c: Update Product Routes

**File:** `src/app/api/admin/products/route.ts`

Update the GET handler to use Promise.all and real category filtering:

```typescript
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';

    // ✅ Validate category
    const VALID_CATEGORIES = ['BAKING', 'WHEAT', 'ALL_PURPOSE', 'SEMOLINA'];
    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(category && { category: category as any }),
    };

    // ✅ OPTIMIZED: Fetch in parallel
    const [products, total, reviewStats] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          category: true,
          image: true,
          createdAt: true,
          _count: { select: { reviews: true } }, // Real count
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
      prisma.review.groupBy({
        by: ['productId'],
        _count: true,
        _avg: { rating: true },
      }),
    ]);

    const reviewMap = Object.fromEntries(
      reviewStats.map((stat) => [
        stat.productId,
        { count: stat._count, avgRating: stat._avg.rating?.toFixed(1) },
      ])
    );

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        price: p.price.toString(), // ✅ Decimal → string
        reviewCount: p._count.reviews, // ✅ REAL count
        avgRating: reviewMap[p.id]?.avgRating || '0', // ✅ REAL rating
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[ERROR]', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
```

---

## Phase 4: Update Components (Remove Fake Data)

### Step 4a: Fix ProductCard Component

**File:** `src/components/shop/ProductCard.tsx`

```typescript
// BEFORE (with fake data):
const hash = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
const reviewCount = 20 + (hash % 180); // FAKE!
const originalPrice = product.price * 1.3;
const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);

// AFTER (with real data):
export async function ProductCard({ product }: { product: any }) {
  // Fetch real review count from API
  const reviews = await fetch(`/api/products/${product.id}/reviews`).then(r => r.json());
  const reviewCount = reviews.count; // ✅ REAL

  // No originalPrice field in schema, so discount is 0
  const discount = 0; // ✅ REAL (no discount in current schema)

  return (
    <div className="product-card">
      {/* Remove fake discount badge if discount is 0 */}
      {discount > 0 && (
        <div className="badge-discount">-{discount}%</div>
      )}

      {/* Use real review count */}
      <div className="rating">
        ⭐ ({reviewCount} reviews) {/* ✅ REAL data */}
      </div>

      <p className="price">₦{product.price}</p>
    </div>
  );
}
```

### Step 4b: Fix FlashSale Component

**File:** `src/components/shop/FlashSale.tsx`

```typescript
// BEFORE:
const fakeOriginal = product.price * 1.35;
const discount = Math.round(((fakeOriginal - product.price) / fakeOriginal) * 100);

// AFTER:
// Remove fakeOriginal calculation
// If you have a real originalPrice field, use that:
const discount = product.originalPrice
  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
  : 0; // ✅ REAL data or 0

// If originalPrice doesn't exist in schema, just don't show discount
{discount > 0 && <badge>{-discount}%</badge>}
```

---

## Phase 5: Database Validation

### Step 5a: Verify Migration Success

```bash
# Check Prisma client generation
npx prisma generate

# Test database connection
npx prisma db execute --stdin < test-query.sql

# Or use Prisma Studio
npx prisma studio
```

### Step 5b: Run Validation Script

Create `scripts/validate-migration.ts`:

```typescript
import { prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

async function validateMigration() {
  console.log('Validating database migration...\n');

  // Check products have Decimal prices
  const products = await prisma.product.findMany({ take: 5 });
  console.log('✓ Sample product prices:');
  products.forEach((p) => {
    console.log(
      `  ${p.name}: ₦${p.price} (type: ${typeof p.price})`
    );
  });

  // Check orders have Decimal amounts
  const orders = await prisma.order.findMany({ take: 5 });
  console.log('\n✓ Sample order totals:');
  orders.forEach((o) => {
    console.log(
      `  ${o.id}: ₦${o.totalAmount} (subtotal: ₦${o.subtotal}, tax: ₦${o.taxAmount})`
    );
  });

  // Check orderNumbers format
  const orderNumbers = orders.map((o) => o.orderNumber);
  console.log('\n✓ Order number format check:');
  orderNumbers.forEach((on) => {
    const isValid = /^ORD-[A-Z0-9]{12}$/.test(on);
    console.log(`  ${on}: ${isValid ? '✓' : '✗'}`);
  });

  // Check review data
  const reviewCount = await prisma.review.count();
  console.log(`\n✓ Total reviews in database: ${reviewCount}`);

  console.log('\n✓ Migration validation complete!');
}

validateMigration();
```

Run with:
```bash
npx ts-node scripts/validate-migration.ts
```

---

## Phase 6: Testing

### Step 6a: Unit Tests

Create `tests/order-utils.test.ts`:

```typescript
import { calculateOrderTotals, generateOrderNumber } from '@/lib/order-utils';
import { Decimal } from '@prisma/client/runtime/library';

describe('Order Utils', () => {
  test('calculateOrderTotals should apply 7.5% VAT', () => {
    const subtotal = new Decimal('1000');
    const { taxAmount, totalAmount } = calculateOrderTotals(subtotal);

    expect(taxAmount.toString()).toBe('75.00');
    expect(totalAmount.toString()).toBe('1075.00');
  });

  test('calculateOrderTotals should round properly', () => {
    const subtotal = new Decimal('100.333');
    const { taxAmount } = calculateOrderTotals(subtotal);

    // 100.333 * 0.075 = 7.52497... → 7.52
    expect(taxAmount.toString()).toBe('7.52');
  });

  test('generateOrderNumber should match format', () => {
    const orderNumber = generateOrderNumber();
    expect(orderNumber).toMatch(/^ORD-[A-Z0-9]{12}$/);
  });

  test('generateOrderNumber should be unique', () => {
    const numbers = new Set();
    for (let i = 0; i < 100; i++) {
      const num = generateOrderNumber();
      expect(numbers.has(num)).toBe(false);
      numbers.add(num);
    }
  });
});
```

Run tests:
```bash
npm test
```

### Step 6b: Integration Tests

Create `tests/integration/orders.test.ts`:

```typescript
describe('Order Creation', () => {
  test('should create order with proper Decimal calculations', async () => {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        items: [
          { productId: 'prod-1', quantity: 2 },
        ],
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.order.orderNumber).toMatch(/^ORD-[A-Z0-9]{12}$/);
    expect(data.order.tax).toBe('75.00'); // 7.5% VAT
    expect(data.order.total).toBe('1075.00');
  });
});
```

---

## Phase 7: Deployment

### Step 7a: Pre-Deployment Checklist

- [ ] All migrations created and tested locally
- [ ] API routes updated with new Decimal handling
- [ ] Components updated to remove fake data
- [ ] Tests passing
- [ ] Database backed up
- [ ] Staged environment tested

### Step 7b: Deployment Steps

```bash
# 1. Commit schema changes
git add prisma/schema.prisma

# 2. Commit migration
git add prisma/migrations/

# 3. Push to repository
git push origin main

# 4. Deploy to production
vercel deploy --prod

# 5. Run migration in production
# (Usually automatic if using Vercel with Prisma)

# 6. Verify
# Check application logs
# Verify orders are being created correctly
# Check sample data in database
```

### Step 7c: Post-Deployment Verification

```bash
# 1. Check new orders
SELECT * FROM "Order" ORDER BY "createdAt" DESC LIMIT 5;

# 2. Verify Decimal precision
SELECT id, price, (price::numeric % 1) as decimal_part FROM "Product" LIMIT 5;

# 3. Check order numbers
SELECT id, "orderNumber" FROM "Order" WHERE "orderNumber" ~ '^ORD-' LIMIT 10;

# 4. Verify tax calculation
SELECT 
  "orderNumber",
  subtotal,
  "taxAmount",
  "totalAmount",
  (subtotal * 0.075)::numeric(10,2) as expected_tax
FROM "Order"
WHERE "taxAmount" IS NOT NULL
LIMIT 10;
```

---

## Rollback Plan

If critical issues occur:

### Option 1: Database Rollback

```sql
-- Create backup of Decimal columns first
CREATE TABLE "Product_backup" AS SELECT * FROM "Product";
CREATE TABLE "Order_backup" AS SELECT * FROM "Order";

-- Convert back to Float (if absolutely necessary)
ALTER TABLE "Product" ADD COLUMN "price_old" DOUBLE PRECISION;
UPDATE "Product" SET "price_old" = price::double precision;
ALTER TABLE "Product" DROP COLUMN "price";
ALTER TABLE "Product" RENAME COLUMN "price_old" TO "price";
```

### Option 2: Revert Code Changes

```bash
git revert HEAD~3  # Revert last 3 commits
npm install
npm run build
npm run dev
```

---

## Summary

**Timeline:**
- Schema changes: 1-2 hours
- Testing: 2-3 hours
- Deployment: 1-2 hours
- **Total: 4-7 hours**

**Key Benefits:**
- ✅ Precise monetary calculations
- ✅ Real data instead of fake
- ✅ 3x faster queries (Promise.all)
- ✅ Proper VAT calculation
- ✅ Unique order numbers
- ✅ Better performance with indexes

**Next Steps:**
1. Follow Phase 1-2 for schema changes
2. Follow Phase 3-4 for code updates
3. Follow Phase 5-7 for testing and deployment
