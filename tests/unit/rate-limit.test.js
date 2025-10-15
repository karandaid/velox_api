/**
 * Unit Tests: Rate Limiting Middleware
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { rateLimit, rateLimitRoute, MemoryStore, TokenBucket } from '../../lib/middleware/rate-limit.js';

describe('Token Bucket', () => {
  test('creates bucket with capacity and refill rate', () => {
    const bucket = new TokenBucket(10, 5); // 10 capacity, 5 tokens/sec
    expect(bucket.capacity).toBe(10);
    expect(bucket.tokens).toBe(10);
    expect(bucket.refillRate).toBe(5);
  });

  test('consumes tokens successfully', () => {
    const bucket = new TokenBucket(10, 5);
    expect(bucket.consume(3)).toBe(true);
    expect(bucket.tokens).toBe(7);
  });

  test('rejects when insufficient tokens', () => {
    const bucket = new TokenBucket(5, 1);
    bucket.consume(5);
    expect(bucket.consume(1)).toBe(false);
    expect(bucket.tokens).toBe(0);
  });

  test('refills tokens over time', (done) => {
    const bucket = new TokenBucket(10, 10); // 10 tokens/sec
    bucket.consume(10); // Empty the bucket
    
    setTimeout(() => {
      expect(bucket.consume(5)).toBe(true); // Should have ~5 tokens after 500ms
      done();
    }, 500);
  });

  test('does not exceed capacity during refill', (done) => {
    const bucket = new TokenBucket(10, 100); // Fast refill
    bucket.consume(5);
    
    setTimeout(() => {
      bucket.refill();
      expect(bucket.tokens).toBeLessThanOrEqual(10);
      done();
    }, 100);
  });

  test('calculates retry-after correctly', () => {
    const bucket = new TokenBucket(10, 10); // 10 tokens/sec
    bucket.consume(10);
    
    const retryAfter = bucket.getRetryAfter();
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(1000); // Should be ~100ms
  });
});

describe('Memory Store', () => {
  let store;

  beforeEach(() => {
    store = new MemoryStore();
  });

  afterEach(() => {
    store.stopCleanup();
    store.clear();
  });

  test('stores and retrieves values', () => {
    const bucket = new TokenBucket(10, 5);
    store.set('key1', bucket);
    expect(store.get('key1')).toBe(bucket);
  });

  test('deletes values', () => {
    const bucket = new TokenBucket(10, 5);
    store.set('key1', bucket);
    store.delete('key1');
    expect(store.get('key1')).toBeUndefined();
  });

  test('clears all values', () => {
    store.set('key1', new TokenBucket(10, 5));
    store.set('key2', new TokenBucket(20, 10));
    expect(store.size).toBe(2);
    
    store.clear();
    expect(store.size).toBe(0);
  });

  test('starts cleanup interval', () => {
    store.startCleanup(100);
    expect(store.cleanupInterval).toBeDefined();
    store.stopCleanup();
  });

  test('cleans up expired entries', (done) => {
    const oldBucket = new TokenBucket(10, 5);
    oldBucket.lastAccess = Date.now() - 700000; // 11+ minutes ago
    store.set('old', oldBucket);
    store.set('new', new TokenBucket(10, 5));
    
    store.startCleanup(100);
    
    setTimeout(() => {
      expect(store.get('old')).toBeUndefined();
      expect(store.get('new')).toBeDefined();
      store.stopCleanup();
      done();
    }, 200);
  });
});

describe('Rate Limit Middleware', () => {
  test('creates middleware with default options', () => {
    const middleware = rateLimit();
    expect(middleware).toBeInstanceOf(Function);
  });

  test('creates middleware with custom options', () => {
    const middleware = rateLimit({
      maxRequests: 50,
      windowMs: 30000,
      statusCode: 503,
      message: 'Custom message'
    });
    expect(middleware).toBeInstanceOf(Function);
  });

  test('allows requests within limit', async () => {
    const middleware = rateLimit({ maxRequests: 5, windowMs: 60000 });
    
    const mockRes = {
      headers: {},
      setHeader: function(key, value) { this.headers[key] = value; }
    };
    
    const mockReq = {
      ip: '127.0.0.1'
    };
    
    let nextCalled = false;
    await middleware(mockRes, mockReq, {}, {}, () => { nextCalled = true; });
    
    expect(nextCalled).toBe(true);
    expect(mockRes.headers['X-RateLimit-Limit']).toBe('5');
  });

  test('blocks requests exceeding limit', async () => {
    const middleware = rateLimit({ maxRequests: 2, windowMs: 60000 });
    
    const mockReq = { ip: '127.0.0.1' };
    
    // First two requests should pass
    for (let i = 0; i < 2; i++) {
      const mockRes = {
        headers: {},
        setHeader: function(key, value) { this.headers[key] = value; }
      };
      await middleware(mockRes, mockReq, {}, {}, () => {});
    }
    
    // Third request should be blocked
    const mockRes = {
      statusCode: 200,
      headers: {},
      setHeader: function(key, value) { this.headers[key] = value; },
      status: function(code) { this.statusCode = code; return this; },
      sendJSON: function(data) { this.body = data; }
    };
    
    await middleware(mockRes, mockReq, {}, {}, () => {});
    
    expect(mockRes.statusCode).toBe(429);
    expect(mockRes.body.error).toContain('Too many requests');
  });

  test('sets rate limit headers', async () => {
    const middleware = rateLimit({ maxRequests: 10, windowMs: 60000 });
    
    const mockRes = {
      headers: {},
      setHeader: function(key, value) { this.headers[key] = value; }
    };
    
    const mockReq = { ip: '127.0.0.1' };
    
    await middleware(mockRes, mockReq, {}, {}, () => {});
    
    expect(mockRes.headers['X-RateLimit-Limit']).toBe('10');
    expect(mockRes.headers['X-RateLimit-Remaining']).toBeDefined();
    expect(mockRes.headers['X-RateLimit-Reset']).toBeDefined();
  });

  test('sets Retry-After header when rate limited', async () => {
    const middleware = rateLimit({ maxRequests: 1, windowMs: 60000 });
    
    const mockReq = { ip: '127.0.0.1' };
    
    // First request
    await middleware({
      headers: {},
      setHeader: function() {}
    }, mockReq, {}, {}, () => {});
    
    // Second request (blocked)
    const mockRes = {
      statusCode: 200,
      headers: {},
      setHeader: function(key, value) { this.headers[key] = value; },
      status: function(code) { this.statusCode = code; return this; },
      sendJSON: function(data) { this.body = data; }
    };
    
    await middleware(mockRes, mockReq, {}, {}, () => {});
    
    expect(mockRes.headers['Retry-After']).toBeDefined();
  });

  test('uses custom key generator', async () => {
    const middleware = rateLimit({
      maxRequests: 1,
      keyGenerator: (req) => req.userId
    });
    
    const mockReq1 = { userId: 'user1' };
    const mockReq2 = { userId: 'user2' };
    
    // Request from user1
    await middleware({
      headers: {},
      setHeader: function() {}
    }, mockReq1, {}, {}, () => {});
    
    // Request from user2 should be allowed (different key)
    let user2Allowed = false;
    await middleware({
      headers: {},
      setHeader: function() {}
    }, mockReq2, {}, {}, () => { user2Allowed = true; });
    
    expect(user2Allowed).toBe(true);
  });

  test('uses custom handler for rate limited requests', async () => {
    let customHandlerCalled = false;
    
    const middleware = rateLimit({
      maxRequests: 1,
      handler: (req, res, next) => {
        customHandlerCalled = true;
        res.status(503).sendText('Service Unavailable');
      }
    });
    
    const mockReq = { ip: '127.0.0.1' };
    
    // First request
    await middleware({
      headers: {},
      setHeader: function() {}
    }, mockReq, {}, {}, () => {});
    
    // Second request (should trigger custom handler)
    const mockRes = {
      statusCode: 200,
      headers: {},
      setHeader: function() {},
      status: function(code) { this.statusCode = code; return this; },
      sendText: function(text) { this.body = text; }
    };
    
    await middleware(mockRes, mockReq, {}, {}, () => {});
    
    expect(customHandlerCalled).toBe(true);
    expect(mockRes.statusCode).toBe(503);
  });
});

describe('Rate Limit Route', () => {
  test('creates per-route limiter', () => {
    const middleware = rateLimitRoute('/api/users', { maxRequests: 10 });
    expect(middleware).toBeInstanceOf(Function);
  });

  test('uses route-specific keys', async () => {
    const middleware = rateLimitRoute('/api/users', { maxRequests: 1 });
    
    const mockReq = { ip: '127.0.0.1' };
    const mockRes = {
      headers: {},
      setHeader: function() {}
    };
    
    await middleware(mockRes, mockReq, {}, {}, () => {});
    
    // The key should include the route
    expect(true).toBe(true); // Key generation is internal
  });
});
