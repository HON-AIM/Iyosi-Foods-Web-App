# Cart Validation - Frontend Integration Quick Reference

## What It Does

```
Before Checkout:
- Fetches cart items from localStorage
- Validates against database (prices, stock)
- Auto-adjusts quantities if needed
- Shows validation status & warnings
- Prevents checkout if items unavailable
```

---

## Implementation Summary

### 1. API Endpoint Created
**Path**: `/api/shop/cart/validate`  
**Method**: `POST`  
**Input**: `{ items: [{ productId, quantity }] }`  
**Output**: Validation results with price/stock info

### 2. Checkout Page Enhanced
**File**: `src/app/checkout/page.tsx`

**Added:**
- ✅ Validation on component load
- ✅ Auto-quantity adjustment
- ✅ Validation status alerts
- ✅ User-friendly error messages
- ✅ Checkout button safeguards

### 3. Cart Context Updated
**File**: `src/context/CartContext.tsx`

**Used:**
- ✅ `updateQuantity()` to adjust items
- ✅ `useCart()` to access cart state

---

## User Experience Flow

### Valid Cart (All Items In Stock)
```
1. User navigates to /checkout
2. Page loads, shows "Validating..." spinner
3. API returns: all items valid, no changes
4. Spinner disappears
5. Checkout form appears with "PLACE ORDER" enabled
```

### Cart with Adjustments (Some Stock Limited)
```
1. User navigates to /checkout
2. Page loads, shows "Validating..." spinner
3. API returns: 1 item has less stock than requested
4. Cart updates: quantity adjusted from 5 to 2
5. Amber warning appears: "1 item adjusted due to stock"
6. Toast shows: "Product: Only 2 available. Adjusted."
7. "PLACE ORDER" button is ENABLED
```

### Cart with Unavailable Items
```
1. User navigates to /checkout
2. Page loads, shows "Validating..." spinner
3. API returns: 1 item out of stock, 1 item deleted
4. Cart updates: both items removed
5. Red error appears: "Items Not Available - 2 items no longer available"
6. Toast shows: "Product 1 is out of stock and removed"
7. "PLACE ORDER" button is DISABLED
8. User must go back to /shop to add new items
```

### Validation Error (API Failure)
```
1. User navigates to /checkout
2. Page loads, shows "Validating..." spinner
3. API fails (server error)
4. Red error appears: "Unable to validate cart. Please try again."
5. "PLACE ORDER" button is DISABLED
6. User can refresh or go back
```

---

## Key Messages Shown to Users

| Situation | Message | Duration | Type |
|-----------|---------|----------|------|
| Validating | "Validating your cart..." | While loading | Info |
| Out of stock | "{Name} is out of stock and removed" | 4 seconds | Error |
| Stock limited | "{Name}: Only {n} available. Adjusted." | 4 seconds | Warning |
| Multiple adjusted | "Updated {n} items based on availability" | 3 seconds | Success |
| API error | "Unable to validate cart..." | Persistent | Error |
| Can't checkout | "Please wait while we validate..." | Until done | Error |

---

## Button States

### Checkout Button

```
NORMAL: bg-primary-600, text-white, cursor-pointer
  - All validation passed
  - User can click to place order

VALIDATING: bg-primary-600, text-white, cursor-not-allowed
  - Spinner animation
  - Text: "Validating Cart..."

INVALID: bg-gray-300, text-white, cursor-not-allowed
  - Items unavailable
  - Text: "PLACE ORDER" (greyed out)

SUBMITTING: bg-primary-600, text-white, cursor-not-allowed
  - Spinner animation
  - Text: "Placing Order..."
```

---

## Code Structure

### Imports (Types & UI)
```typescript
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import toast from "react-hot-toast";
import { Loader2, AlertCircle, TrendingDown } from "lucide-react";
```

### State Variables
```typescript
const [isValidating, setIsValidating] = useState(true);
const [validationResult, setValidationResult] = useState(null);
const [validationError, setValidationError] = useState(null);
```

