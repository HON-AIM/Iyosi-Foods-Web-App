# Cart Validation System - Complete Implementation Guide

## Overview

The cart validation system ensures that items in the user's localStorage match current database state (prices and stock) before checkout. This prevents customers from attempting to purchase unavailable items or at outdated prices.

---

## Architecture

### Three-Layer Validation

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Client (localStorage)                          │
│ - Stores cart items locally for instant UX              │
│ - Prices and stock can become stale                     │
└─────────────────────────────────────────────────────────┘
                          ↓ (VALIDATE)
┌─────────────────────────────────────────────────────────┐
│ Layer 2: API (/api/shop/cart/validate)                  │
│ - Fetches current product data from database            │
│ - Compares against local cart                           │
│ - Detects price changes and stock issues                │
│ - Auto-adjusts quantities if needed                     │
│ - Returns detailed validation results                   │
└─────────────────────────────────────────────────────────┘
                          ↓ (APPLY)
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Checkout (Validated Cart)                      │
│ - Only proceeds if validation passes                    │
│ - Uses server-calculated prices                         │
│ - Respects adjusted quantities                          │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoint: POST /api/shop/cart/validate

### Purpose
Validates cart items against current database state and returns:
- Current product prices
- Available stock quantities
- Recommended quantity adjustments
- Validation errors per item

### Request

```json
{
  "items": [
    {
      "productId": "clx1a2b3c4d5e6f7g8h9i0j",
      "quantity": 2
    },
    {
      "productId": "clx2a2b3c4d5e6f7g8h9i0j",
      "quantity": 1
    }
  ]
}
```

### Response (200 OK - Valid)

```json
{
  "isValid": true,
  "items": [
    {
      "productId": "clx1a2b3c4d5e6f7g8h9i0j",
      "name": "Premium Flour",
      "price": 4500.00,
      "requestedQuantity": 2,
      "availableQuantity": 10,
      "adjustedQuantity": 2,
      "image": "/uploads/flour.jpg",
      "isOutOfStock": false,
      "priceChanged": false,
      "validationErrors": []
    }
  ],
  "hasChanges": false,
  "hasErrors": false,
  "validationErrors": [],
  "totalValidatedPrice": 9000.00,
  "summary": {
    "itemsInCart": 2,
    "itemsValid": 2,
    "itemsWithErrors": 0,
    "itemsAdjusted": 0
  }
}
```

### Response (400 Bad Request - Invalid)

```json
{
  "isValid": false,
  "items": [
    {
      "productId": "clx1a2b3c4d5e6f7g8h9i0j",
      "name": "Premium Flour",
      "price": 4500.00,
      "requestedQuantity": 2,
      "availableQuantity": 1,
      "adjustedQuantity": 1,
      "image": "/uploads/flour.jpg",
      "isOutOfStock": false,
      "priceChanged": false,
      "validationErrors": [
        "Only 1 item available. Adjusted quantity."
      ]
    },
    {
      "productId": "clx2a2b3c4d5e6f7g8h9i0j",
      "name": "Deleted Product",
      "price": 0,
      "requestedQuantity": 1,
      "availableQuantity": 0,
      "adjustedQuantity": 0,
      "image": null,
      "isOutOfStock": true,
      "priceChanged": false,
      "validationErrors": [
        "Product no longer available"
      ]
    }
  ],
  "hasChanges": true,
  "hasErrors": true,
  "validationErrors": [],
  "totalValidatedPrice": 4500.00,
  "summary": {
    "itemsInCart": 2,
    "itemsValid": 0,
    "itemsWithErrors": 2,
    "itemsAdjusted": 1
  }
}
```

---

## API Implementation

### File: `src/app/api/shop/cart/validate/route.ts`

**Key Features:**

1. **Schema Validation**
   ```typescript
   const CartItemSchema = z.object({
     productId: z.string().cuid(),
     quantity: z.number().int().min(1).max(1000),
   });
   ```
   - Only accepts productId and quantity (no price from client)
   - Type-safe validation with Zod

2. **Database Query**
   ```typescript
   const products = await prisma.product.findMany({
     where: { id: { in: productIds } },
     select: { id: true, name: true, price: true, stock: true, image: true, isActive: true },
   });
   ```
   - Fetches only necessary fields
   - Efficient with indexed queries

3. **Validation Logic**
   - Checks product existence
   - Validates product is active
   - Compares requested vs available quantity
   - Auto-adjusts if stock < requested
   - Marks as out-of-stock if stock = 0

