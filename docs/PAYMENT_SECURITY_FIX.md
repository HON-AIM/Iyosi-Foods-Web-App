# Payment Security Fix: Server-Authoritative Pricing

## Vulnerability Closed

**Severity:** CRITICAL (Financial)

**Issue:** Client could manipulate product prices during checkout by modifying the request payload before sending to the server.

**Impact:** Users could purchase products at arbitrary prices, causing significant revenue loss.

---

## The Attack Scenario (Before Fix)

```javascript
// Attacker's modified request (original implementation)
fetch("/api/user/orders", {
  method: "POST",
  body: JSON.stringify({
    items: [
      {
        id: "product123",
        quantity: 1,
        price: 0.01, // ⚠️ MANIPULATED - Original was $100
      },
    ],
    total: 0.01, // ⚠️ MANIPULATED - Original was $100
    shippingAddress: "...",
  }),
});

// API only checked: Math.abs(dbPrice - clientPrice) > 0.01
// With tolerance of 1%, attacker could set price within $1.00 of actual
// For $100 item, could pay $99-$101 instead... BUT
// Actual implementation had a 1% tolerance on TOTAL, so any manipulation
// within 1% tolerance would succeed!
```

---

## Root Cause

**Original Implementation Problems:**

1. ❌ Client sends price in request
2. ❌ Server trusts client price (with tolerance check)
3. ❌ Client sends total amount
4. ❌ Server only validates within 1% tolerance
5. ❌ No strict server-authoritative pricing

---

## Solution: Server-Authoritative Pricing

### Key Changes

#### 1. **Zod Schema - Remove Client Price**

```typescript
// ❌ BEFORE (VULNERABLE)
const OrderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
  price: z.number().positive(), // Client sends price!
});

const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema),
  shippingAddress: AddressSchema,
  total: z.number().positive(), // Client sends total!
});

// ✅ AFTER (SECURE)
const OrderItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(1000),
  // NOTE: price field removed - not accepted from client
});

const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema),
  shippingAddress: AddressSchema,
  // NOTE: total field removed - calculated server-side
});
```

#### 2. **API Route - Fetch Prices from Database**

```typescript
// ❌ BEFORE: Trusted client price (with weak tolerance)
if (Math.abs(product.price - item.price) > 0.01) {
  throw new Error("PRICE_MISMATCH");
}
calculatedTotal += product.price * item.quantity;

// ✅ AFTER: Use database price exclusively
const orderItems = items.map((item) => {
  const product = products.find((p) => p.id === item.productId);
  const itemPrice = product.price; // Database price ONLY
  const itemSubtotal = itemPrice * item.quantity;
  return { productId: item.productId, quantity: item.quantity, price: itemPrice, subtotal: itemSubtotal };
});

const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
const totalAmount = subtotal + taxAmount; // Server-calculated
```

#### 3. **Client Request - Remove Price Data**

```typescript
// ❌ BEFORE (VULNERABLE)
const res = await fetch("/api/user/orders", {
  method: "POST",
  body: JSON.stringify({
    items: items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price, // Sending client-side price!
    })),
    total: cartTotal, // Sending client-side total!
  }),
});

// ✅ AFTER (SECURE)
const res = await fetch("/api/user/orders", {
  method: "POST",
  body: JSON.stringify({
    items: items.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
      // NOTE: price intentionally omitted
    })),
    shippingAddress: shippingAddress.trim(),
    // NOTE: total intentionally omitted
  }),
});
```

---

## Secure Checkout Flow

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT: User adds item to cart (price displayed from state) │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ CLIENT: User clicks "Checkout"                              │
│ Sends: { productId, quantity } only                         │
│ Does NOT send: price, total                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ SERVER: Zod validates structure (no price field expected)   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ SERVER: Fetch all products from database                    │
│ - Get current price from DB (not from request)              │
│ - Verify all products exist                                 │
│ - Check stock availability                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ SERVER: Calculate totals server-side (authoritative)        │
│ - For each item: itemPrice * quantity = itemSubtotal        │
│ - Sum all itemSubtotals = subtotal                          │
│ - Add tax = totalAmount                                     │
│ - ZERO client-side values used in calculation               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ SERVER: Create order in database transaction                │
│ - Store server-calculated prices & totals                   │
│ - Lock & decrement stock                                    │
│ - Return order with server-calculated amounts               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ CLIENT: Display confirmation with server-returned total     │
│ (not client-calculated total)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Why Tolerance-Based Validation Failed

The original implementation used:

```typescript
// This is fundamentally insecure
const tolerance = calculatedTotal * 0.01; // 1% tolerance
if (Math.abs(total - calculatedTotal) > tolerance) {
  throw new Error("TOTAL_MISMATCH");
}
```

**Problems:**
- For a $100 order, tolerance is $1.00 → Attacker can underpay by $1.00
- For a $1000 order, tolerance is $10.00 → Attacker saves $10.00
- No legitimate reason to allow variations in totals
- Creates cumulative revenue loss across thousands of orders

**New Approach:**
```typescript
// Server calculates exact total - no tolerance needed
const totalAmount = subtotal + taxAmount;
// Store exactly as calculated, no variance
```

---

## Removed Code Patterns

### 1. Price Mismatch with Tolerance
❌ Removed:
```typescript
if (Math.abs(product.price - item.price) > 0.01) {
  throw new Error("PRICE_MISMATCH");
}
```

