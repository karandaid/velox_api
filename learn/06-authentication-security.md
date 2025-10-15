# Authentication & Security

Learn how to implement secure authentication and protect your VeloxAPI applications.

## Table of Contents
1. [Token-Based Authentication](#token-based-authentication)
2. [JWT Authentication](#jwt-authentication)
3. [Session Management](#session-management)
4. [Security Best Practices](#security-best-practices)
5. [Rate Limiting](#rate-limiting)
6. [Input Validation](#input-validation)

---

## Token-Based Authentication

The simplest authentication method using Bearer tokens.

### Basic Token Auth

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';
import crypto from 'crypto';

const router = new VeloxRouter();

// Mock user database
const users = new Map([
  ['alice@example.com', { 
    id: 1, 
    email: 'alice@example.com', 
    password: 'hashed_password_here',
    token: 'secret-token-alice' 
  }]
]);

// Store active tokens
const tokens = new Map([
  ['secret-token-alice', { userId: 1, role: 'admin', createdAt: Date.now() }]
]);

// Auth middleware
router.use((res, req, query, params, data, next) => {
  const authHeader = req.getHeader('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.sendError('Missing or invalid authorization header', 401);
  }
  
  const token = authHeader.replace('Bearer ', '');
  const tokenData = tokens.get(token);
  
  if (!tokenData) {
    return res.sendError('Invalid token', 401);
  }
  
  // Token found - attach user to request
  data.userId = tokenData.userId;
  data.role = tokenData.role;
  next();
}, '@method POST,PUT,DELETE,PATCH');

// Protected route
router.post('/api/posts', async (res, req, query, params, data) => {
  const body = await req.getBody();
  
  res.status(201).sendJSON({
    post: {
      ...body,
      authorId: data.userId,
      createdAt: Date.now()
    }
  });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

**Test it:**
```bash
# Without token (fails)
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"My Post"}'

# With token (works)
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer secret-token-alice" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Post"}'
```

---

## JWT Authentication

Industry-standard JWT (JSON Web Tokens) for stateless auth.

### JWT Implementation

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';
import crypto from 'crypto';

const router = new VeloxRouter();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// JWT Helper Functions
function createJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJWT(token) {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
    return payload;
  } catch (err) {
    return null;
  }
}

// Mock users database
const users = [
  { id: 1, email: 'alice@example.com', password: 'password123', role: 'admin' },
  { id: 2, email: 'bob@example.com', password: 'password456', role: 'user' }
];

// Login endpoint
router.post('/api/auth/login', async (res, req) => {
  const { email, password } = await req.getBody();
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.sendError('Invalid credentials', 401);
  }
  
  // Create JWT token
  const token = createJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 3600  // Expires in 1 hour
  });
  
  res.sendJSON({ 
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
});

// JWT Auth Middleware
router.use((res, req, query, params, data, next) => {
  const authHeader = req.getHeader('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.sendError('Missing authorization token', 401);
  }
  
  const token = authHeader.replace('Bearer ', '');
  const payload = verifyJWT(token);
  
  if (!payload) {
    return res.sendError('Invalid or expired token', 401);
  }
  
  data.user = payload;
  next();
}, '@method POST,PUT,DELETE,PATCH');

// Protected route
router.post('/api/posts', async (res, req, query, params, data) => {
  const body = await req.getBody();
  
  res.status(201).sendJSON({
    post: {
      ...body,
      authorId: data.user.userId,
      author: data.user.email,
      createdAt: Date.now()
    }
  });
});

// Refresh token endpoint
router.post('/api/auth/refresh', (res, req, query, params, data) => {
  const newToken = createJWT({
    userId: data.user.userId,
    email: data.user.email,
    role: data.user.role,
    exp: Math.floor(Date.now() / 1000) + 3600
  });
  
  res.sendJSON({ token: newToken });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

**Test JWT:**
```bash
# Login to get JWT
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'

# Use JWT in requests (replace TOKEN with your JWT)
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Post"}'

# Refresh token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## Session Management

Cookie-based sessions for traditional web apps.

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';
import crypto from 'crypto';

const router = new VeloxRouter();

// Session store (use Redis in production)
const sessions = new Map();

// Generate session ID
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

// Login endpoint
router.post('/auth/login', async (res, req) => {
  const { email, password } = await req.getBody();
  
  // Validate credentials (simplified)
  if (email === 'alice@example.com' && password === 'password123') {
    const sessionId = generateSessionId();
    
    // Store session
    sessions.set(sessionId, {
      userId: 1,
      email: email,
      createdAt: Date.now()
    });
    
    // Set cookie
    res.setCookie('sessionId', sessionId, {
      httpOnly: true,
      secure: req.isSecure(),
      sameSite: 'Strict',
      maxAge: 3600  // 1 hour
    });
    
    return res.sendJSON({ message: 'Logged in successfully' });
  }
  
  res.sendError('Invalid credentials', 401);
});

// Session middleware
router.use((res, req, query, params, data, next) => {
  const cookies = req.getCookies();
  const sessionId = cookies.sessionId;
  
  if (!sessionId) {
    return res.sendError('No session found', 401);
  }
  
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.sendError('Invalid session', 401);
  }
  
  data.session = session;
  next();
}, '@path /api/*');

// Logout endpoint
router.post('/auth/logout', (res, req) => {
  const cookies = req.getCookies();
  const sessionId = cookies.sessionId;
  
  if (sessionId) {
    sessions.delete(sessionId);
  }
  
  res.setCookie('sessionId', '', { maxAge: 0 });
  res.sendJSON({ message: 'Logged out successfully' });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

---

## Security Best Practices

### 1. Security Headers

```javascript
router.use((res, req, query, params, data, next) => {
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // HTTPS enforcement
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  next();
});
```

### 2. Password Hashing

```javascript
import crypto from 'crypto';

// Hash password with salt
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
  
  return `${salt}:${hash}`;
}

// Verify password
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
  
  return hash === verifyHash;
}

// Usage in signup
router.post('/auth/signup', async (res, req) => {
  const { email, password } = await req.getBody();
  
  const hashedPassword = hashPassword(password);
  
  // Store user with hashed password
  users.set(email, {
    email,
    password: hashedPassword
  });
  
  res.status(201).sendJSON({ message: 'User created' });
});

// Usage in login
router.post('/auth/login', async (res, req) => {
  const { email, password } = await req.getBody();
  
  const user = users.get(email);
  
  if (!user || !verifyPassword(password, user.password)) {
    return res.sendError('Invalid credentials', 401);
  }
  
  // Create session/token...
});
```

### 3. CORS Configuration

```javascript
router.use((res, req, query, params, data, next) => {
  const origin = req.getHeader('origin');
  const allowedOrigins = ['https://example.com', 'https://app.example.com'];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.getMethod() === 'OPTIONS') {
    return res.status(204).send();
  }
  
  next();
});
```

---

## Rate Limiting

Protect your API from abuse with rate limiting.

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';

const router = new VeloxRouter();

// Simple rate limiter (use Redis in production)
const rateLimits = new Map();

function rateLimit({ windowMs = 60000, maxRequests = 100 } = {}) {
  return (res, req, query, params, data, next) => {
    const ip = req.getHeader('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    if (!rateLimits.has(ip)) {
      rateLimits.set(ip, []);
    }
    
    const requests = rateLimits.get(ip);
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return res.sendError('Too many requests', 429);
    }
    
    recentRequests.push(now);
    rateLimits.set(ip, recentRequests);
    
    next();
  };
}

// Apply rate limiting
router.use(rateLimit({ windowMs: 60000, maxRequests: 10 }), '@path /api/*');

router.get('/api/data', (res) => {
  res.sendJSON({ data: 'Hello World' });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

---

## Input Validation

Validate and sanitize user input to prevent injection attacks.

```javascript
// Validation helpers
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags
  return input.replace(/<[^>]*>/g, '');
}

// Validation middleware
router.post('/api/users', async (res, req) => {
  const body = await req.getBody();
  const errors = [];
  
  // Validate email
  if (!body.email || !validateEmail(body.email)) {
    errors.push('Invalid email address');
  }
  
  // Validate password
  if (!body.password || !validatePassword(body.password)) {
    errors.push('Password must be at least 8 characters with uppercase, lowercase, and number');
  }
  
  // Validate name
  if (!body.name || body.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (errors.length > 0) {
    return res.status(400).sendJSON({ errors });
  }
  
  // Sanitize input
  const sanitizedUser = {
    name: sanitizeInput(body.name),
    email: body.email.toLowerCase().trim(),
    password: body.password  // Hash before storing!
  };
  
  res.status(201).sendJSON({ user: sanitizedUser });
});
```

---

## Complete Secure API Example

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';
import crypto from 'crypto';

const router = new VeloxRouter();

// Security headers
router.use((res, req, query, params, data, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});

// Rate limiting
const rateLimits = new Map();
router.use((res, req, query, params, data, next) => {
  const ip = req.getHeader('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, []);
  }
  
  const requests = rateLimits.get(ip).filter(time => now - time < 60000);
  
  if (requests.length >= 100) {
    return res.sendError('Too many requests', 429);
  }
  
  requests.push(now);
  rateLimits.set(ip, requests);
  next();
});

// JWT authentication
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

router.use((res, req, query, params, data, next) => {
  const authHeader = req.getHeader('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.sendError('Unauthorized', 401);
  }
  
  const token = authHeader.replace('Bearer ', '');
  // Verify JWT (implementation from above)
  
  data.user = { userId: 1, role: 'user' };  // From token
  next();
}, '@method POST,PUT,DELETE');

// Protected API endpoints
router.get('/api/profile', (res, req, query, params, data) => {
  res.sendJSON({ userId: data.user.userId });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

---

## Next Steps

- **[File Streaming & Uploads](./07-file-streaming-uploads.md)** - Handle file operations
- **[Testing Strategies](./08-testing-strategies.md)** - Test your secure API
- **[API Reference](../docs/API.md)** - Complete API documentation

---

**Security Checklist:**
- ✅ Use HTTPS in production
- ✅ Hash passwords with salt
- ✅ Implement rate limiting
- ✅ Validate all user input
- ✅ Set security headers
- ✅ Use secure session/token storage
- ✅ Implement CORS properly
- ✅ Log security events
- ✅ Keep dependencies updated (zero for VeloxAPI!)