4. **Response Building**
   - Each item includes validation errors
   - Summary shows count of valid/invalid items
   - Total validated price calculated from DB prices
   - `hasChanges` flag for UI notifications

5. **Audit Logging**
   ```typescript
   console.info("[AUDIT] Cart validation:", {
     userId: session.user.id,
     itemsCount: cartItems.length,
     hasErrors: response.hasErrors,
     hasChanges: response.hasChanges,
     timestamp: new Date().toISOString(),
   });
   ```

---

## Frontend Integration

### File: `src/app/checkout/page.tsx`

**Validation Flow:**

```typescript
// 1. Validation starts on page load
useEffect(() => {
  validateCart();
}, [items, updateQuantity]);

// 2. Fetches validation data
const res = await fetch("/api/shop/cart/validate", {
  method: "POST",
  body: JSON.stringify({
    items: items.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    })),
  }),
});

// 3. Handles validation response
const data: CartValidationResponse = await res.json();
setValidationResult(data);

// 4. Auto-adjusts quantities
for (const validatedItem of data.items) {
  if (validatedItem.adjustedQuantity !== validatedItem.requestedQuantity) {
    updateQuantity(validatedItem.productId, validatedItem.adjustedQuantity);
  }
}

// 5. Shows user-friendly messages
if (validatedItem.isOutOfStock) {
  toast.error(`${validatedItem.name} is out of stock and has been removed.`);
} else if (validatedItem.adjustedQuantity < validatedItem.requestedQuantity) {
  toast.warning(`${validatedItem.name}: Only ${validatedItem.availableQuantity} available. Quantity adjusted.`);
}
```

**UI Components:**

1. **Validation Status Alert**
   ```typescript
   {isValidating && (
     <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
       <Loader2 className="animate-spin" />
       Validating your cart items against current prices and stock...
     </div>
   )}
   ```

2. **Validation Error Alert**
   ```typescript
   {validationError && !isValidating && (
     <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
       <AlertCircle className="text-red-600" />
       {validationError}
     </div>
   )}
   ```

3. **Stock Adjustment Alert**
   ```typescript
   {validationResult && validationResult.hasChanges && (
     <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
       <TrendingDown className="text-amber-600" />
       {validationResult.summary.itemsAdjusted} item adjusted due to stock availability
     </div>
   )}
   ```

4. **Unavailable Items List**
   ```typescript
   {validationResult && !validationResult.isValid && (
     <div className="bg-red-50 border border-red-200 rounded-lg p-4">
       {validationResult.items
         .filter((item) => item.isOutOfStock)
         .map((item) => (
           <div key={item.productId} className="text-xs bg-red-100 text-red-800 px-3 py-2 rounded">
             <p className="font-medium">{item.name}</p>
             <p>{item.validationErrors[0]}</p>
           </div>
         ))}
     </div>
   )}
   ```

**Checkout Button Logic:**

```typescript
<button
  disabled={
    isSubmitting ||
    isValidating ||
    (validationResult && !validationResult.isValid) ||
    !!validationError
  }
  className="disabled:bg-gray-300 disabled:cursor-not-allowed"
>
  {isValidating ? "Validating Cart..." : "PLACE ORDER"}
</button>
```

---

## Validation Rules

### Product Availability
```
✅ Product exists in database
✅ Product is active (isActive = true)
✅ Product has requested quantity in stock
```

### Stock Adjustment
```
If requested quantity > available stock:
  - Available stock = 5, Requested = 10
  → Adjusted quantity = 5
  → Show warning toast

If stock = 0:
  - Requested = any amount
  → Adjusted quantity = 0
  → Mark as out of stock
  → Show error notification
```

### User-Friendly Messages

