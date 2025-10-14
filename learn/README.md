# VeloxAPI Learning Center

Welcome to the VeloxAPI tutorials! Learn how to build ultra-fast Node.js APIs from scratch.

## 📚 Tutorial Index

### 1. [Getting Started](01-getting-started.md)
**What you'll learn:**
- What is VeloxAPI and why zero dependencies?
- Create your first server
- Define routes and handlers
- Send JSON, HTML, and file responses
- Build a complete REST API

**Time:** 15 minutes  
**Level:** Beginner

---

### 2. [Typed Parameters](02-typed-parameters.md)
**What you'll learn:**
- Automatic parameter validation
- 12 built-in validators (number, email, uuid, slug, etc.)
- Type conversion (string → number, boolean)
- Fast-fail validation for better performance
- Real-world e-commerce examples

**Time:** 20 minutes  
**Level:** Beginner

---

### 3. [Body Parsing](03-body-parsing.md)
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

### 4. [Middleware](04-middleware.md)
**What you'll learn:**
- What is middleware and when to use it
- Middleware annotations (@method, @secure)
- Authentication middleware
- CORS, rate limiting, logging
- Error handling middleware
- Chain multiple middleware

**Time:** 30 minutes  
**Level:** Intermediate

---

### 5. [Performance Optimization](05-performance.md) ⚡
**What you'll learn:**
- Object pooling (20-30% faster)
- True streaming for large uploads
- Route caching strategies
- Memory optimization
- Production benchmarks
- Compare with Express/Fastify

**Time:** 35 minutes  
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
EOF

# Run it
node server.js
```

Visit http://localhost:3000

---

## 📖 Learning Path

### For Beginners
1. ✅ [Getting Started](01-getting-started.md)
2. ✅ [Typed Parameters](02-typed-parameters.md)
3. ✅ [Body Parsing](03-body-parsing.md)

### For Intermediate Developers
1. ✅ [Middleware](04-middleware.md)
2. ✅ [Performance](05-performance.md)

### For Advanced Users
- Read the [API Documentation](../docs/API.md)
- Explore [Performance Guide](../docs/PERFORMANCE.md)
- Check [Benchmarks](../benchmarks/)

---

## 💡 Key Concepts

### Zero Dependencies
VeloxAPI has **ZERO** production dependencies. Everything is built with Node.js built-in modules.

**Why?**
- ⚡ Faster startup (no dependency loading)
- 🔒 No external vulnerabilities
- 📦 Smaller bundle size
- 🎯 Complete control

### Lazy Parsing
Bodies are only parsed when you call `req.getBody()`.

**Why?**
- ⚡ Better performance (no wasted CPU)
- 💾 Memory efficient
- 🎯 Parse only what you need

### Radix Tree Routing
O(log n) route matching using a radix tree.

**Why?**
- ⚡ 10x faster than linear search
- 📊 Scales to thousands of routes
- 🗂️ Smart route caching

### Typed Parameters
Routes validate parameters automatically: `/users/:id=number`

**Why?**
- ✅ Automatic validation
- 🔄 Type conversion
- 🚫 404 for invalid inputs
- 🧹 No boilerplate code

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

### 2. File Upload Server
```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';
import { writeFile } from 'fs/promises';

const router = new VeloxRouter();

router.post('/upload', async (res, req) => {
  const body = await req.getBody();
  
  for (const file of body.files) {
    await writeFile(`./uploads/${file.filename}`, file.data);
  }
  
  res.sendJSON({ uploaded: body.files.length });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

### 3. Authenticated API
```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';

const router = new VeloxRouter();

// Auth middleware
router.use((res, req, query, params, data, next) => {
  const token = req.getHeader('authorization');
  
  if (!token) {
    return res.sendError('No token', 401);
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

---

## 🔧 Common Patterns

### Pattern 1: Error Handling
```javascript
router.post('/api/data', async (res, req) => {
  try {
    const body = await req.getBody();
    res.sendJSON({ data: body });
  } catch (err) {
    res.sendError('Invalid request', 400);
  }
});
```

### Pattern 2: Validation
```javascript
router.post('/api/users', async (res, req) => {
  const body = await req.getBody();
  
  if (!body.email || !body.name) {
    return res.sendError('Missing fields', 400);
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
    total: getTotalPosts()
  });
});
```

---

## 🆘 Getting Help

- **Documentation:** Check [API.md](../docs/API.md)
- **Examples:** Explore [examples/](../examples/)
- **Issues:** Report bugs on GitHub
- **Community:** Join discussions

---

## 📈 Performance Tips

1. **Use typed parameters** - Validation happens during routing
2. **Enable object pooling** - 20-30% faster
3. **Lazy parse bodies** - Only call `getBody()` when needed
4. **Use middleware annotations** - Avoid unnecessary execution
5. **Cache static routes** - Enabled by default

---

## ✅ Best Practices

### DO ✅
- Use typed parameters for validation
- Parse bodies only when needed
- Use middleware for reusable logic
- Handle errors gracefully
- Set appropriate status codes

### DON'T ❌
- Don't parse body on every request
- Don't forget error handling
- Don't block the event loop
- Don't use synchronous I/O
- Don't trust user input

---

## 🎓 Next Steps

1. **Complete all tutorials** - Follow the learning path
2. **Build a project** - Create a real API
3. **Read the docs** - Explore advanced features
4. **Optimize** - Use performance tools
5. **Contribute** - Share your experience

---

## 📊 Framework Comparison

| Feature | VeloxAPI | Express | Fastify |
|---------|----------|---------|---------|
| Dependencies | **0** | 30+ | 20+ |
| Routing | Radix Tree (O(log n)) | Linear (O(n)) | Radix Tree |
| Body Parsing | Lazy | Eager | Eager |
| Validation | Built-in | Manual | External |
| Performance | 🔥🔥🔥 | 🔥 | 🔥🔥 |

---

## 🚀 Ready to Learn?

Start with **[Getting Started](01-getting-started.md)** and build your first ultra-fast API!

---

*Built with ❤️ by the VeloxAPI team*