✅ Replaced with: Simply don't accept price from client

### 2. Total Mismatch with Tolerance
❌ Removed:
```typescript
const tolerance = calculatedTotal * 0.01;
if (Math.abs(total - calculatedTotal) > tolerance) {
  throw new Error("TOTAL_MISMATCH");
}
```

✅ Replaced with: Server calculates exact total

### 3. Client Price in Order Creation
❌ Removed:
```typescript
items: {
  create: items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    price: item.price, // From client - insecure!
  })),
}
```

✅ Replaced with:
```typescript
items: {
  create: orderItems.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    price: item.price, // From database - secure
    subtotal: item.subtotal,
  })),
}
```

---

## Security Guarantees

✅ **No client price manipulation** - Client cannot change product price
✅ **No total manipulation** - Server calculates from DB prices
✅ **Exact pricing** - No tolerance, no rounding abuse
✅ **Atomic transactions** - All-or-nothing order creation
✅ **Stock validation** - Checked before order creation
✅ **Audit logging** - Records actual server-calculated prices

---

## Verification Checklist

### Before Deployment
- [ ] All tests pass with new schema
- [ ] Checkout flow works end-to-end
- [ ] Price display shows database prices
- [ ] Orders table reflects server-calculated prices
- [ ] No tolerance-based logic remains

### Manual Testing

**Test 1: Normal Checkout**
```bash
# Order 2 items at $50 each
# Expected: Subtotal $100, not manipulated amount
```

**Test 2: Attempt Price Manipulation**
```bash
# Use browser DevTools to send price: 0.01
# Expected: Server ignores client price, uses DB price
# Result: Order created with correct DB price
```

**Test 3: Stock Validation**
```bash
# Request quantity > available stock
# Expected: OUT_OF_STOCK error
# Result: Order rejected, stock unchanged
```

**Test 4: Database Consistency**
```bash
# Query order_items table
# Expected: price = product.price (from DB)
# Not expected: price = client-sent price
```

---

## Audit & Monitoring

### Log Example

```
[AUDIT] Order created:
  orderId: clx1a2b3c4d5e6f
  userId: user_123
  itemsCount: 2
  subtotal: 250.00
  total: 250.00  (Server-calculated, not from request)
  timestamp: 2026-04-30T10:30:00Z
```

### Red Flags to Monitor

⚠️ **Investigate if:**
- OrderItem.price ≠ Product.price (historical prices legitimate)
- Order.totalAmount deviates from sum of OrderItem subtotals
- Multiple orders from same user with significant price differences
- Cart context shows high prices but order shows low prices

---

## Attack Surface Reduction

### Before Fix
- 🔴 Product price mutable by client
- 🔴 Order total mutable by client
- 🔴 Weak tolerance-based validation
- 🔴 No server-authoritative pricing

### After Fix
- 🟢 Product price read-only (database)
- 🟢 Order total calculated server-side
- 🟢 Zero tolerance for variations
- 🟢 Complete server authority over pricing

---

## Edge Cases Handled

### Stock Price Changes Between Browse and Checkout

**Before:** Tolerance might miss price changes
**After:** Latest DB price always used

```typescript
// User browses: Item shows $50
// Price changes to $60 in database
// User checks out:
// Order created with $60 (current DB price) ✓
```

### Decimal Precision

**Before:** Tolerance could cause rounding issues
**After:** Exact calculations with JavaScript numbers

```typescript
// itemSubtotal = 99.99 * 3 = 299.97
// No rounding tolerance needed
```

### Concurrent Orders

**Transaction ensures:** Stock decrements atomically with order creation

```typescript
// If stock check passes but another user buys it simultaneously:
// Transaction rolls back, OUT_OF_STOCK thrown
```

---

## Implementation Notes

### Database Queries in Transaction
```typescript
await prisma.$transaction(async (tx) => {
  // All queries use 'tx', ensuring atomicity
  // Price fetched from DB within transaction
  // Stock decremented within same transaction
  // All-or-nothing guarantee
})
```

### Error Handling
```typescript
if (txError instanceof Error) {
  const errorMap: Record<string, [string, number]> = {
    INVALID_PRODUCTS: ["One or more products are no longer available", 400],
    PRODUCT_NOT_FOUND: ["Product not found", 404],
    OUT_OF_STOCK: ["One or more products are out of stock", 400],
    // NOTE: PRICE_MISMATCH and TOTAL_MISMATCH removed
  };
}
```

---

## Migration Checklist for Existing Orders

If you have existing orders with client-supplied prices:

1. **Backup database** before any changes
2. **Verify** OrderItem.price matches historical Product.price
3. **Create migration** if data cleanup needed
4. **Update** any order display logic that relied on price mismatch detection

---

## Future Enhancements

1. **Rate limiting** on checkout endpoint
2. **Fraud detection** via ML (detecting unusual purchase patterns)
3. **Price change logging** (track when prices change)
4. **Inventory hold** (prevent price change race conditions)
5. **Order status validation** (prevent modification after payment)

---

## References

- [OWASP: Insecure Direct Object References](https://owasp.org/www-community/attacks/IDOR)
- [CWE-915: Improperly Controlled Modification of Dynamically-Determined Object Attributes](https://cwe.mitre.org/data/definitions/915.html)
- [PCI DSS: Secure Coding Practices](https://www.pcicomplianceguide.org/)