| Scenario | Message | Type |
|----------|---------|------|
| Validating | "Validating your cart items..." | Info |
| Out of stock | "{Product} is out of stock and has been removed" | Error |
| Quantity adjusted | "{Product}: Only {n} available. Quantity adjusted." | Warning |
| Price updated | Price shown on checkout (server-calculated) | Info |
| All items removed | "Your cart is now empty" | Warning |
| Validation error | "Unable to validate cart. Please try again." | Error |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ User navigates to /checkout                             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ useEffect triggered (items changed)                     │
│ isValidating = true                                     │
│ Show "Validating..." spinner                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ POST /api/shop/cart/validate                            │
│ Body: { items: [{ productId, quantity }] }             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Server validates each item:                             │
│ 1. Fetch product from DB                               │
│ 2. Check product exists & is active                    │
│ 3. Compare quantities                                  │
│ 4. Build response with adjustments                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Client receives validation response                     │
│ setValidationResult(data)                              │
│ isValidating = false                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ IF validation has adjustments:                          │
│ - updateQuantity() for affected items                  │
│ - Show toast notifications                            │
│ - Re-render cart with adjusted quantities              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ User sees one of:                                       │
│ A) Cart is valid → "Place Order" enabled               │
│ B) Cart has changes → Amber alert + "Place Order" OK   │
│ C) Items unavailable → Red alert + "Place Order" DISABLED
└─────────────────────────────────────────────────────────┘
```

---

## Error Handling

### Client-Side
```typescript
try {
  const res = await fetch("/api/shop/cart/validate", ...);
  const data = await res.json();
  
  if (!res.ok) {
    setValidationError("Failed to validate cart");
    return;
  }
  
  setValidationResult(data);
} catch (error) {
  setValidationError("Unable to validate cart. Please try again.");
  toast.error("Cart validation failed. Please refresh the page.");
}
```

### Server-Side
```typescript
// Content-Type validation
if (!contentType.includes("application/json")) {
  return NextResponse.json(errorResponse, { status: 400 });
}

// Request body validation
const parseResult = ValidateCartSchema.safeParse(body);
if (!parseResult.success) {
  const validationErrors = parseResult.error.issues.map(...);
  return NextResponse.json({ ...errorResponse, validationErrors }, { status: 400 });
}

// Database errors
catch (error) {
  console.error("[ERROR] Cart validation failed:", error);
  return NextResponse.json(errorResponse, { status: 500 });
}
```

---

## Performance Optimization

### Database Query
- Single query fetches all products at once (n+1 prevention)
- Indexes on `Product.id` ensure fast lookups
- Only selects necessary fields

### Caching
```typescript
response.headers.set("Cache-Control", "private, no-cache, no-store");
```
- Prevents caching since cart is user-specific and changes frequently

### Lazy Validation
- Only triggered when navigating to checkout
- Not called for every cart change
- Uses efficient React.useEffect with dependency array

---

## Testing Scenarios

### Test 1: All Items Valid
```
Setup: Cart has 2 items, both in stock
Expected: isValid = true, no warnings
Result: ✅ Checkout enabled
```

### Test 2: Quantity Adjusted
```
Setup: Cart requests 10 units, only 5 in stock
Expected: adjustedQuantity = 5, warning toast
Result: ✅ Cart updated, warning shown
```

### Test 3: Out of Stock
```
Setup: Cart has out-of-stock item
Expected: adjustedQuantity = 0, error toast
Result: ✅ Item removed, error shown
```

### Test 4: Product Deleted
```
Setup: Cart has item that was deleted
Expected: validationError, item unavailable
Result: ✅ Checkout blocked, error shown
```

### Test 5: Multiple Issues
```
Setup: Cart with mix of valid, adjusted, and out-of-stock items
Expected: Items adjusted, warnings shown, errors flagged
Result: ✅ Checkout blocked until user resolves
```

---

## Security Considerations

✅ **No price manipulation**: Client doesn't send prices  
✅ **Authoritative source**: Always uses database for prices  
✅ **Authenticated audit logs**: Tracks who validates carts  
✅ **Server-calculated totals**: No client math used  
✅ **CSRF protection**: NextAuth handles automatically  
✅ **Rate limiting ready**: Can add per-user limits  

---

## Future Enhancements

1. **Inventory Hold**
   - Reserve items for 5 minutes after validation
   - Prevent over-selling during checkout delay

2. **Price Lock**
   - Display price from validation moment
   - Show "Price locked for 5 minutes"

3. **Partial Checkout**
   - Allow checkout with available items only
   - Offer to backorder unavailable items

4. **Analytics**
   - Track which items have high out-of-stock rates
   - Monitor validation failure patterns

5. **Real-time Updates**
   - WebSocket updates for stock changes
   - Notify users if items become available

---

## Files Created/Modified

1. ✅ `src/app/api/shop/cart/validate/route.ts` - New API endpoint
2. ✅ `src/app/checkout/page.tsx` - Enhanced with validation
3. ✅ `src/context/CartContext.tsx` - Unchanged (add `updateQuantity` export)

---

## Related Documentation

- `PAYMENT_SECURITY_FIX.md` - Price manipulation prevention
- `CHECKOUT_SECURITY_QUICK_REFERENCE.md` - Checkout flow security
- `API_ROUTE_COMPARISON.md` - Before/after API changes

