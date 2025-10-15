# Testing Strategies

Learn how to write comprehensive tests for your VeloxAPI applications using Jest and Node.js testing tools.

## Table of Contents
1. [Testing Setup](#testing-setup)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [API Endpoint Testing](#api-endpoint-testing)
5. [Testing with Authentication](#testing-with-authentication)
6. [Testing File Uploads](#testing-file-uploads)
7. [Performance Testing](#performance-testing)

---

## Testing Setup

### Install Jest

```bash
npm install --save-dev jest
```

### Configure package.json

```json
{
  "type": "module",
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/.bin/jest",
    "test:watch": "node --experimental-vm-modules node_modules/.bin/jest --watch",
    "test:coverage": "node --experimental-vm-modules node_modules/.bin/jest --coverage"
  }
}
```

### Jest Configuration (jest.config.js)

```javascript
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js']
};
```

---

## Unit Testing

### Test Router Logic

```javascript
// __tests__/router.test.js
import { describe, test, expect } from '@jest/globals';
import { VeloxRouter } from 'veloxapi';

describe('VeloxRouter', () => {
  test('should create router instance', () => {
    const router = new VeloxRouter();
    expect(router).toBeDefined();
  });
  
  test('should add GET route', () => {
    const router = new VeloxRouter();
    const handler = (res) => res.sendJSON({ ok: true });
    
    router.get('/test', handler);
    // Router should have the route registered
    expect(router).toBeDefined();
  });
  
  test('should handle typed parameters', () => {
    const router = new VeloxRouter();
    
    router.get('/users/:id=number', (res, req, query, params) => {
      expect(typeof params.id).toBe('number');
      res.sendJSON({ userId: params.id });
    });
  });
});
```

### Test Validation Functions

```javascript
// utils/validators.js
export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validatePassword(password) {
  return password.length >= 8;
}

// __tests__/validators.test.js
import { describe, test, expect } from '@jest/globals';
import { validateEmail, validatePassword } from '../utils/validators.js';

describe('Validators', () => {
  describe('validateEmail', () => {
    test('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });
    
    test('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });
  
  describe('validatePassword', () => {
    test('should validate correct password', () => {
      expect(validatePassword('password123')).toBe(true);
    });
    
    test('should reject short password', () => {
      expect(validatePassword('pass')).toBe(false);
    });
  });
});
```

---

## Integration Testing

### Test Server Lifecycle

```javascript
// __tests__/server.test.js
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { VeloxServer, VeloxRouter } from 'veloxapi';

describe('VeloxServer Integration', () => {
  let server;
  const port = 3001;
  
  beforeAll(() => {
    const router = new VeloxRouter();
    
    router.get('/health', (res) => {
      res.sendJSON({ status: 'ok' });
    });
    
    server = new VeloxServer()
      .setPort(port)
      .setRouter(router)
      .start();
  });
  
  afterAll(() => {
    server.stop();
  });
  
  test('should start server', async () => {
    const response = await fetch(`http://localhost:${port}/health`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
  });
});
```

---

## API Endpoint Testing

### Test REST API Endpoints

```javascript
// __tests__/api.test.js
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { VeloxServer, VeloxRouter } from 'veloxapi';

describe('REST API Endpoints', () => {
  let server;
  const port = 3002;
  const baseUrl = `http://localhost:${port}`;
  
  // Mock data
  const users = [];
  
  beforeAll(() => {
    const router = new VeloxRouter();
    
    // GET /api/users
    router.get('/api/users', (res) => {
      res.sendJSON({ users });
    });
    
    // GET /api/users/:id
    router.get('/api/users/:id=number', (res, req, query, params) => {
      const user = users.find(u => u.id === params.id);
      
      if (!user) {
        return res.sendError('User not found', 404);
      }
      
      res.sendJSON({ user });
    });
    
    // POST /api/users
    router.post('/api/users', async (res, req) => {
      const body = await req.getBody();
      
      const user = {
        id: users.length + 1,
        ...body
      };
      
      users.push(user);
      res.status(201).sendJSON({ user });
    });
    
    server = new VeloxServer()
      .setPort(port)
      .setRouter(router)
      .start();
  });
  
  afterAll(() => {
    server.stop();
  });
  
  test('GET /api/users should return empty array', async () => {
    const response = await fetch(`${baseUrl}/api/users`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.users).toEqual([]);
  });
  
  test('POST /api/users should create user', async () => {
    const newUser = {
      name: 'Alice',
      email: 'alice@example.com'
    };
    
    const response = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.user.id).toBe(1);
    expect(data.user.name).toBe('Alice');
  });
  
  test('GET /api/users/:id should return user', async () => {
    const response = await fetch(`${baseUrl}/api/users/1`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.user.name).toBe('Alice');
  });
  
  test('GET /api/users/:id should return 404 for missing user', async () => {
    const response = await fetch(`${baseUrl}/api/users/999`);
    
    expect(response.status).toBe(404);
  });
});
```

### Test Query Parameters

```javascript
describe('Query Parameters', () => {
  let server;
  const port = 3003;
  
  beforeAll(() => {
    const router = new VeloxRouter();
    
    router.get('/api/search', (res, req, query) => {
      res.sendJSON({
        query: query.q,
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 10
      });
    });
    
    server = new VeloxServer().setPort(port).setRouter(router).start();
  });
  
  afterAll(() => {
    server.stop();
  });
  
  test('should parse query parameters', async () => {
    const response = await fetch(`http://localhost:${port}/api/search?q=test&page=2&limit=20`);
    const data = await response.json();
    
    expect(data.query).toBe('test');
    expect(data.page).toBe(2);
    expect(data.limit).toBe(20);
  });
});
```

---

## Testing with Authentication

### Test Protected Routes

```javascript
// __tests__/auth.test.js
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { VeloxServer, VeloxRouter } from 'veloxapi';

