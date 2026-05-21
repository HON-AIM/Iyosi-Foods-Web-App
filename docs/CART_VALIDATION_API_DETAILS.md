# Cart Validation API - Detailed Implementation

## API Endpoint: POST /api/shop/cart/validate

### Location
`src/app/api/shop/cart/validate/route.ts`

### Purpose
Validates shopping cart items against current database state and returns:
- Current prices for each product
- Available stock quantities
- Recommended quantity adjustments
- Detailed validation errors

---

## Request Format

### Content-Type
```
application/json
```

### Body Schema
```typescript
{
  items: [
    {
      productId: string;      // CUID format (e.g., "clx1a2b3c...")
      quantity: number;       // Integer, 1-1000
    }
  ]
}
```

### Example Request
```json
{
  "items": [
    {
      "productId": "clx1a2b3c4d5e6f7g8h9i0j",
      "quantity": 2
    },
    {
      "productId": "clx2b3c4d5e6f7g8h9i0j1k",
      "quantity": 5
    }
  ]
}
```

---

## Response Format

### Content-Type
```
application/json
```

### Body Schema (TypeScript)
```typescript
type CartValidationResponse = {
  isValid: boolean;                // true if no errors
  items: ValidatedCartItem[];      // Details per item
  hasChanges: boolean;             // Any adjustments made
  hasErrors: boolean;              // Any items with errors
  validationErrors: string[];      // Cart-level errors
  totalValidatedPrice: number;     // Sum of valid items
  summary: {
    itemsInCart: number;           // Total items requested
    itemsValid: number;            // Items with no errors
    itemsWithErrors: number;       // Items with errors
    itemsAdjusted: number;         // Items with qty adjusted
  };
};

type ValidatedCartItem = {
  productId: string;               // Original product ID
  name: string;                    // Current product name
  price: number;                   // Current DB price
  requestedQuantity: number;       // What user had in cart
  availableQuantity: number;       // What's in stock
  adjustedQuantity: number;        // What we recommend
  image: string | null;            // Product image URL
  isOutOfStock: boolean;           // Complete out-of-stock flag
  priceChanged: boolean;           // Price changed since cart add
  oldPrice?: number;               // Previous price (if changed)
  validationErrors: string[];      // Item-level errors
};
```

### Example Response (Valid - 200 OK)
```json
{
  "isValid": true,
  "items": [
    {
      "productId": "clx1a2b3c4d5e6f7g8h9i0j",
      "name": "Premium Flour - 25kg",
      "price": 4500.00,
      "requestedQuantity": 2,
      "availableQuantity": 10,
      "adjustedQuantity": 2,
      "image": "/uploads/products/flour-25kg.jpg",
      "isOutOfStock": false,
      "priceChanged": false,
      "validationErrors": []
    },
    {
      "productId": "clx2b3c4d5e6f7g8h9i0j1k",
      "name": "Rice - 10kg",
      "price": 3200.00,
      "requestedQuantity": 5,
      "availableQuantity": 5,
      "adjustedQuantity": 5,
      "image": "/uploads/products/rice-10kg.jpg",
      "isOutOfStock": false,
      "priceChanged": false,
      "validationErrors": []
    }
  ],
  "hasChanges": false,
  "hasErrors": false,
  "validationErrors": [],
  "totalValidatedPrice": 25000.00,
  "summary": {
    "itemsInCart": 2,
    "itemsValid": 2,
    "itemsWithErrors": 0,
    "itemsAdjusted": 0
  }
}
```

