# VeloxAPI Learning Center

Welcome to the VeloxAPI tutorials! Learn how to build ultra-fast Node.js APIs from scratch.

## 📚 Complete Tutorial Series

### Beginner Level

#### 1. [Getting Started](01-getting-started.md) 🚀
**What you'll learn:**
- What is VeloxAPI and why zero dependencies?
- Create your first server in 30 seconds
- Define routes and handlers
- Send JSON, HTML, and file responses
- Build a complete REST API

**Time:** 15 minutes  
**Level:** Beginner

---

#### 2. [Typed Parameters](02-typed-parameters.md) ✨
**What you'll learn:**
- Automatic parameter validation
- 12 built-in validators (number, email, uuid, slug, etc.)
- Type conversion (string → number, boolean)
- Fast-fail validation for better performance
- Real-world e-commerce examples

**Time:** 20 minutes  
**Level:** Beginner

---

### Intermediate Level

#### 3. [Body Parsing](03-body-parsing.md) 📦
**What you'll learn:**
- Lazy body parsing (performance boost)
- Parse JSON, XML, YAML, form-data
- Handle file uploads (multipart)
- Request size limits
- Streaming large files
- Error handling

**Time:** 25 minutes  
**Level:** Intermediate

---

#### 4. [Middleware](04-middleware.md) 🔗
**What you'll learn:**
- What is middleware and when to use it
- Middleware annotations (@method, @path, @secure)
- Route-specific middleware (v0.2.0-alpha.3+)
- Authentication middleware
- **Static file serving with ETag caching**
- **Rate limiting with token bucket algorithm**
- CORS, logging, error handling
- Chain multiple middleware

**Time:** 30 minutes  
**Level:** Intermediate

---

### Advanced Level

#### 5. [Performance Optimization](05-performance.md) ⚡
**What you'll learn:**
- Object pooling for reduced GC overhead
- True streaming for constant memory usage
- Route caching strategies
- Memory optimization techniques
- Production benchmarks
- Compare with Express/Fastify

**Time:** 35 minutes  
**Level:** Advanced

---

#### 6. [Authentication & Security](06-authentication-security.md) 🔒
**What you'll learn:**
- Token-based authentication
- JWT implementation from scratch
- Session management with cookies
- Security headers and best practices
- Password hashing with crypto
- Rate limiting and CORS
- Input validation and sanitization

**Time:** 40 minutes  
**Level:** Advanced

---

#### 7. [File Streaming & Uploads](07-file-streaming-uploads.md) 📁
**What you'll learn:**
- File upload basics (single & multiple)
- Multipart form-data handling
- Streaming file downloads
- Range requests for video streaming
- Image/video validation and processing
- Security best practices for files
- Production file management system

**Time:** 45 minutes  
**Level:** Advanced

---

#### 8. [Testing Strategies](08-testing-strategies.md) 🧪
**What you'll learn:**
- Jest setup for ES modules
- Unit testing routes and utilities
- Integration testing API endpoints
- Testing authentication flows
- Testing file uploads/downloads
- Performance and load testing
- Achieving high test coverage

**Time:** 40 minutes  
**Level:** Advanced

---

## 🚀 Quick Start

```bash
# Install VeloxAPI
npm install veloxapi

# Create server.js
cat > server.js << 'EOF'
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
EOF

# Run it
node server.js
```

Visit http://localhost:3000 - You're done! 🎉

---

## 📖 Learning Paths

### Path 1: Quick Start (Beginners)
**Goal:** Build your first API in under an hour

1. ✅ [Getting Started](01-getting-started.md) - 15 min
2. ✅ [Typed Parameters](02-typed-parameters.md) - 20 min
3. ✅ [Body Parsing](03-body-parsing.md) - 25 min

**Total:** 1 hour | **Result:** Working REST API

---

### Path 2: Production Ready (Intermediate)
**Goal:** Build secure, performant APIs

1. ✅ [Getting Started](01-getting-started.md)
2. ✅ [Typed Parameters](02-typed-parameters.md)
3. ✅ [Body Parsing](03-body-parsing.md)
4. ✅ [Middleware](04-middleware.md)
5. ✅ [Authentication & Security](06-authentication-security.md)
6. ✅ [Testing Strategies](08-testing-strategies.md)

