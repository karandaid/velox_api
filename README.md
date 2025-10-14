# VeloxAPI

> **Ultra-fast, zero-dependency Node.js web framework**

[![npm version](https://img.shields.io/npm/v/veloxapi.svg)](https://www.npmjs.com/package/veloxapi)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-148%2F148-success.svg)](./tests)
[![Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)

VeloxAPI is a high-performance web framework built entirely with Node.js built-in modules. **Zero dependencies**, maximum speed.

## ⚡ Why VeloxAPI?

- 🚀 **Blazing Fast** - Optimized for maximum performance
- 🪶 **Zero Dependencies** - No external packages
- 🎯 **Developer Friendly** - Clean, intuitive API
- 🔒 **Secure by Default** - Built-in security features
- 📦 **Lightweight** - Minimal bundle size
- 🧪 **Well Tested** - 148/148 tests passing

## 📊 Performance

VeloxAPI is designed with performance-first architecture:
- **Radix tree routing** - O(log n) lookups vs O(n) linear
- **Object pooling** - Request/Response pools reduce GC overhead
- **Lazy body parsing** - Parse only when needed
- **Streaming I/O** - Constant memory for large files
- **Zero dependencies** - No external overhead

**Benchmarking:** Comprehensive benchmarks vs Fastify/Express/Koa coming soon.

## 🚀 Quick Start

### Installation

```bash
npm install veloxapi
```

### Hello World

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
```

Visit http://localhost:3000

## ✨ Key Features

### 🎯 Typed Parameters

Automatic validation and type conversion:

```javascript
router.get('/users/:id=number', (res, req, query, params) => {
  // params.id is already a number!
  res.sendJSON({ userId: params.id });
});
```

**12 built-in validators:** `string`, `number`, `int`, `float`, `boolean`, `email`, `url`, `uuid`, `slug`, `alpha`, `alphanumeric`, `hex`

### 💤 Lazy Body Parsing

Parse only when needed for better performance:

```javascript
router.post('/users', async (res, req) => {
  const body = await req.getBody();  // Parse now
  res.status(201).sendJSON({ user: body });
});
```

**Supports:** JSON, XML, YAML, form-data, multipart file uploads

### 🌊 Streaming File Serving

Efficient file serving with range requests:

```javascript
router.get('/download/:filename', async (res, req, query, params) => {
  await res.sendFile(params.filename, './uploads');
});
```

### 🔄 Middleware System

With powerful annotations:

```javascript
const auth = (res, req, query, params, data, next) => {
  if (!req.getHeader('authorization')) {
    return res.sendError('Unauthorized', 401);
  }
  next();
};

// Only run on POST/PUT/DELETE
router.use(auth, '@method POST,PUT,DELETE');
```

### ⚡ Object Pooling (v0.2.0+)

Reuse objects for reduced GC overhead:

```javascript
const server = new VeloxServer()
  .setPort(3000)
  .setRouter(router)
  .start();

// Check pool stats
console.log(server.getStats());
// { requestPool: {...}, responsePool: {...} }
```

## 📚 Documentation

### Learning Path
- **[Getting Started](./learn/01-getting-started.md)** - Your first API in 15 minutes
- **[Typed Parameters](./learn/02-typed-parameters.md)** - Automatic validation
- **[Body Parsing](./learn/03-body-parsing.md)** - Handle POST/PUT data
- **[Middleware](./learn/04-middleware.md)** - Reusable logic
- **[Performance](./learn/05-performance.md)** - Production optimization

### API Reference
- **[Complete API Documentation](./docs/API.md)** - All methods and options
- **[Performance Guide](./docs/PERFORMANCE.md)** - Optimization tips
- **[Changelog](./CHANGELOG.md)** - Version history

## 🎯 Examples

### REST API

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';

const router = new VeloxRouter();
const users = [];

// List users
router.get('/api/users', (res) => {
  res.sendJSON({ users });
});

// Get user by ID (typed parameter)
router.get('/api/users/:id=number', (res, req, query, params) => {
  const user = users.find(u => u.id === params.id);
  
  if (!user) {
    return res.sendError('User not found', 404);
  }
  
  res.sendJSON({ user });
});

// Create user
router.post('/api/users', async (res, req) => {
  const body = await req.getBody();
  
  const user = {
    id: users.length + 1,
    ...body
  };
  
  users.push(user);
  res.status(201).sendJSON({ user });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

### File Upload

```javascript
import { writeFile } from 'fs/promises';

router.post('/upload', async (res, req) => {
  const body = await req.getBody();
  
  for (const file of body.files) {
    await writeFile(`./uploads/${file.filename}`, file.data);
  }
  
  res.sendJSON({ 
    uploaded: body.files.length,
    files: body.files.map(f => f.filename)
  });
});
```

### Authentication Middleware

```javascript
// Auth middleware
router.use((res, req, query, params, data, next) => {
  const token = req.getHeader('authorization');
  
  if (!token) {
    return res.sendError('Unauthorized', 401);
  }
  
  data.user = verifyToken(token);
  next();
}, '@method POST,PUT,DELETE');

// Protected route
router.post('/api/posts', async (res, req, query, params, data) => {
  const body = await req.getBody();
  
  res.status(201).sendJSON({
    post: body,
    author: data.user.name  // From middleware
  });
});
```

## 🔧 API Overview

### Server

```javascript
const server = new VeloxServer()
  .setPort(3000)
  .setHost('0.0.0.0')
  .setRouter(router)
  .enableHTTPS({ key, cert })
  .start();
  
// Get pool statistics
server.getStats();

// Stop server
server.stop();
server.close();  // Alias
```

### Router

```javascript
const router = new VeloxRouter();

router.get('/path', handler);
router.post('/path', handler);
router.put('/path', handler);
router.delete('/path', handler);
router.patch('/path', handler);
router.use(middleware, '@method POST');
```

### Response Methods

```javascript
res.sendJSON({ data })              // JSON response
res.sendHTML('<h1>Hello</h1>')      // HTML response
res.sendText('Hello')                // Plain text
res.sendFile('file.pdf', './dir')   // Stream file
res.sendBuffer(buffer, 'image/png') // Binary data
res.sendError('Not found', 404)     // Error response
res.redirect('/new-path')            // Redirect
res.status(201).sendJSON({ ok })    // Chain methods
```

### Request Methods

```javascript
await req.getBody()          // Parse body (JSON/XML/form/multipart)
req.getQuery()               // Query parameters
req.getHeader('name')        // Get header
req.getMethod()              // HTTP method
req.getPathname()            // URL pathname
req.getCookies()             // Parse cookies
req.isSecure()              // Check HTTPS
```

## 🏆 Why Zero Dependencies?

**Traditional frameworks:**
```
express@4.18.0
├── body-parser@1.20.2
├── cookie@0.5.0
├── debug@2.6.9
└── ... (30+ dependencies)
```

**VeloxAPI:**
```
veloxapi@0.2.0-alpha.1
└── (no dependencies)
```

**Benefits:**
- ⚡ Faster startup (no dependency loading)
- 🔒 No external security vulnerabilities
- 📦 Smaller bundle size (~50KB)
- 🎯 Complete control over implementation
- 🔄 No breaking changes from dependencies

## 🧪 Testing

```bash
npm test                # Run all tests
npm run test:coverage   # With coverage
npm run test:watch      # Watch mode
```

**Current status:** 148/148 tests passing ✅

## 📈 Benchmarking

Install autocannon:
```bash
npm install -g autocannon
```

Benchmark your API:
```bash
# Simple GET
autocannon -c 100 -d 30 http://localhost:3000/api/data

# POST with body
autocannon -c 100 -d 30 -m POST \
  -H "Content-Type: application/json" \
  -b '{"name":"test"}' \
  http://localhost:3000/api/users
```

## 🛣️ Roadmap

### v0.2.0-alpha.1 (Current)
- ✅ Object pooling with Request/Response pools
- ✅ True streaming for constant memory usage
- ✅ Comprehensive testing (148/148 tests)
- ✅ Comprehensive tutorials
- ✅ Enhanced documentation

### v0.3.0
- [ ] Static file middleware with ETag
- [ ] Rate limiting (token bucket)
- [ ] JSON schema validation
- [ ] Response compression (gzip/brotli)

### v1.0.0
- [ ] CLI tool (`velox init`, generators)
- [ ] Plugin system
- [ ] TypeScript definitions
- [ ] Production battle-tested

### Future
- [ ] Worker clustering
- [ ] HTTP/2 support
- [ ] Native addons (optional)

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Run tests (`npm test`)
4. Commit your changes (`git commit -am 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing`)
6. Open a Pull Request

## 📄 License

MIT © VeloxAPI Contributors

## 🙏 Acknowledgments

- Built entirely with Node.js built-in modules
- Inspired by Fastify's performance goals
- Community feedback and contributions

## 🔗 Links

- **[Documentation](./learn/README.md)** - Complete learning path
- **[API Reference](./docs/API.md)** - Detailed API docs
- **[Examples](./examples/)** - Code examples
- **[Changelog](./CHANGELOG.md)** - Version history

---

**Made with ❤️ for performance** | [Website](https://veloxapi.dev) | [GitHub](https://github.com/veloxapi/veloxapi) | [npm](https://www.npmjs.com/package/veloxapi)