### Example Response (Invalid - 400 Bad Request)
```json
{
  "isValid": false,
  "items": [
    {
      "productId": "clx1a2b3c4d5e6f7g8h9i0j",
      "name": "Premium Flour - 25kg",
      "price": 4500.00,
      "requestedQuantity": 10,
      "availableQuantity": 3,
      "adjustedQuantity": 3,
      "image": "/uploads/products/flour-25kg.jpg",
      "isOutOfStock": false,
      "priceChanged": false,
      "validationErrors": [
        "Only 3 items available. Adjusted quantity."
      ]
    },
    {
      "productId": "clx2b3c4d5e6f7g8h9i0j1k",
      "name": "Cornflour - 1kg",
      "price": 0,
      "requestedQuantity": 2,
      "availableQuantity": 0,
      "adjustedQuantity": 0,
      "image": null,
      "isOutOfStock": true,
      "priceChanged": false,
      "validationErrors": [
        "Product no longer available"
      ]
    },
    {
      "productId": "clx3c4d5e6f7g8h9i0j1k2l",
      "name": "Unknown Product",
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
  "totalValidatedPrice": 13500.00,
  "summary": {
    "itemsInCart": 3,
    "itemsValid": 0,
    "itemsWithErrors": 3,
    "itemsAdjusted": 1
  }
}
```

---

## HTTP Status Codes

### 200 OK
```
Valid cart (isValid: true)
OR
Cart with changes that can be auto-adjusted (isValid: false with adjustments)
```

### 400 Bad Request
```
Reasons:
- Content-Type is not application/json
- Request body is invalid
- Empty items array
- Schema validation failed
```

### 500 Internal Server Error
```
Database query failed
or
Unexpected server error
```

---

## Implementation Details

### 1. Zod Schema Validation

```typescript
const CartItemSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(1000),
});

const ValidateCartSchema = z.object({
  items: z.array(CartItemSchema).min(1, "Cart is empty"),
});

const parseResult = ValidateCartSchema.safeParse(body);

if (!parseResult.success) {
  const validationErrors = parseResult.error.issues.map((issue) => issue.message);
  return NextResponse.json({
    isValid: false,
    items: [],
    validationErrors,
    // ...
  }, { status: 400 });
}
```

**Why this validation:**
- Prevents SQL injection via productId
- Ensures quantities are positive integers
- Rejects malformed requests early
- Returns helpful error messages

### 2. Database Query

```typescript
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
```

**Optimizations:**
- Single query for all products (no n+1)
- Indexed lookup on `Product.id`
- Only selects necessary fields
- Uses Prisma for type safety

### 3. Item Validation Loop

```typescript
for (const cartItem of cartItems) {
  const product = products.find((p) => p.id === cartItem.productId);
  const validationErrors: string[] = [];
  let adjustedQuantity = cartItem.quantity;

  // Check product existence
  if (!product) {
    validationErrors.push("Product no longer available");
    // Add to response with adjustedQuantity = 0
    continue;
  }

  // Check product active status
  if (!product.isActive) {
    validationErrors.push("Product is no longer available");
    // Add to response with adjustedQuantity = 0
    continue;
  }

  // Check stock availability
  if (cartItem.quantity > product.stock) {
    if (product.stock === 0) {
      adjustedQuantity = 0;
      validationErrors.push(`${product.name} is out of stock`);
    } else {
      adjustedQuantity = product.stock;
      validationErrors.push(
        `Only ${product.stock} item${product.stock !== 1 ? "s" : ""} available. Adjusted quantity.`
      );
    }
  }

  // Add to validated items
  validatedItems.push({
    productId: cartItem.productId,
    name: product.name,
    price: product.price,
    requestedQuantity: cartItem.quantity,
    availableQuantity: product.stock,
    adjustedQuantity,
    image: product.image,
    isOutOfStock: adjustedQuantity === 0,
    priceChanged: false,
    validationErrors,
  });
}
```

**Logic:**
1. Find product in fetched data
2. If not found → error
3. If inactive → error
4. If quantity exceeds stock → adjust and warn
5. Include all info in response

### 4. Price Calculation

```typescript
for (const validatedItem of validatedItems) {
  // Add to total only if item is valid
  if (validatedItem.adjustedQuantity > 0) {
    totalValidatedPrice += validatedItem.price * validatedItem.adjustedQuantity;
  }
}
```

**Important:**
- Uses database price, not client price
- Only includes items with adjustedQuantity > 0
- Prevents "out of stock" items from increasing total

### 5. Response Building