describe('Authentication', () => {
  let server;
  const port = 3004;
  const baseUrl = `http://localhost:${port}`;
  const validToken = 'secret-token-123';
  
  beforeAll(() => {
    const router = new VeloxRouter();
    
    // Auth middleware
    router.use((res, req, query, params, data, next) => {
      const authHeader = req.getHeader('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.sendError('Unauthorized', 401);
      }
      
      const token = authHeader.replace('Bearer ', '');
      
      if (token !== validToken) {
        return res.sendError('Invalid token', 401);
      }
      
      data.userId = 1;
      next();
    }, '@method POST,PUT,DELETE');
    
    // Public route
    router.get('/api/public', (res) => {
      res.sendJSON({ message: 'Public data' });
    });
    
    // Protected route
    router.post('/api/protected', (res, req, query, params, data) => {
      res.sendJSON({ 
        message: 'Protected data',
        userId: data.userId
      });
    });
    
    server = new VeloxServer().setPort(port).setRouter(router).start();
  });
  
  afterAll(() => {
    server.stop();
  });
  
  test('GET /api/public should work without auth', async () => {
    const response = await fetch(`${baseUrl}/api/public`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.message).toBe('Public data');
  });
  
  test('POST /api/protected should fail without token', async () => {
    const response = await fetch(`${baseUrl}/api/protected`, {
      method: 'POST'
    });
    
    expect(response.status).toBe(401);
  });
  
  test('POST /api/protected should fail with invalid token', async () => {
    const response = await fetch(`${baseUrl}/api/protected`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    
    expect(response.status).toBe(401);
  });
  
  test('POST /api/protected should work with valid token', async () => {
    const response = await fetch(`${baseUrl}/api/protected`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.userId).toBe(1);
  });
});
```

---

## Testing File Uploads

### Test Multipart File Upload

```javascript
// __tests__/upload.test.js
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { VeloxServer, VeloxRouter } from 'veloxapi';
import FormData from 'form-data';
import { readFile } from 'fs/promises';

describe('File Upload', () => {
  let server;
  const port = 3005;
  const baseUrl = `http://localhost:${port}`;
  
  beforeAll(() => {
    const router = new VeloxRouter();
    
    router.post('/upload', async (res, req) => {
      const body = await req.getBody();
      
      if (!body.files || body.files.length === 0) {
        return res.sendError('No files uploaded', 400);
      }
      
      const file = body.files[0];
      
      res.status(201).sendJSON({
        filename: file.filename,
        size: file.data.length,
        mimetype: file.mimetype
      });
    });
    
    server = new VeloxServer().setPort(port).setRouter(router).start();
  });
  
  afterAll(() => {
    server.stop();
  });
  
  test('should upload file successfully', async () => {
    const form = new FormData();
    const fileContent = Buffer.from('test file content');
    
    form.append('file', fileContent, {
      filename: 'test.txt',
      contentType: 'text/plain'
    });
    
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.filename).toBe('test.txt');
    expect(data.size).toBeGreaterThan(0);
  });
  
  test('should reject request without file', async () => {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST'
    });
    
    expect(response.status).toBe(400);
  });
});
```

---

## Performance Testing

### Load Testing with autocannon

```bash
# Install autocannon
npm install -g autocannon

# Run load test
autocannon -c 100 -d 30 http://localhost:3000/api/status
```

### Benchmark in Tests

```javascript
// __tests__/performance.test.js
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { VeloxServer, VeloxRouter } from 'veloxapi';

