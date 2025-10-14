# Middleware - Add Reusable Logic

## What is Middleware?

Middleware functions run **before** your route handlers. They're perfect for:

- 🔐 **Authentication** - Check if user is logged in
- 📝 **Logging** - Record requests
- ⏱️ **Timing** - Measure response times
- 🔒 **Security** - Add security headers
- ✅ **Validation** - Validate common patterns

## Basic Middleware

Create a middleware function:

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';

const router = new VeloxRouter();

// Middleware function
const logger = (res, req, query, params, data, next) => {
  console.log(`${req.getMethod()} ${req.getPathname()}`);
  next();  // Call next() to continue to the route handler
};

// Add middleware
router.use(logger);

// Routes (logger runs before these)
router.get('/', (res) => {
  res.sendText('Hello!');
});

const server = new VeloxServer()
  .setPort(3000)
  .setRouter(router)
  .start();
```

**Every request logs:**
```
GET /
GET /api/users
POST /api/users
```

## Middleware Annotations

VeloxAPI supports powerful annotations for conditional middleware:

### @method - Run on Specific Methods

```javascript
const postLogger = (res, req, query, params, data, next) => {
  console.log('POST request:', req.getPathname());
  next();
};

// Annotation: Only run on POST requests
router.use(postLogger, '@method POST');

router.get('/users', (res) => {
  res.sendText('GET - logger NOT called');
});

router.post('/users', (res) => {
  res.sendText('POST - logger IS called');
});
```

**Multiple methods:**
```javascript
router.use(middleware, '@method GET,POST,PUT');
```

### @secure - Run Only on HTTPS

```javascript
const secureOnly = (res, req, query, params, data, next) => {
  if (!req.isSecure()) {
    return res.sendError('HTTPS required', 403);
  }
  next();
};

// Annotation: Only run on HTTPS
router.use(secureOnly, '@secure');
```

## Authentication Middleware

Protect routes with authentication:

```javascript
const authMiddleware = (res, req, query, params, data, next) => {
  const token = req.getHeader('authorization');
  
  if (!token) {
    return res.sendError('No authorization token', 401);
  }
  
  // Verify token (pseudo-code)
  const user = verifyToken(token);
  
  if (!user) {
    return res.sendError('Invalid token', 401);
  }
  
  // Pass user to route handler via data
  data.user = user;
  next();
};

router.use(authMiddleware);

// All routes now require authentication
router.get('/api/profile', (res, req, query, params, data) => {
  res.sendJSON({ 
    user: data.user  // User from middleware
  });
});
```

**Request:**
```bash
curl http://localhost:3000/api/profile \
  -H "Authorization: Bearer your-token-here"
```

## Logging Middleware

Log all requests:

```javascript
const requestLogger = (res, req, query, params, data, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`→ ${req.getMethod()} ${req.getPathname()}`);
  
  // Continue to handler
  next();
  
  // Log response time (after handler completes)
  const duration = Date.now() - start;
  console.log(`← ${req.getMethod()} ${req.getPathname()} - ${duration}ms`);
};

router.use(requestLogger);
```

**Output:**
```
→ GET /api/users
← GET /api/users - 15ms
→ POST /api/users
← POST /api/users - 42ms
```

## CORS Middleware

Enable cross-origin requests:

```javascript
const corsMiddleware = (res, req, query, params, data, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.getMethod() === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
};

router.use(corsMiddleware);
```

## Rate Limiting Middleware

Limit requests per IP:

```javascript
const rateLimits = new Map();

const rateLimiter = (res, req, query, params, data, next) => {
  const ip = req.req.socket.remoteAddress;
  const now = Date.now();
  const windowMs = 60000;  // 1 minute
  const maxRequests = 100;
  
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const limit = rateLimits.get(ip);
  
  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + windowMs;
    return next();
  }
  
  if (limit.count >= maxRequests) {
    return res.sendError('Too many requests', 429);
  }
  
  limit.count++;
  next();
};

router.use(rateLimiter);
```

## Timing Middleware

Measure route performance:

```javascript
const timingMiddleware = (res, req, query, params, data, next) => {
  const start = process.hrtime.bigint();
  
  next();
  
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1_000_000;
  
  // Add Server-Timing header
  res.setHeader('Server-Timing', `total;dur=${durationMs.toFixed(2)}`);
};

router.use(timingMiddleware);
```

**Response headers:**
```
Server-Timing: total;dur=12.45
```

## Error Handling Middleware

Catch errors globally:

```javascript
const errorHandler = async (res, req, query, params, data, next) => {
  try {
    await next();
  } catch (err) {
    console.error('Error:', err);
    
    if (!res.res.headersSent) {
      res.sendError('Internal server error', 500);
    }
  }
};