**Total:** 3 hours | **Result:** Secure, tested API

---

### Path 3: Master Level (Advanced)
**Goal:** Build high-performance production systems

1. Complete all 8 tutorials
2. Study [Performance Guide](../docs/PERFORMANCE.md)
3. Review [API Documentation](../docs/API.md)
4. Build a production project
5. Run benchmarks and optimize

**Total:** 5-6 hours | **Result:** Expert-level knowledge

---

## 💡 Key Concepts

### Zero Dependencies 🎯
VeloxAPI has **ZERO** production dependencies. Everything is built with Node.js built-in modules.

**Why?**
- ⚡ Faster startup (no dependency loading)
- 🔒 No external vulnerabilities
- 📦 Smaller bundle size (~50KB)
- 🎯 Complete control over implementation

### Lazy Parsing 💤
Bodies are only parsed when you call `req.getBody()`.

**Why?**
- ⚡ Better performance (no wasted CPU)
- 💾 Memory efficient
- 🎯 Parse only what you need
- 🚀 Faster response times

### Radix Tree Routing 🌲
O(log n) route matching using a radix tree.

**Why?**
- ⚡ 10x faster than linear search
- 📊 Scales to thousands of routes
- 🗂️ Smart route caching
- 🔥 Production-grade performance

### Typed Parameters ✨
Routes validate parameters automatically: `/users/:id=number`

**Why?**
- ✅ Automatic validation
- 🔄 Type conversion
- 🚫 404 for invalid inputs
- 🧹 No boilerplate code

### Object Pooling ♻️
Reuse Request/Response objects for reduced GC overhead.

**Why?**
- ⚡ Reduced garbage collection
- 📈 Better throughput
- 💾 Lower memory usage
- 🚀 Production performance

---

## 🎯 Example Projects

### 1. Simple REST API
```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';

const router = new VeloxRouter();
const users = [];

router.get('/users', (res) => {
  res.sendJSON({ users });
});

router.post('/users', async (res, req) => {
  const body = await req.getBody();
  users.push(body);
  res.status(201).sendJSON({ user: body });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

### 2. Authenticated API
```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';

const router = new VeloxRouter();

// Auth middleware (runs on POST/PUT/DELETE only)
router.use((res, req, query, params, data, next) => {
  const token = req.getHeader('authorization');
  
  if (!token) {
    return res.sendError('Unauthorized', 401);
  }
  
  data.user = verifyToken(token);
  next();
}, '@method POST,PUT,DELETE');

