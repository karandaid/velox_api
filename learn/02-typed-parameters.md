# Typed Parameters - Automatic Validation

## The Problem

In traditional frameworks, route parameters are always strings:

```javascript
// Express/Fastify
app.get('/users/:id', (req, res) => {
  const id = req.params.id;  // Always a string!
  
  // Manual validation required
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  
  // Manual conversion required
  const userId = parseInt(id);
  
  // Now you can use it
  const user = findUser(userId);
  res.json({ user });
});
```

**Problems:**
- ❌ Manual validation every time
- ❌ Manual type conversion
- ❌ Easy to forget validation
- ❌ Repetitive boilerplate code

## The VeloxAPI Solution

VeloxAPI validates and converts parameters **automatically** using typed parameters:

```javascript
router.get('/users/:id=number', (res, req, query, params) => {
  // params.id is already a number!
  // Invalid inputs get 404 automatically
  
  const user = findUser(params.id);  // No conversion needed
  res.sendJSON({ user });
});
```

**Benefits:**
- ✅ Automatic validation
- ✅ Automatic type conversion
- ✅ 404 for invalid inputs
- ✅ Zero boilerplate

## How It Works

Add a type after the parameter name with `=`:

```
/:paramName=type
```

### Available Types

| Type | Validates | Example | Matches | Rejects |
|------|-----------|---------|---------|---------|
| `string` | Alphabetic only | `:name=string` | `john` | `john123`, `123` |
| `number` | Integer or decimal | `:id=number` | `123`, `45.6` | `abc`, `12abc` |
| `int` | Integer only | `:count=int` | `100` | `45.6`, `abc` |
| `float` | Decimal number | `:price=float` | `19.99` | `abc` |
| `boolean` | true/false | `:active=boolean` | `true`, `false` | `yes`, `1` |
| `email` | Email address | `:email=email` | `hi@example.com` | `invalid-email` |
| `url` | Valid URL | `:link=url` | `https://site.com` | `not-a-url` |
| `uuid` | UUID v4 | `:id=uuid` | `550e8400-e29b-41d4-a716-446655440000` | `abc-123` |
| `slug` | URL-friendly | `:slug=slug` | `my-blog-post` | `My Blog Post` |
| `alpha` | Letters only | `:code=alpha` | `ABC` | `AB12` |
| `alphanumeric` | Letters + numbers | `:code=alphanumeric` | `AB12` | `AB-12` |
| `hex` | Hexadecimal | `:color=hex` | `ff0000`, `FF0000` | `gg0000` |

## Examples

### 1. Number Validation

```javascript
router.get('/users/:id=number', (res, req, query, params) => {
  // params.id is already a number
  res.sendJSON({ 
    userId: params.id,
    type: typeof params.id  // "number"
  });
});
```

**✅ Valid:** `/users/123` → `params.id = 123` (number)  
**❌ Invalid:** `/users/abc` → 404 Not Found

### 2. Email Validation

```javascript
router.get('/verify/:email=email', (res, req, query, params) => {
  // Email is already validated
  sendVerificationEmail(params.email);
  
  res.sendJSON({ 
    message: `Verification sent to ${params.email}` 
  });
});
```

**✅ Valid:** `/verify/user@example.com`  
**❌ Invalid:** `/verify/invalid-email` → 404

### 3. UUID Validation

```javascript
router.get('/orders/:orderId=uuid', (res, req, query, params) => {
  // orderId is a valid UUID
  const order = findOrder(params.orderId);
  
  res.sendJSON({ order });
});
```

**✅ Valid:** `/orders/550e8400-e29b-41d4-a716-446655440000`  
**❌ Invalid:** `/orders/123` → 404

### 4. Slug Validation

```javascript
router.get('/blog/:slug=slug', (res, req, query, params) => {
  // slug is URL-friendly (lowercase, hyphens only)
  const post = findPostBySlug(params.slug);
  
  res.sendJSON({ post });
});
```

**✅ Valid:** `/blog/my-awesome-post`  
**❌ Invalid:** `/blog/My Awesome Post` → 404

### 5. Boolean Validation

```javascript
router.get('/users/:active=boolean', (res, req, query, params) => {
  // params.active is a real boolean
  const users = findUsers({ active: params.active });
  
  res.sendJSON({ 
    active: params.active,  // true or false
    users 
  });
});
```

**✅ Valid:** `/users/true` → `params.active = true` (boolean)  
**✅ Valid:** `/users/false` → `params.active = false` (boolean)  
**❌ Invalid:** `/users/yes` → 404

## Multiple Typed Parameters

You can use multiple typed parameters in one route:

```javascript
router.get('/users/:userId=number/posts/:postId=number', (res, req, query, params) => {
  // Both are already numbers!
  const post = findUserPost(params.userId, params.postId);
  
  res.sendJSON({ 
    userId: params.userId,      // number
    postId: params.postId,      // number
    post 
  });
});
```