describe('Performance', () => {
  let server;
  const port = 3006;
  
  beforeAll(() => {
    const router = new VeloxRouter();
    
    router.get('/api/benchmark', (res) => {
      res.sendJSON({ timestamp: Date.now() });
    });
    
    server = new VeloxServer().setPort(port).setRouter(router).start();
  });
  
  afterAll(() => {
    server.stop();
  });
  
  test('should handle 100 concurrent requests', async () => {
    const requests = [];
    
    for (let i = 0; i < 100; i++) {
      requests.push(fetch(`http://localhost:${port}/api/benchmark`));
    }
    
    const start = Date.now();
    const responses = await Promise.all(requests);
    const duration = Date.now() - start;
    
    // All requests should succeed
    responses.forEach(res => {
      expect(res.status).toBe(200);
    });
    
    // Should complete in reasonable time (< 1 second)
    expect(duration).toBeLessThan(1000);
  });
  
  test('should have low response time', async () => {
    const iterations = 10;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await fetch(`http://localhost:${port}/api/benchmark`);
      times.push(Date.now() - start);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    
    // Average response time should be < 50ms
    expect(avgTime).toBeLessThan(50);
  });
});
```

### Memory Leak Testing

```javascript
describe('Memory Usage', () => {
  test('should not leak memory on repeated requests', async () => {
    const router = new VeloxRouter();
    router.get('/test', (res) => res.sendJSON({ ok: true }));
    
    const server = new VeloxServer().setPort(3007).setRouter(router).start();
    
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Make 1000 requests
    for (let i = 0; i < 1000; i++) {
      await fetch('http://localhost:3007/test');
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;
    
    // Memory growth should be minimal (< 10MB)
    expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
    
    server.stop();
  });
});
```

---

## Test Coverage

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Coverage Report Example

```
---------------------------|---------|----------|---------|---------|
File                       | % Stmts | % Branch | % Funcs | % Lines |
---------------------------|---------|----------|---------|---------|
All files                  |   95.12 |    88.23 |   92.45 |   95.12 |
 lib/core                  |   96.45 |    90.12 |   94.23 |   96.45 |
  server.js                |   97.23 |    91.34 |   95.12 |   97.23 |
  request.js               |   95.67 |    89.45 |   93.45 |   95.67 |
  response.js              |   96.12 |    89.67 |   94.12 |   96.12 |
 lib/utils                 |   93.45 |    85.23 |   89.12 |   93.45 |
  radix-tree.js            |   94.23 |    86.45 |   90.34 |   94.23 |
  validators.js            |   92.34 |    83.56 |   87.23 |   92.34 |
---------------------------|---------|----------|---------|---------|
```

---

## Best Practices

### 1. Use Test Helpers

```javascript
// tests/helpers.js
export function createTestServer(router, port = 3000) {
  const server = new VeloxServer()
    .setPort(port)
    .setRouter(router)
    .start();
  
  return {
    server,
    url: `http://localhost:${port}`,
    stop: () => server.stop()
  };
}

// Usage in tests
import { createTestServer } from './helpers.js';

test('example', () => {
  const router = new VeloxRouter();
  router.get('/test', (res) => res.sendJSON({ ok: true }));
  
  const { server, url, stop } = createTestServer(router, 3008);
  
  // Run tests...
  
  stop();
});
```

### 2. Mock External Services

```javascript
// __tests__/external.test.js
import { jest } from '@jest/globals';

describe('External API', () => {
  test('should handle external API failure', async () => {
    // Mock fetch
    global.fetch = jest.fn(() => 
      Promise.reject(new Error('API unavailable'))
    );
    
    const router = new VeloxRouter();
    
    router.get('/external', async (res) => {
      try {
        await fetch('https://api.example.com/data');
        res.sendJSON({ data: 'success' });
      } catch (err) {
        res.sendError('External API error', 503);
      }
    });
    
    const { url, stop } = createTestServer(router, 3009);
    
    const response = await fetch(`${url}/external`);
    expect(response.status).toBe(503);
    
    stop();
  });
});
```

### 3. Test Error Scenarios

```javascript
describe('Error Handling', () => {
  test('should handle invalid JSON', async () => {
    const router = new VeloxRouter();
    
    router.post('/api/data', async (res, req) => {
      try {
        const body = await req.getBody();
        res.sendJSON({ data: body });
      } catch (err) {
        res.sendError('Invalid JSON', 400);
      }
    });
    
    const { url, stop } = createTestServer(router, 3010);
    
    const response = await fetch(`${url}/api/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json {'
    });
    
    expect(response.status).toBe(400);
    
    stop();
  });
});
```

---

## Next Steps

- **[Performance Guide](../docs/PERFORMANCE.md)** - Production optimization
- **[Authentication & Security](./06-authentication-security.md)** - Secure your API
- **[File Streaming](./07-file-streaming-uploads.md)** - Test file operations

---

**Testing Checklist:**
- ✅ Write unit tests for utilities
- ✅ Write integration tests for API endpoints
- ✅ Test authentication and authorization
- ✅ Test file uploads and downloads
- ✅ Test error scenarios
- ✅ Test query parameters
- ✅ Test middleware chains
- ✅ Run performance benchmarks
- ✅ Maintain >90% code coverage
- ✅ Use CI/CD for automated testing