router.post('/api/posts', async (res, req, query, params, data) => {
  const body = await req.getBody();
  
  res.status(201).sendJSON({
    post: body,
    author: data.user.name
  });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

### 3. File Upload Server
```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';
import { writeFile } from 'fs/promises';

const router = new VeloxRouter();

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

new VeloxServer().setPort(3000).setRouter(router).start();
```

---

## 🔧 Common Patterns

### Pattern 1: Error Handling
```javascript
router.post('/api/data', async (res, req) => {
  try {
    const body = await req.getBody();
    res.sendJSON({ data: body });
  } catch (err) {
    console.error('Error:', err);
    res.sendError('Invalid request', 400);
  }
});
```

### Pattern 2: Input Validation
```javascript
router.post('/api/users', async (res, req) => {
  const body = await req.getBody();
  
  if (!body.email || !body.name) {
    return res.sendError('Missing required fields', 400);
  }
  
  if (!validateEmail(body.email)) {
    return res.sendError('Invalid email format', 400);
  }
  
  res.status(201).sendJSON({ user: body });
});
```

### Pattern 3: Pagination
```javascript
router.get('/api/posts', (res, req, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const offset = (page - 1) * limit;
  
  const posts = getPosts(offset, limit);
  
  res.sendJSON({ 
    posts,
    page,
    limit,
    total: getTotalPosts()
  });
});
```

### Pattern 4: File Streaming
```javascript
router.get('/video/:id', async (res, req, query, params) => {
  try {
    // Automatically handles range requests for video seeking
    await res.sendFile(`${params.id}.mp4`, './videos');
  } catch (err) {
    res.sendError('Video not found', 404);
  }
});
```

---

## 🆘 Getting Help

- **📚 Documentation:** Check [API.md](../docs/API.md) for complete reference
- **💻 Examples:** Explore [examples/](../examples/) for working code
- **🐛 Issues:** Report bugs on GitHub
- **💬 Community:** Join discussions and get help
- **📖 Tutorials:** Work through all 8 tutorials in order

---

## 📈 Performance Tips

1. **Use typed parameters** - Validation happens during routing (faster)
2. **Enable object pooling** - Reduces GC overhead
3. **Lazy parse bodies** - Only call `getBody()` when needed
4. **Use middleware annotations** - Avoid unnecessary execution
5. **Stream large files** - Constant memory usage
6. **Cache static routes** - Enabled by default
7. **Minimize middleware** - Each middleware adds overhead
8. **Use production mode** - Disable debug logging

---

## ✅ Best Practices

### DO ✅
- ✅ Use typed parameters for automatic validation
- ✅ Parse bodies only when needed (lazy parsing)
- ✅ Use middleware for reusable logic
- ✅ Handle errors gracefully with try-catch
- ✅ Set appropriate HTTP status codes
- ✅ Validate and sanitize user input
- ✅ Use streaming for large files
- ✅ Implement authentication and authorization
- ✅ Write comprehensive tests
- ✅ Monitor performance in production

### DON'T ❌
- ❌ Don't parse body on every request
- ❌ Don't forget error handling
- ❌ Don't block the event loop
- ❌ Don't use synchronous I/O
- ❌ Don't trust user input without validation
- ❌ Don't expose secrets in code
- ❌ Don't skip security headers
- ❌ Don't ignore test coverage
- ❌ Don't deploy without benchmarking

---

## 🎓 Next Steps

### 1. Complete the Tutorials
Start with [Getting Started](01-getting-started.md) and work through all 8 tutorials in order.

### 2. Build a Real Project
Apply your knowledge by building:
- REST API for a todo app
- Blog platform with authentication
- File sharing service
- Real-time chat API

### 3. Study Advanced Topics
- Read [API Documentation](../docs/API.md)
- Explore [Performance Guide](../docs/PERFORMANCE.md)
- Review [Security Best Practices](06-authentication-security.md)

### 4. Optimize and Benchmark
- Run performance tests with autocannon
- Compare with Express/Fastify
- Optimize based on results
- Monitor in production

### 5. Contribute Back
- Share your projects
- Report bugs and suggest features
- Write tutorials or guides
- Help other developers

---

## 📊 Framework Comparison

| Feature | VeloxAPI | Express | Fastify | Koa |
|---------|----------|---------|---------|-----|
| **Dependencies** | **0** ✅ | 30+ ❌ | 20+ ❌ | 5+ ⚠️ |
| **Routing** | Radix Tree (O(log n)) ✅ | Linear (O(n)) ❌ | Radix Tree ✅ | Linear ❌ |
| **Body Parsing** | Lazy ✅ | Eager ❌ | Eager ❌ | Plugin ⚠️ |
| **Validation** | Built-in (12 types) ✅ | Manual ❌ | External ⚠️ | Manual ❌ |
| **Streaming** | Built-in ✅ | Limited ⚠️ | Plugin ⚠️ | Plugin ⚠️ |
| **Object Pooling** | Built-in ✅ | None ❌ | None ❌ | None ❌ |
| **Bundle Size** | ~50KB ✅ | ~150KB ⚠️ | ~200KB ❌ | ~80KB ⚠️ |
| **Performance** | 🔥🔥🔥 | 🔥 | 🔥🔥 | 🔥 |

---

## 🚀 Ready to Learn?

**Start your journey now:**

👉 **[Tutorial 1: Getting Started](01-getting-started.md)** - Build your first API in 15 minutes!

---

**Additional Resources:**
- [Main README](../README.md) - Project overview
- [API Reference](../docs/API.md) - Complete API documentation
- [Performance Guide](../docs/PERFORMANCE.md) - Optimization techniques
- [Changelog](../CHANGELOG.md) - Version history
- [Examples](../examples/) - Working code samples

---

*Built with ❤️ for performance | VeloxAPI v0.3.0*
