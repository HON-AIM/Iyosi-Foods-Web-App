/**
 * Database Modernization Guide - Comprehensive Implementation
 * 
 * This guide covers:
 * 1. Migrating Float to Decimal for monetary values (precision)
 * 2. Fixing VAT calculation (7.5%)
 * 3. Implementing proper orderNumber generation (nanoid/cuid)
 * 4. Removing fake product data (reviews, discounts)
 * 5. Implementing real category filtering
 * 6. Query optimization with Promise.all
 * 7. Backward compatibility strategy
 */

# Part 1: Prisma Schema Updates

## What's Changing

### 1. Monetary Values: Float → Decimal

**Problem with Float:**
- Precision issues: 0.1 + 0.2 = 0.30000000000000004 in JavaScript
- Unsuitable for financial calculations
- Can accumulate rounding errors

**Solution: Use Decimal**
```prisma
price        Decimal   @db.Decimal(10, 2)  // ₦999,999.99 max
totalAmount  Decimal   @db.Decimal(10, 2)
subtotal     Decimal   @db.Decimal(10, 2)
taxAmount    Decimal   @db.Decimal(10, 2)
```

**Why (10, 2)?**
- 10 total digits
- 2 decimal places
- Supports up to ₦99,999,999.99

### 2. OrderNumber Generation

**Current (Bad):**
```typescript
orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`
// Result: ORD-1714521234567-ABC12DE (unpredictable, collision risk)
```

**Updated (Good):**
```typescript
import { customAlphabet } from 'nanoid';
const orderNumberId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 12);
orderNumber: `ORD-${orderNumberId()}`
// Result: ORD-K7X9M2Q5Z1N8 (consistent format, collision-proof)
```

### 3. Remove Fake Data

**Removing from Components:**
- ❌ Remove `const discount = ...` calculations
- ❌ Remove `const reviewCount = 20 + (hash % 180)`
- ✅ Query real review count from database
- ✅ Query real discounts from DB (if applicable)

## Migration Strategy

### Phase 1: Schema Update
1. Add new Decimal columns with temporary names
2. Migrate existing Float data to Decimal
3. Rename columns (drop old, rename new)

### Phase 2: Code Update
1. Update API routes to handle Decimal
2. Update calculations with proper rounding
3. Update frontend components to query real data

### Phase 3: Cleanup
1. Remove fake data generation
2. Add seed data if needed
3. Verify data integrity

---

# Part 2: Tax Calculation (7.5% VAT)

## Current Implementation Issues

If existing code has tax calculation, it likely:
- Hardcodes wrong percentage
- Rounds incorrectly
- Doesn't handle edge cases

## Proper VAT Calculation

```typescript
function calculateVAT(amount: Decimal): Decimal {
  const VAT_RATE = new Decimal('0.075'); // 7.5%
  
  // Properly round to 2 decimal places
  return amount.times(VAT_RATE).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

function calculateOrderTotals(
  subtotal: Decimal
): { tax: Decimal; total: Decimal } {
  const tax = calculateVAT(subtotal);
  const total = subtotal.plus(tax);
  
  return {
    tax: tax.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    total: total.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
  };
}

// Usage
const subtotal = new Decimal('1000');
const { tax, total } = calculateOrderTotals(subtotal);
// tax: 75.00
// total: 1075.00
```

---

# Part 3: Query Optimization with Promise.all

## Current (Sequential - Slow)
```typescript
const orders = await prisma.order.findMany({...});
const total = await prisma.order.count({...});
const stats = await prisma.order.aggregate({...});
// 3 separate DB roundtrips
```

## Optimized (Parallel - Fast)
```typescript
const [orders, total, stats] = await Promise.all([
  prisma.order.findMany({...}),
  prisma.order.count({...}),
  prisma.order.aggregate({...}),
]);
// 1 DB roundtrip (combined)
```

**Performance Impact:**
- Single query: 3 roundtrips × 100ms = 300ms
- Parallel: 1 roundtrip = 100ms
- **Result: 3x faster**

---

# Part 4: Real Category Filtering

## Current Implementation
```typescript
where: {
  ...(category && { category })
}
```

This works but needs validation.

## Enhanced Implementation
```typescript
// Define valid categories
const VALID_CATEGORIES = ['BAKING', 'WHEAT', 'ALL_PURPOSE', 'SEMOLINA'] as const;
type Category = typeof VALID_CATEGORIES[number];

// Validate input
if (category && !VALID_CATEGORIES.includes(category as Category)) {
  return NextResponse.json(
    { message: 'Invalid category' },
    { status: 400 }
  );
}

// Use in query
const where = {
  ...(category && { category: category as Category }),
  isActive: true,
};
```

---

# Part 5: Removing Fake Data from Components

## ProductCard.tsx Changes

**Before:**
```typescript
const originalPrice = product.price * 1.3;
const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);
const reviewCount = 20 + (hash % 180); // FAKE!

return (
  <div>
    {discount > 0 && <badge>{-discount}%</badge>}
    <rating>({reviewCount})</rating>
  </div>
);
```

**After:**
```typescript
// Fetch real reviews from API
const { reviews } = await fetch(`/api/products/${product.id}/reviews`).then(r => r.json());
const reviewCount = reviews.length; // REAL COUNT

// Only show discount if there's actual discounted price in DB
const discount = product.originalPrice 
  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
  : 0;