**✅ Valid:** `/users/5/posts/123`  
**❌ Invalid:** `/users/abc/posts/123` → 404  
**❌ Invalid:** `/users/5/posts/xyz` → 404

## Mixed Typed and Untyped

You can mix typed and untyped parameters:

```javascript
router.get('/api/:version/:id=number', (res, req, query, params) => {
  res.sendJSON({
    version: params.version,  // string (untyped)
    id: params.id             // number (typed)
  });
});
```

**✅ Valid:** `/api/v1/123` → `{ version: "v1", id: 123 }`  
**✅ Valid:** `/api/v2/456` → `{ version: "v2", id: 456 }`

## Advanced: Custom Validation

For complex validation, use regular parameters and validate manually:

```javascript
router.get('/users/:id', (res, req, query, params) => {
  // Custom validation logic
  const id = parseInt(params.id);
  
  if (isNaN(id) || id < 1 || id > 1000000) {
    return res.sendError('Invalid user ID: must be 1-1000000', 400);
  }
  
  const user = findUser(id);
  res.sendJSON({ user });
});
```

## Type Conversion Rules

VeloxAPI automatically converts validated parameters:

| Input | Type | Converted To |
|-------|------|--------------|
| `"123"` | `number` | `123` (number) |
| `"45.6"` | `float` | `45.6` (number) |
| `"true"` | `boolean` | `true` (boolean) |
| `"false"` | `boolean` | `false` (boolean) |
| `"abc"` | `string` | `"abc"` (string) |

## Performance Benefits

Typed parameters are validated **during routing**, not in your handler:

```javascript
// Route matching happens BEFORE handler execution
router.get('/users/:id=number', handler);

// If ":id" is not a number:
// 1. Router returns 404 immediately
// 2. Handler never executes
// 3. No wasted CPU cycles
```

**Result:** Invalid requests fail fast with minimal overhead.

## Best Practices

### 1. Use Specific Types
```javascript
// ❌ Too generic
router.get('/users/:id', handler);

// ✅ Specific and safe
router.get('/users/:id=number', handler);
```

### 2. Match Your Database
```javascript
// If your database uses UUIDs
router.get('/orders/:id=uuid', handler);

// If your database uses integers
router.get('/products/:id=number', handler);
```

### 3. Use Slugs for SEO
```javascript
// ❌ Not SEO friendly
router.get('/posts/:id=number', handler);

// ✅ SEO friendly URLs
router.get('/posts/:slug=slug', handler);
```

### 4. Email Routes
```javascript
// ✅ Validate email format
router.post('/subscribe/:email=email', async (res, req, query, params) => {
  await subscribeUser(params.email);
  res.sendJSON({ success: true });
});
```

## Real-World Example: E-commerce API

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';

const router = new VeloxRouter();

// Get product by ID (must be number)
router.get('/products/:id=number', (res, req, query, params) => {
  const product = findProduct(params.id);
  
  if (!product) {
    return res.sendError('Product not found', 404);
  }
  
  res.sendJSON({ product });
});

// Get product by slug (SEO-friendly)
router.get('/products/slug/:slug=slug', (res, req, query, params) => {
  const product = findProductBySlug(params.slug);
  
  if (!product) {
    return res.sendError('Product not found', 404);
  }
  
  res.sendJSON({ product });
});

// Track order by UUID
router.get('/orders/:orderId=uuid', (res, req, query, params) => {
  const order = findOrder(params.orderId);
  
  if (!order) {
    return res.sendError('Order not found', 404);
  }
  
  res.sendJSON({ order });
});

// Check inventory by product ID and warehouse ID
router.get('/inventory/:productId=number/:warehouseId=number', (res, req, query, params) => {
  const stock = getStock(params.productId, params.warehouseId);
  
  res.sendJSON({ 
    productId: params.productId,
    warehouseId: params.warehouseId,
    stock 
  });
});

// Subscribe with email validation
router.post('/newsletter/:email=email', (res, req, query, params) => {
  subscribeToNewsletter(params.email);
  
  res.sendJSON({ 
    message: `Subscribed: ${params.email}` 
  });
});

const server = new VeloxServer()
  .setPort(3000)
  .setRouter(router)
  .start();
```

## Summary

Typed parameters give you:

- ✅ **Automatic validation** - No manual checks
- ✅ **Type conversion** - Numbers, booleans, etc.
- ✅ **Better security** - Invalid inputs rejected early
- ✅ **Cleaner code** - No validation boilerplate
- ✅ **Better performance** - Fast-fail on invalid routes

**Next:** Learn about [Body Parsing](03-body-parsing.md) to handle POST/PUT requests!
