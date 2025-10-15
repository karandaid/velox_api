# VeloxAPI

> **Ultra-fast, zero-dependency Node.js web framework**

[![npm version](https://img.shields.io/npm/v/veloxapi.svg)](https://www.npmjs.com/package/veloxapi)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-254%2F254-success.svg)](./tests)
[![Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)

VeloxAPI is a high-performance web framework built entirely with Node.js built-in modules. **Zero dependencies**, maximum speed, production-ready.

---

## ⚡ Why VeloxAPI?

### The Problem with Traditional Frameworks

Most Node.js frameworks come with baggage:

```bash
# Express.js dependencies
express@4.18.0
├── body-parser (+ 15 deps)
├── cookie (+ 2 deps)  
├── debug (+ 3 deps)
└── ... 30+ total dependencies

# Fastify dependencies
fastify@4.x
├── ajv (+ 10 deps)
├── fast-json-stringify (+ 5 deps)
└── ... 20+ total dependencies
```

**Every dependency:**
- 🐌 Adds startup overhead
- 🔓 Introduces security vulnerabilities
- 💔 Can break with updates
- 📦 Increases bundle size

### The VeloxAPI Solution

```bash
veloxapi@0.2.0-alpha.4
└── (zero dependencies)
```

**Built entirely with Node.js native modules:**
- ⚡ **Maximum Performance** - No external overhead, optimized algorithms
- 🛡️ **Secure** - No third-party vulnerabilities
- 🪶 **Lightweight** - ~50KB bundle size
- 🎯 **Predictable** - No breaking changes from dependencies
- 🚀 **Fast Startup** - No dependency tree to load

---

## 🏆 VeloxAPI vs Other Frameworks

| Feature | VeloxAPI | Fastify | Express | Koa |
|---------|----------|---------|---------|-----|
| **Dependencies** | 0 | 20+ | 30+ | 5+ |
| **Routing Speed** | O(log n) radix | O(log n) radix | O(n) linear | O(n) linear |
| **Body Parsing** | Lazy (on-demand) | Eager | Eager | Plugin |
| **Streaming** | Built-in | Plugin | Limited | Plugin |
| **Typed Params** | Built-in (12 types) | None | None | None |
| **Object Pooling** | Built-in | None | None | None |
| **Security** | Built-in | Plugin | Plugin | Plugin |
| **Bundle Size** | ~50KB | ~200KB | ~150KB | ~80KB |

### Key Differentiators

1. **Zero Dependencies** - Complete control, no external risks
2. **Radix Tree Routing** - O(log n) lookups vs O(n) linear (Express/Koa)
3. **Lazy Body Parsing** - Parse only when needed (performance win)
4. **Object Pooling** - Reuse Request/Response objects (reduces GC)
5. **Typed Parameters** - Built-in validation (12 types)
6. **True Streaming** - Constant memory usage for large files

---

## 🚀 Quick Start

### Requirements

- **Node.js 18+** (with ES modules support)
- **ES Modules** - Your package.json needs `"type": "module"`

### Installation

```bash
npm install veloxapi
```

### Your First Server (30 seconds)

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';

const router = new VeloxRouter();

router.get('/', (res) => {
  res.sendJSON({ message: 'Hello VeloxAPI!' });
});

const server = new VeloxServer()
  .setPort(3000)
  .setRouter(router)
  .start();

console.log('🚀 Server running at http://localhost:3000');
```

**Run it:**
```bash
node server.js
```

Visit http://localhost:3000 - You're done! 🎉

---

## 💡 Core Concepts

### 1. The Router (Define Your Routes)

```javascript
import { VeloxRouter } from 'veloxapi';

const router = new VeloxRouter();

// Basic routes
router.get('/users', (res) => {
  res.sendJSON({ users: [] });
});

router.post('/users', async (res, req) => {
  const body = await req.getBody();
  res.status(201).sendJSON({ user: body });
});
```

### 2. The Server (Start Listening)

```javascript
import { VeloxServer } from 'veloxapi';

const server = new VeloxServer()
  .setPort(3000)           // Port number
  .setHost('0.0.0.0')      // Bind to all interfaces
  .setRouter(router)       // Attach your router
  .start();                // Start listening
```

### 3. Handler Signature

```javascript
router.get('/path', (res, req, query, params, data) => {
  // res     - Response object (send data)
  // req     - Request object (get data)
  // query   - Query parameters (?page=1)
  // params  - Route parameters (/:id)
  // data    - Shared data from middleware
});
```

---

## 📚 Progressive Examples

### Example 1: Simple API (Beginner)

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';

const router = new VeloxRouter();

router.get('/api/status', (res) => {
  res.sendJSON({ 
    status: 'ok', 
    timestamp: Date.now() 
  });
});

router.get('/api/hello/:name', (res, req, query, params) => {
  res.sendJSON({ 
    message: `Hello, ${params.name}!` 
  });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

**Test it:**
```bash
curl http://localhost:3000/api/status
curl http://localhost:3000/api/hello/Alice
```

---

### Example 2: REST API with Validation (Intermediate)

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';

const router = new VeloxRouter();
const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' }
];

// List all users
router.get('/api/users', (res) => {
  res.sendJSON({ users, total: users.length });
});

// Get user by ID (with type validation!)
router.get('/api/users/:id=number', (res, req, query, params) => {
  const user = users.find(u => u.id === params.id);
  
  if (!user) {
    return res.sendError('User not found', 404);
  }
  
  res.sendJSON({ user });
});

// Create user with validation
router.post('/api/users', async (res, req) => {
  const body = await req.getBody();
  
  // Validate required fields
  if (!body.name || !body.email) {
    return res.sendError('Missing name or email', 400);
  }
  
  const user = {
    id: users.length + 1,
    name: body.name,
    email: body.email
  };
  
  users.push(user);
  res.status(201).sendJSON({ user });
});

// Update user
router.put('/api/users/:id=number', async (res, req, query, params) => {
  const user = users.find(u => u.id === params.id);
  
  if (!user) {
    return res.sendError('User not found', 404);
  }
  
  const body = await req.getBody();
  Object.assign(user, body);
  
  res.sendJSON({ user });
});

// Delete user
router.delete('/api/users/:id=number', (res, req, query, params) => {
  const index = users.findIndex(u => u.id === params.id);
  
  if (index === -1) {
    return res.sendError('User not found', 404);
  }
  
  users.splice(index, 1);
  res.status(204).send();
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

**Test the CRUD API:**
```bash
# List users
curl http://localhost:3000/api/users

# Get user
curl http://localhost:3000/api/users/1

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie","email":"charlie@example.com"}'

# Update user
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Smith"}'

# Delete user
curl -X DELETE http://localhost:3000/api/users/2
```

---

### Example 3: Middleware & Authentication (Advanced)

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';
import crypto from 'crypto';

const router = new VeloxRouter();

// Mock users database
const users = new Map([
  ['token-alice', { id: 1, name: 'Alice', role: 'admin' }],
  ['token-bob', { id: 2, name: 'Bob', role: 'user' }]
]);

// Logging middleware (runs on ALL requests)
router.use((res, req, query, params, data, next) => {
  const start = Date.now();
  console.log(`→ ${req.getMethod()} ${req.getPathname()}`);
  
  // Run after response
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`← ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// CORS middleware (runs on ALL requests)
router.use((res, req, query, params, data, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Auth middleware (runs ONLY on POST/PUT/DELETE)
router.use((res, req, query, params, data, next) => {
  const token = req.getHeader('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.sendError('Missing authorization token', 401);
  }
  
  const user = users.get(token);
  if (!user) {
    return res.sendError('Invalid token', 401);
  }
  
  data.user = user;  // Store user in shared data
  next();
}, '@method POST,PUT,DELETE');

// Admin-only middleware
const requireAdmin = (res, req, query, params, data, next) => {
  if (data.user.role !== 'admin') {
    return res.sendError('Admin access required', 403);
  }
  next();
};

// Public route (no auth required)
router.get('/api/public', (res) => {
  res.sendJSON({ message: 'Public data' });
});

// Protected route (auth required)
router.post('/api/posts', async (res, req, query, params, data) => {
  const body = await req.getBody();
  
  res.status(201).sendJSON({
    post: body,
    author: data.user.name  // From auth middleware
  });
});

// Admin-only route
router.delete('/api/users/:id', requireAdmin, (res, req, query, params, data) => {
  res.sendJSON({ 
    deleted: params.id,
    by: data.user.name
  });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

**Test middleware:**
```bash
# Public route (no auth)
curl http://localhost:3000/api/public

# Protected route (needs auth)
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer token-alice" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Post"}'

# Admin route (needs admin)
curl -X DELETE http://localhost:3000/api/users/123 \
  -H "Authorization: Bearer token-alice"
```

---

### Example 4: File Uploads & Streaming (Production)

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const router = new VeloxRouter();

// Ensure upload directory exists
if (!existsSync('./uploads')) {
  await mkdir('./uploads', { recursive: true });
}

// Upload single or multiple files
router.post('/api/upload', async (res, req) => {
  const body = await req.getBody();
  
  if (!body.files || body.files.length === 0) {
    return res.sendError('No files uploaded', 400);
  }
  
  const uploaded = [];
  
  for (const file of body.files) {
    const filename = `${Date.now()}-${file.filename}`;
    const filepath = path.join('./uploads', filename);
    
    await writeFile(filepath, file.data);
    uploaded.push({ filename, size: file.data.length });
  }
  
  res.status(201).sendJSON({ 
    uploaded: uploaded.length,
    files: uploaded
  });
});

// Stream file download (constant memory!)
router.get('/api/download/:filename', async (res, req, query, params) => {
  const filename = params.filename;
  
  // Security: prevent path traversal
  if (filename.includes('..') || filename.includes('/')) {
    return res.sendError('Invalid filename', 400);
  }
  
  try {
    await res.sendFile(filename, './uploads');
  } catch (err) {
    res.sendError('File not found', 404);
  }
});

// List uploaded files
router.get('/api/files', async (res) => {
  const { readdir, stat } = await import('fs/promises');
  
  const files = await readdir('./uploads');
  const fileList = await Promise.all(
    files.map(async (name) => {
      const stats = await stat(path.join('./uploads', name));
      return {
        name,
        size: stats.size,
        modified: stats.mtime
      };
    })
  );
  
  res.sendJSON({ files: fileList, total: fileList.length });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

**Test file operations:**
```bash
# Upload file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@./photo.jpg"

# List files
curl http://localhost:3000/api/files

# Download file
curl http://localhost:3000/api/download/1234567890-photo.jpg -O
```

---

## ✨ Key Features

### 🎯 Typed Parameters (12 Validators)

Automatic validation and type conversion:

```javascript
// Number validation
router.get('/users/:id=number', (res, req, query, params) => {
  console.log(typeof params.id);  // 'number'
  res.sendJSON({ userId: params.id });
});

// Email validation
router.get('/verify/:email=email', (res, req, query, params) => {
  res.sendJSON({ email: params.email });
});

// UUID validation
router.get('/orders/:orderId=uuid', (res, req, query, params) => {
  res.sendJSON({ orderId: params.orderId });
});
```

**Available validators:** `string`, `number`, `int`, `float`, `boolean`, `email`, `url`, `uuid`, `slug`, `alpha`, `alphanumeric`, `hex`

### 💤 Lazy Body Parsing

Parse only when needed for better performance:

```javascript
// Body parsed ONLY if handler calls getBody()
router.post('/users', async (res, req) => {
  const body = await req.getBody();  // Parse here
  res.status(201).sendJSON({ user: body });
});

// No parsing overhead if not needed
router.post('/webhook', (res, req) => {
  res.sendJSON({ received: true });  // Body never parsed
});
```

**Supports:** JSON, XML, YAML, form-data, multipart file uploads

### 🌊 True Streaming

Constant memory usage for large files:

```javascript
// Stream 1GB file with only ~1MB memory usage
router.get('/video/:id', async (res, req, query, params) => {
  await res.sendFile(`${params.id}.mp4`, './videos');
  // Handles range requests, MIME detection, streaming automatically
});
```

### ⚡ Object Pooling (v0.2.0+)

Reuse objects for reduced GC overhead:

```javascript
const server = new VeloxServer()
  .setPort(3000)
  .setRouter(router)
  .start();

// Check pool statistics
console.log(server.getStats());
// {
//   requestPool: { size: 50, available: 45, created: 100 },
//   responsePool: { size: 50, available: 45, created: 100 }
// }
```

### 📁 Static File Serving (v0.2.0-alpha.3+)

High-performance file serving with security and caching:

```javascript
import { VeloxServer, VeloxRouter, staticFiles } from 'veloxapi';

const router = new VeloxRouter();

// Serve static files from 'public' directory
router.use(staticFiles('./public', {
  etag: true,           // Enable ETag caching
  maxAge: 3600,         // Cache-Control: max-age=3600
  dotfiles: false,      // Block dotfiles (.env, .git)
  index: ['index.html'] // Default index files
}));

// API routes work alongside static files
router.get('/api/status', (res) => {
  res.sendJSON({ status: 'ok' });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

**Features:**
- ✅ ETag generation and validation for intelligent caching
- ✅ Path traversal protection (blocks `../` and absolute paths)
- ✅ Dotfile blocking (`.env`, `.git` protection)
- ✅ Automatic MIME type detection (28+ types)
- ✅ Range request support for streaming
- ✅ Security-first design

### 🚦 Rate Limiting (v0.2.0-alpha.3+)

Token bucket algorithm for smooth rate limiting:

```javascript
import { VeloxServer, VeloxRouter, rateLimit, rateLimitRoute } from 'veloxapi';

const router = new VeloxRouter();

// Global rate limit: 100 requests per minute
router.use(rateLimit({
  maxRequests: 100,
  windowMs: 60000,
  message: 'Too many requests, please try again later.'
}));

// Stricter limit for specific route: 5 requests per minute
const apiLimiter = rateLimitRoute('/api/strict', {
  maxRequests: 5,
  windowMs: 60000
});

router.get('/api/strict', apiLimiter, (res) => {
  res.sendJSON({ message: 'This route is strictly rate limited' });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

**Features:**
- ✅ Token bucket algorithm (smooth refill, no burst spikes)
- ✅ Per-IP automatic tracking
- ✅ Per-route custom limits
- ✅ Standard rate limit headers (`X-RateLimit-*`)
- ✅ Automatic cleanup to prevent memory leaks
- ✅ Custom handlers and skip options

---

## 🎓 Learning Path

Start your VeloxAPI journey with our comprehensive tutorials:

1. **[Getting Started](./learn/01-getting-started.md)** - Build your first API in 15 minutes
2. **[Typed Parameters](./learn/02-typed-parameters.md)** - Master automatic validation
3. **[Body Parsing](./learn/03-body-parsing.md)** - Handle POST/PUT data like a pro
4. **[Middleware](./learn/04-middleware.md)** - Build reusable logic chains (includes static files & rate limiting)
5. **[Performance](./learn/05-performance.md)** - Production optimization tips
6. **[Authentication & Security](./learn/06-authentication-security.md)** - JWT, sessions, and security best practices
7. **[File Streaming & Uploads](./learn/07-file-streaming-uploads.md)** - Handle file uploads and streaming
8. **[Testing Strategies](./learn/08-testing-strategies.md)** - Comprehensive testing with Jest

**More tutorials coming soon:**
- Deployment & Observability
- Advanced Performance Benchmarking
- WebSockets & Real-time

---

## 📖 Complete API Reference

### Server API

```javascript
const server = new VeloxServer()
  .setPort(3000)                    // Set port (default: 3000)
  .setHost('0.0.0.0')              // Set host (default: localhost)
  .setRouter(router)                // Attach router
  .enableHTTPS({ key, cert })       // Enable HTTPS
  .start();                         // Start server
  
// Methods
server.getStats();                  // Get pool statistics
server.stop();                      // Stop server
server.close();                     // Alias for stop()
```

### Router API

```javascript
const router = new VeloxRouter();

// HTTP methods
router.get(path, handler);
router.post(path, handler);
router.put(path, handler);
router.delete(path, handler);
router.patch(path, handler);

// Global middleware
router.use(middleware);                      // All routes
router.use(middleware, '@method POST');      // POST only
router.use(middleware, '@path /api/*');      // Path pattern
```

#### Route-Specific Middleware (v0.2.0-alpha.3+)

Apply middleware to individual routes for fine-grained control:

```javascript
// Single middleware
router.get('/admin', authMiddleware, adminHandler);

// Multiple middleware (executed in order)
router.post('/api/posts', 
  authMiddleware,      // 1. Check authentication
  validateBody,        // 2. Validate request body
  createPostHandler    // 3. Handle request
);

// Mix with global middleware
router.use(logger);  // Runs on all routes
router.post('/protected', auth, handler);  // Auth only for this route
```

**Benefits:**
- ✅ **Performance** - Skip middleware for routes that don't need it
- ✅ **Express-compatible** - Easy migration from Express
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Flexible** - Mix global and route-specific middleware

**Learn more:** [Middleware Tutorial](./learn/04-middleware.md#route-specific-middleware-v020-alpha3)

### Response Methods

```javascript
res.sendJSON({ data })                    // JSON response
res.sendHTML('<h1>Hello</h1>')           // HTML response
res.sendText('Hello')                     // Plain text
res.sendFile('file.pdf', './dir')        // Stream file (range requests)
res.sendBuffer(buffer, 'image/png')      // Binary data
res.sendError('Not found', 404)          // Error response
res.redirect('/new-path', 302)           // Redirect
res.status(201)                           // Set status code
res.setHeader('X-Custom', 'value')       // Set header
res.setCookie('token', 'abc', options)   // Set cookie
```

### Request Methods

```javascript
await req.getBody()              // Parse body (JSON/XML/form/multipart)
req.getQuery()                   // Query parameters object
req.getHeader('name')            // Get header value
req.getMethod()                  // HTTP method (GET, POST, etc.)
req.getPathname()                // URL pathname
req.getCookies()                 // Parse cookies
req.isSecure()                   // Check if HTTPS
```

### Handler Signature

```javascript
function handler(res, req, query, params, data, next) {
  // res     - Response object
  // req     - Request object
  // query   - Query parameters (?page=1)
  // params  - Route parameters (/:id)
  // data    - Shared object (middleware communication)
  // next    - Call next middleware (middleware only)
}
```

---

## 🔧 Best Practices

### 1. Organize Routes by Resource

```javascript
// users.js
export function usersRouter(router) {
  router.get('/api/users', listUsers);
  router.post('/api/users', createUser);
  router.get('/api/users/:id=number', getUser);
}

// posts.js
export function postsRouter(router) {
  router.get('/api/posts', listPosts);
  router.post('/api/posts', createPost);
}

// main.js
import { VeloxRouter } from 'veloxapi';
import { usersRouter } from './users.js';
import { postsRouter } from './posts.js';

const router = new VeloxRouter();
usersRouter(router);
postsRouter(router);
```

### 2. Use Environment Variables

```javascript
import 'dotenv/config';  // or your env loader

const server = new VeloxServer()
  .setPort(process.env.PORT || 3000)
  .setHost(process.env.HOST || '0.0.0.0')
  .setRouter(router)
  .start();
```

### 3. Centralized Error Handling

```javascript
// error-handler.js
export function errorHandler(res, req, query, params, data, next) {
  try {
    next();
  } catch (err) {
    console.error('Error:', err);
    res.sendError('Internal server error', 500);
  }
}

// main.js
router.use(errorHandler);  // Add first
```

### 4. Request Validation

```javascript
function validateUser(body) {
  const errors = [];
  
  if (!body.name || body.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (!body.email || !body.email.includes('@')) {
    errors.push('Invalid email address');
  }
  
  return errors;
}

router.post('/api/users', async (res, req) => {
  const body = await req.getBody();
  const errors = validateUser(body);
  
  if (errors.length > 0) {
    return res.status(400).sendJSON({ errors });
  }
  
  // Create user...
});
```

### 5. Security Headers

```javascript
router.use((res, req, query, params, data, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});
```

---

## 🧪 Testing

```bash
npm test                # Run all 148 tests
npm run test:coverage   # With coverage report
npm run test:watch      # Watch mode
```

**Write your own tests:**

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';
import { test } from 'node:test';
import assert from 'node:assert';

test('GET /api/status returns 200', async () => {
  const router = new VeloxRouter();
  router.get('/api/status', (res) => {
    res.sendJSON({ status: 'ok' });
  });
  
  const server = new VeloxServer()
    .setPort(3001)
    .setRouter(router)
    .start();
  
  const response = await fetch('http://localhost:3001/api/status');
  const data = await response.json();
  
  assert.strictEqual(data.status, 'ok');
  
  server.stop();
});
```

---

## 📈 Performance & Benchmarking

### Architecture Optimizations

- **Radix Tree Routing** - O(log n) lookups vs O(n) linear
- **Object Pooling** - Reuse Request/Response objects (reduces GC)
- **Lazy Body Parsing** - Parse only when needed
- **Streaming I/O** - Constant memory for large files
- **Zero Dependencies** - No external overhead

### Benchmark Your API

```bash
# Install autocannon
npm install -g autocannon

# Simple GET benchmark
autocannon -c 100 -d 30 http://localhost:3000/api/status

# POST with body
autocannon -c 100 -d 30 -m POST \
  -H "Content-Type: application/json" \
  -b '{"name":"test"}' \
  http://localhost:3000/api/users
```

**Comprehensive benchmarks vs Fastify/Express/Koa coming soon.**

---

## 🛣️ Roadmap

### v0.2.0-alpha.1 (Current)
- ✅ Object pooling with Request/Response pools
- ✅ True streaming for constant memory usage
- ✅ Comprehensive testing (148/148 tests)
- ✅ Tutorial system
- ✅ Enhanced documentation

### v0.3.0 (Next)
- [ ] Static file middleware with ETag
- [ ] Rate limiting (token bucket algorithm)
- [ ] JSON schema validation
- [ ] Response compression (gzip/brotli)

### v1.0.0 (Production)
- [ ] CLI tool (`velox init`, generators)
- [ ] Plugin system
- [ ] TypeScript definitions
- [ ] Production battle-tested

### Future
- [ ] Worker clustering
- [ ] HTTP/2 support
- [ ] WebSocket support
- [ ] Native performance addons (optional)

---

## 🏆 Why Choose VeloxAPI?

### ✅ Choose VeloxAPI if you want:
- **Maximum performance** with zero external overhead
- **Complete control** over your framework
- **Security** without third-party vulnerabilities
- **Predictability** with no dependency breaking changes
- **Lightweight** deployment (<50KB)
- **Modern features** (typed params, streaming, pooling)

### ⚠️ Consider alternatives if you need:
- **TypeScript source** (we provide JS + future TS definitions)
- **Massive ecosystem** (Express/Fastify have more plugins)
- **Enterprise support** (community-driven for now)

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing`)
3. **Run** tests (`npm test`)
4. **Commit** your changes (`git commit -am 'Add amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing`)
6. **Open** a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

MIT © VeloxAPI Contributors

---

## 🔗 Resources

- **[Documentation](./learn/README.md)** - Complete learning path
- **[API Reference](./docs/API.md)** - Detailed API docs
- **[Examples](./examples/)** - Code examples
- **[Changelog](./CHANGELOG.md)** - Version history

---

**Made with ❤️ for performance**