return (
  <div>
    {discount > 0 && <badge>{-discount}%</badge>}
    <rating>({reviewCount})</rating>
  </div>
);
```

---

# Part 6: Backward Compatibility

## Data Migration Without Downtime

```sql
-- Step 1: Create new Decimal columns
ALTER TABLE "Product" ADD COLUMN "price_new" NUMERIC(10, 2);
ALTER TABLE "Order" ADD COLUMN "totalAmount_new" NUMERIC(10, 2);
ALTER TABLE "Order" ADD COLUMN "subtotal_new" NUMERIC(10, 2);
ALTER TABLE "Order" ADD COLUMN "taxAmount_new" NUMERIC(10, 2);
ALTER TABLE "OrderItem" ADD COLUMN "price_new" NUMERIC(10, 2);
ALTER TABLE "OrderItem" ADD COLUMN "subtotal_new" NUMERIC(10, 2);

-- Step 2: Copy and convert data
UPDATE "Product" SET "price_new" = CAST("price" AS NUMERIC(10, 2));
UPDATE "Order" SET "totalAmount_new" = CAST("totalAmount" AS NUMERIC(10, 2));
UPDATE "Order" SET "subtotal_new" = CAST("subtotal" AS NUMERIC(10, 2));
UPDATE "Order" SET "taxAmount_new" = CAST("taxAmount" AS NUMERIC(10, 2));
UPDATE "OrderItem" SET "price_new" = CAST("price" AS NUMERIC(10, 2));
UPDATE "OrderItem" SET "subtotal_new" = CAST("subtotal" AS NUMERIC(10, 2));

-- Step 3: Drop old columns, rename new ones
ALTER TABLE "Product" DROP COLUMN "price";
ALTER TABLE "Order" DROP COLUMN "totalAmount";
ALTER TABLE "Order" DROP COLUMN "subtotal";
ALTER TABLE "Order" DROP COLUMN "taxAmount";
ALTER TABLE "OrderItem" DROP COLUMN "price";
ALTER TABLE "OrderItem" DROP COLUMN "subtotal";

ALTER TABLE "Product" RENAME COLUMN "price_new" TO "price";
ALTER TABLE "Order" RENAME COLUMN "totalAmount_new" TO "totalAmount";
ALTER TABLE "Order" RENAME COLUMN "subtotal_new" TO "subtotal";
ALTER TABLE "Order" RENAME COLUMN "taxAmount_new" TO "taxAmount";
ALTER TABLE "OrderItem" RENAME COLUMN "price_new" TO "price";
ALTER TABLE "OrderItem" RENAME COLUMN "subtotal_new" TO "subtotal";
```

## Application Code Compatibility

```typescript
// Prisma automatically converts Decimal to string in JS
// You need to wrap in Decimal type for calculations

import { Decimal } from '@prisma/client/runtime/library';

const price = new Decimal(product.price); // string → Decimal
const tax = price.times('0.075');
const total = price.plus(tax);

return {
  price: price.toString(),  // Decimal → string (for JSON)
  tax: tax.toString(),
  total: total.toString(),
};
```

---

# Part 7: Implementation Checklist

## Step 1: Install Dependencies
- [ ] `npm install decimal.js` (or use @prisma/client Decimal)

## Step 2: Update Prisma Schema
- [ ] Change Float → Decimal in Product, Order, OrderItem
- [ ] Add migration file

## Step 3: Create and Run Migration
- [ ] Create migration: `npx prisma migrate dev --name convert_float_to_decimal`
- [ ] Verify data integrity

## Step 4: Update API Routes
- [ ] Update tax calculation function
- [ ] Update order creation (use cuid/nanoid for orderNumber)
- [ ] Update queries to use Promise.all
- [ ] Handle Decimal type conversions

## Step 5: Update Components
- [ ] Remove fake review count generation
- [ ] Remove fake discount calculations
- [ ] Fetch real review counts from API
- [ ] Query real categories for filtering

## Step 6: Testing
- [ ] Unit tests for VAT calculation
- [ ] Integration tests for order creation
- [ ] Verify data accuracy in database
- [ ] Check query performance improvements

## Step 7: Deployment
- [ ] Backup production database
- [ ] Run migration in staging
- [ ] Verify data integrity in staging
- [ ] Deploy to production
- [ ] Monitor for issues

---

# Part 8: Rollback Plan

If issues occur:

```sql
-- Restore Float columns (keep Decimal backup)
ALTER TABLE "Product" ADD COLUMN "price_backup" NUMERIC(10, 2);
UPDATE "Product" SET "price_backup" = price;

-- Convert back to Float if needed
ALTER TABLE "Product" ADD COLUMN "price_old" DOUBLE PRECISION;
UPDATE "Product" SET "price_old" = CAST(price AS DOUBLE PRECISION);
```

---

# Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Monetary Type** | Float (imprecise) | Decimal (precise) |
| **Order ID Format** | Random, variable | Consistent, collision-proof |
| **Review Count** | Fake (20-200) | Real (from DB) |
| **Discounts** | Fake calculations | Real from DB/schema |
| **Query Speed** | Sequential (slow) | Parallel (fast) |
| **VAT Calculation** | Unknown/hardcoded | Proper 7.5% with rounding |
| **Category Filter** | Unvalidated | Validated, type-safe |

**Result:** Production-ready, accurate financial system with real data.