### Effect Hook
```typescript
useEffect(() => {
  const validateCart = async () => {
    // Fetch /api/shop/cart/validate
    // Update validation state
    // Show toasts for adjustments
  };
  validateCart();
}, [items, updateQuantity]);
```

### Form Submission
```typescript
const handlePlaceOrder = async (e) => {
  // Check: not validating
  // Check: cart not empty
  // Check: validation passed
  // Check: address valid
  // POST /api/user/orders
};
```

---

## Common Issues & Solutions

### Issue: Button stays disabled after validation
**Cause**: `validationResult.isValid` is false  
**Solution**: Check validation errors in console, review items

### Issue: Quantity not updating
**Cause**: `updateQuantity()` called but not re-rendering  
**Solution**: Cart context listens to localStorage, should update automatically

### Issue: Toast messages not showing
**Cause**: Toast library not initialized  
**Solution**: Ensure `react-hot-toast` is installed and provider is in layout

### Issue: Validation takes too long
**Cause**: API query inefficient or network slow  
**Solution**: Check database indexes on Product.id

### Issue: Same validation runs twice
**Cause**: React StrictMode or dependency array issue  
**Solution**: Add `React.memo` to checkout component or adjust dependencies

---

## Testing Checklist

- [ ] Navigate to /checkout with empty cart
- [ ] Navigate to /checkout with valid items
- [ ] Navigate to /checkout with out-of-stock items
- [ ] Check that button is disabled until validation completes
- [ ] Verify quantity adjustments work
- [ ] Check that invalid cart prevents checkout
- [ ] Test validation error (break API)
- [ ] Verify toast messages appear
- [ ] Check accessibility (screen readers)
- [ ] Test on mobile (button still clickable)

---

## API Response Structure

### Success (200)
```json
{
  "isValid": true,
  "items": [
    {
      "productId": "...",
      "name": "Product Name",
      "price": 1000,
      "requestedQuantity": 2,
      "availableQuantity": 2,
      "adjustedQuantity": 2,
      "image": "/...",
      "isOutOfStock": false,
      "priceChanged": false,
      "validationErrors": []
    }
  ],
  "hasChanges": false,
  "hasErrors": false,
  "validationErrors": [],
  "totalValidatedPrice": 2000,
  "summary": {
    "itemsInCart": 1,
    "itemsValid": 1,
    "itemsWithErrors": 0,
    "itemsAdjusted": 0
  }
}
```

### Error (400/500)
```json
{
  "isValid": false,
  "items": [...],
  "hasChanges": true,
  "hasErrors": true,
  "validationErrors": ["error message"],
  "totalValidatedPrice": 0,
  "summary": {
    "itemsInCart": 2,
    "itemsValid": 0,
    "itemsWithErrors": 2,
    "itemsAdjusted": 0
  }
}
```

---

## Performance Tips

1. **Validation only runs on checkout page load** (not on every cart change)
2. **API fetches all products in single query** (no n+1 problems)
3. **No caching** of validation results (must refresh each time)
4. **Toast messages are debounced** (won't spam user)

---

## Security Features

✅ Client never sends prices  
✅ Server validates all quantities  
✅ Database is source of truth  
✅ Audit logs track validation  
✅ API rate-limiting ready  

---

## What's NOT Validated Here

❌ Payment processing (handled by /api/user/orders)  
❌ Shipping address validation (basic client-side only)  
❌ User authentication (checked in order API)  
❌ Duplicate orders (prevented at order creation)  
❌ Fraud detection (could be added later)  

---

## Related Features

- **Order Creation**: `/api/user/orders` (POST) - Creates order with validated cart
- **Payment**: After order created, user redirected to payment
- **Order History**: `/dashboard/orders` (GET) - Shows user's past orders

---

## Quick Debugging

### Check validation response:
```javascript
// In browser console:
fetch('/api/shop/cart/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [
      { productId: 'prod1', quantity: 1 }
    ]
  })
}).then(r => r.json()).then(console.log)
```

### Check cart state:
```javascript
// In browser console:
JSON.parse(localStorage.getItem('iyosiola_cart'))
```

### Check validation result:
```javascript
// Add to checkout page temporarily:
console.log('Validation result:', validationResult)
```