```typescript
const itemsWithErrors = validatedItems.filter(
  (item) => item.validationErrors.length > 0
);
const validItems = validatedItems.filter(
  (item) => item.validationErrors.length === 0
);

const isValid = itemsWithErrors.length === 0 && validatedItems.length > 0;
const itemsAdjusted = validatedItems.filter(
  (item) => item.adjustedQuantity < item.requestedQuantity
).length;

const response: CartValidationResponse = {
  isValid,
  items: validatedItems,
  hasChanges: isValid === false || itemsAdjusted > 0,
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
```

**Logic:**
- `isValid`: All items valid with no errors
- `hasChanges`: Any adjustments or errors
- `hasErrors`: At least one item with error
- Summary counts for analytics

### 6. Audit Logging

```typescript
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
```

**Logged:**
- User ID (if authenticated)
- Number of items
- Whether there were errors
- Whether there were changes
- Timestamp

---

## Error Handling

### Invalid Content-Type
```typescript
if (!contentType.includes("application/json")) {
  return NextResponse.json(errorResponse, { status: 400 });
}
```

### Invalid JSON
```typescript
const body = await request.json().catch(() => null);
if (!body || typeof body !== "object") {
  return NextResponse.json(errorResponse, { status: 400 });
}
```

### Schema Validation Failure
```typescript
const parseResult = ValidateCartSchema.safeParse(body);
if (!parseResult.success) {
  const validationErrors = parseResult.error.issues.map((e) => e.message);
  return NextResponse.json(
    { ...errorResponse, validationErrors },
    { status: 400 }
  );
}
```

### Unexpected Server Error
```typescript
catch (error) {
  console.error("[ERROR] Cart validation failed:", {
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      isValid: false,
      items: [],
      validationErrors: ["Failed to validate cart. Please try again."],
      // ...
    },
    { status: 500 }
  );
}
```

---

## Cache Control

```typescript
const httpResponse = NextResponse.json(response, {
  status: isValid ? 200 : 400,
});
httpResponse.headers.set("Cache-Control", "private, no-cache, no-store");

return httpResponse;
```

**Why no caching:**
- Cart validation is user-specific
- Stock changes constantly
- Price changes affect validity
- Must fetch fresh data every time

---

## Performance Characteristics

### Time Complexity
- **Zod validation**: O(n) where n = number of items
- **Database query**: O(1) (indexed lookup of all IDs at once)
- **Validation loop**: O(n) where n = number of items
- **Total**: O(n)

### Space Complexity
- **Response object**: O(n) where n = number of items

### Database Load
- **1 query**: Select from Product where id in [list]
- **Index used**: Product(id)
- **Data fetched**: Only necessary fields

### Network
- Request size: ~50 bytes per item
- Response size: ~500 bytes per item
- Typical total: 1KB-10KB

---

## Testing Examples

### Test 1: Valid Cart
```bash
curl -X POST http://localhost:3000/api/shop/cart/validate \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": "clx1a2b3c...", "quantity": 2}
    ]
  }'

# Response: 200 OK, isValid: true
```

### Test 2: Out of Stock
```bash
curl -X POST http://localhost:3000/api/shop/cart/validate \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": "clx1a2b3c...", "quantity": 100}
    ]
  }'

# Response: 400 Bad Request, isValid: false, adjustedQuantity: <stock amount>
```

### Test 3: Invalid Schema
```bash
curl -X POST http://localhost:3000/api/shop/cart/validate \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": "invalid", "quantity": -1}
    ]
  }'

# Response: 400 Bad Request, validationErrors: [...]
```

---

## Integration Checklist

- [ ] File created at correct path
- [ ] All imports present
- [ ] Zod schema defined
- [ ] POST handler implemented
- [ ] Database query correct
- [ ] Validation loop logic correct
- [ ] Response structure matches type
- [ ] Error handling comprehensive
- [ ] Audit logging in place
- [ ] Cache headers set
- [ ] Tested with valid data
- [ ] Tested with invalid data
- [ ] Tested with edge cases