router.use(errorHandler);
```

## Multiple Middleware

Chain multiple middleware:

```javascript
const auth = (res, req, query, params, data, next) => {
  // Authentication logic
  data.user = { id: 1, name: 'Alice' };
  next();
};

const validateAdmin = (res, req, query, params, data, next) => {
  if (!data.user.isAdmin) {
    return res.sendError('Admin required', 403);
  }
  next();
};

// Add both
router.use(auth);
router.use(validateAdmin, '@method POST,PUT,DELETE');

// POST/PUT/DELETE routes require admin
router.delete('/api/users/:id', (res, req, query, params, data) => {
  res.sendJSON({ deleted: true });
});
```

## Conditional Middleware

Run middleware based on conditions:

```javascript
const apiKeyAuth = (res, req, query, params, data, next) => {
  const apiKey = req.getHeader('x-api-key');
  
  if (!apiKey || !isValidApiKey(apiKey)) {
    return res.sendError('Invalid API key', 401);
  }
  
  next();
};

// Only for API routes
router.use(apiKeyAuth, '@method POST,PUT,DELETE');
```

## Request/Response Modification

Modify requests in middleware:

```javascript
const preprocessor = (res, req, query, params, data, next) => {
  // Add timestamp to all requests
  data.requestTime = new Date().toISOString();
  
  // Add custom method to response
  res.sendSuccess = (obj) => {
    res.sendJSON({ 
      success: true, 
      timestamp: data.requestTime,
      data: obj 
    });
  };
  
  next();
};

router.use(preprocessor);

router.get('/api/users', (res, req, query, params, data) => {
  res.sendSuccess({ users: [] });  // Custom method
});
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-10-14T12:00:00.000Z",
  "data": { "users": [] }
}
```

## Real-World Example: Complete API

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';

const router = new VeloxRouter();

// 1. Request logging
router.use((res, req, query, params, data, next) => {
  console.log(`${req.getMethod()} ${req.getPathname()}`);
  next();
});

// 2. CORS
router.use((res, req, query, params, data, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.getMethod() === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// 3. Authentication (only POST/PUT/DELETE)
router.use((res, req, query, params, data, next) => {
  const token = req.getHeader('authorization');
  
  if (!token) {
    return res.sendError('Authentication required', 401);
  }
  
  const user = verifyToken(token);
  
  if (!user) {
    return res.sendError('Invalid token', 401);
  }
  
  data.user = user;
  next();
}, '@method POST,PUT,DELETE');

// 4. Rate limiting
const rateLimits = new Map();

router.use((res, req, query, params, data, next) => {
  const ip = req.req.socket.remoteAddress;
  const key = `${ip}:${Date.now() / 60000 | 0}`;
  const count = rateLimits.get(key) || 0;
  
  if (count >= 100) {
    return res.sendError('Rate limit exceeded', 429);
  }
  
  rateLimits.set(key, count + 1);
  next();
});

// 5. Error handling
router.use(async (res, req, query, params, data, next) => {
  try {
    await next();
  } catch (err) {
    console.error('Error:', err);
    res.sendError('Internal error', 500);
  }
});

// Routes (all middleware runs before these)
router.get('/api/users', (res) => {
  res.sendJSON({ users: [] });
});

router.post('/api/users', async (res, req, query, params, data) => {
  const body = await req.getBody();
  
  res.status(201).sendJSON({ 
    created: true,
    user: body,
    createdBy: data.user.id  // From auth middleware
  });
});

const server = new VeloxServer()
  .setPort(3000)
  .setRouter(router)
  .start();
```

## Performance Tips

### 1. Order Matters
Put fast middleware first:

```javascript
// ✅ Good: Fast checks first
router.use(rateLimiter);  // Fast: Map lookup
router.use(cors);          // Fast: Headers
router.use(auth);          // Slow: Token verification

// ❌ Bad: Slow checks first
router.use(auth);          // Wastes CPU on rate-limited requests
router.use(rateLimiter);
```

### 2. Use Annotations
Avoid unnecessary executions:

```javascript
// ❌ Runs on ALL requests
router.use(authMiddleware);

// ✅ Runs only on POST/PUT/DELETE
router.use(authMiddleware, '@method POST,PUT,DELETE');
```

### 3. Early Returns
Exit early when possible:

```javascript
const auth = (res, req, query, params, data, next) => {
  const token = req.getHeader('authorization');
  
  // Early return - no next() call
  if (!token) {
    return res.sendError('No token', 401);
  }
  
  next();
};
```

## Summary

Middleware in VeloxAPI:

- ✅ **Reusable logic** - DRY principle
- ✅ **Annotations** - @method, @secure
- ✅ **Data passing** - Share data between middleware
- ✅ **Error handling** - Catch errors globally
- ✅ **Performance** - Conditional execution
- ✅ **Clean code** - Separate concerns

**Next:** Learn about [Performance Optimization](05-performance.md) for production!
