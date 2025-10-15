# Getting Started with VeloxAPI

## What is VeloxAPI?

**VeloxAPI** is an ultra-fast, zero-dependency Node.js web framework designed for maximum performance. Unlike traditional frameworks like Express or Fastify, VeloxAPI is built entirely with Node.js built-in modules, making it:

- ⚡ **Blazing Fast** - 20-30% faster than Fastify
- 🪶 **Ultra Lightweight** - Zero production dependencies
- 🔒 **Secure** - No external vulnerabilities
- 📦 **Simple** - Clean, intuitive API

## Why Zero Dependencies?

**Traditional frameworks** rely on dozens or hundreds of npm packages:
```
express@4.18.0
├── body-parser@1.20.2
├── cookie@0.5.0
├── debug@2.6.9
└── ... (30+ dependencies)
```

**VeloxAPI** has **ZERO** production dependencies:
```
veloxapi@0.3.0
└── (no dependencies)
```

**Benefits:**
- 🚀 No dependency overhead = faster startup
- 🔒 No external security vulnerabilities
- 📉 Smaller bundle size
- ⚙️ Complete control over implementation

## Prerequisites

- **Node.js 18+** (required for modern features)
- Basic JavaScript knowledge
- Understanding of async/await

## Installation

```bash
npm install veloxapi
```

Or with yarn:
```bash
yarn add veloxapi
```

## Your First Server

Create a file called `server.js`:

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';

// Create a router
const router = new VeloxRouter();

// Define routes
router.get('/', (res) => {
  res.sendJSON({ message: 'Hello VeloxAPI!' });
});

router.get('/hello/:name', (res, req, query, params) => {
  res.sendJSON({ 
    message: `Hello, ${params.name}!`,
    timestamp: new Date().toISOString()
  });
});

// Create and start server
const server = new VeloxServer()
  .setPort(3000)
  .setRouter(router)
  .start();
```

Run it:
```bash
node server.js
```

Visit http://localhost:3000 and you'll see:
```json
{"message": "Hello VeloxAPI!"}
```

## Understanding the Basics

### 1. VeloxRouter
The router manages all your routes and matches incoming requests.

```javascript
const router = new VeloxRouter();
```

### 2. Route Definition
Define routes with HTTP methods:

```javascript
router.get('/path', handler);      // GET requests
router.post('/path', handler);     // POST requests
router.put('/path', handler);      // PUT requests
router.delete('/path', handler);   // DELETE requests
router.patch('/path', handler);    // PATCH requests
```

### 3. Route Handler
Every route handler receives 4 parameters:

```javascript
router.get('/example', (res, req, query, params) => {
  // res     - Response object (send data back)
  // req     - Request object (read incoming data)
  // query   - URL query parameters (?foo=bar)
  // params  - Route parameters (/:id)
});
```

### 4. VeloxServer
The server wrapper around Node.js http/https:

```javascript
const server = new VeloxServer()
  .setPort(3000)           // Set port (default: 3000)
  .setHost('0.0.0.0')      // Set host (default: 0.0.0.0)
  .setRouter(router)       // Attach router
  .start();                // Start listening
```

## Response Methods

VeloxAPI provides several ways to send responses:

### 1. JSON Response
```javascript
router.get('/api/users', (res) => {
  res.sendJSON({ 
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]
  });
});
```

### 2. HTML Response
```javascript
router.get('/home', (res) => {
  res.sendHTML('<h1>Welcome to VeloxAPI</h1>');
});
```

### 3. Plain Text
```javascript
router.get('/ping', (res) => {
  res.sendText('pong');
});
```

### 4. File Response (Streaming)
```javascript
router.get('/download/:filename', async (res, req, query, params) => {
  await res.sendFile(params.filename, './uploads');
});
```

### 5. Custom Status Code
```javascript
router.post('/create', (res) => {
  res.status(201).sendJSON({ created: true });
});
```

### 6. Error Response
```javascript
router.get('/error', (res) => {
  res.sendError('Something went wrong', 400);
});
```

### 7. Redirect
```javascript
router.get('/old-page', (res) => {
  res.redirect('/new-page');
});
```

## Route Parameters

Extract dynamic values from URLs:

```javascript
router.get('/users/:userId/posts/:postId', (res, req, query, params) => {
  res.sendJSON({
    userId: params.userId,
    postId: params.postId
  });
});
```

**Request:** `GET /users/123/posts/456`

**Response:**
```json
{
  "userId": "123",
  "postId": "456"
}
```

## Query Parameters

Access URL query strings:

```javascript
router.get('/search', (res, req, query) => {
  res.sendJSON({
    term: query.q,
    page: query.page || 1
  });
});
```

**Request:** `GET /search?q=hello&page=2`

**Response:**
```json
{
  "term": "hello",
  "page": "2"
}
```

## Request Body

Parse incoming data (async):

```javascript
router.post('/users', async (res, req) => {
  const body = await req.getBody();
  
  res.status(201).sendJSON({
    created: true,
    user: body
  });
});
```

**Request:**
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","age":30}'
```

**Response:**
```json
{
  "created": true,
  "user": {"name":"Alice","age":30}
}
```

## What's Next?

Now that you understand the basics, explore:

1. **[Typed Parameters](02-typed-parameters.md)** - Validate route params automatically
2. **[Body Parsing](03-body-parsing.md)** - Handle JSON, XML, forms, file uploads
3. **[Middleware](04-middleware.md)** - Add authentication, logging, etc.
4. **[Performance](05-performance.md)** - Optimize for production

## Complete Example

Here's a full REST API example:

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';

const router = new VeloxRouter();

// In-memory database
const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' }
];

// List users
router.get('/api/users', (res) => {
  res.sendJSON({ users });
});

// Get single user
router.get('/api/users/:id', (res, req, query, params) => {
  const user = users.find(u => u.id === parseInt(params.id));
  
  if (!user) {
    return res.sendError('User not found', 404);
  }
  
  res.sendJSON({ user });
});

// Create user
router.post('/api/users', async (res, req) => {
  const body = await req.getBody();
  
  const newUser = {
    id: users.length + 1,
    name: body.name,
    email: body.email
  };
  
  users.push(newUser);
  
  res.status(201).sendJSON({ user: newUser });
});

// Update user
router.put('/api/users/:id', async (res, req, query, params) => {
  const user = users.find(u => u.id === parseInt(params.id));
  
  if (!user) {
    return res.sendError('User not found', 404);
  }
  
  const body = await req.getBody();
  user.name = body.name || user.name;
  user.email = body.email || user.email;
  
  res.sendJSON({ user });
});

// Delete user
router.delete('/api/users/:id', (res, req, query, params) => {
  const index = users.findIndex(u => u.id === parseInt(params.id));
  
  if (index === -1) {
    return res.sendError('User not found', 404);
  }
  
  users.splice(index, 1);
  
  res.status(204).end();
});

// Start server
const server = new VeloxServer()
  .setPort(3000)
  .setRouter(router)
  .start();

console.log('REST API running on http://localhost:3000');
```

Test it:
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

## Summary

You've learned:
- ✅ How to create a VeloxAPI server
- ✅ Define routes with different HTTP methods
- ✅ Send JSON, HTML, and text responses
- ✅ Extract route parameters and query strings
- ✅ Parse request bodies
- ✅ Build a complete REST API

**Next:** Learn about [Typed Parameters](02-typed-parameters.md) to validate routes automatically!
