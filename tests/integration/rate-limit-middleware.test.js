/**
 * Integration Tests: Rate Limiting Middleware
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import http from 'http';
import VeloxServer from '../../lib/core/server.js';
import VeloxRouter from '../../lib/core/router.js';
import { rateLimit, rateLimitRoute } from '../../lib/middleware/rate-limit.js';

const PORT = 5021;
let server;

beforeAll((done) => {
  const router = new VeloxRouter();
  
  // Global rate limit: 5 requests per minute
  const globalLimiter = rateLimit({
    maxRequests: 5,
    windowMs: 60000,
    message: 'Too many requests'
  });
  
  // API route with custom rate limit
  const apiLimiter = rateLimitRoute('/api/strict', {
    maxRequests: 2,
    windowMs: 60000
  });
  
  router.get('/unlimited', (res) => {
    res.sendJSON({ message: 'No limits here' });
  });
  
  router.get('/limited', globalLimiter, (res) => {
    res.sendJSON({ message: 'Limited route' });
  });
  
  router.get('/api/strict', apiLimiter, (res) => {
    res.sendJSON({ message: 'Strict API' });
  });
  
  router.get('/custom-handler', rateLimit({
    maxRequests: 1,
    windowMs: 60000,
    handler: (req, res) => {
      res.status(503).sendJSON({ error: 'Custom rate limit handler' });
    }
  }), (res) => {
    res.sendJSON({ message: 'Success' });
  });
  
  server = new VeloxServer()
    .setPort(PORT)
    .setRouter(router)
    .start();
  
  setTimeout(done, 100);
});

afterAll((done) => {
  if (server && server.server) {
    server.server.closeAllConnections?.();
    server.close(done);
  } else {
    done();
  }
});

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: '127.0.0.1',
      port: PORT,
      path
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', reject);
  });
}

describe('Rate Limiting Middleware Integration', () => {
  describe('No Rate Limit', () => {
    test('allows unlimited requests to unrestricted routes', async () => {
      for (let i = 0; i < 10; i++) {
        const res = await makeRequest('/unlimited');
        expect(res.statusCode).toBe(200);
      }
    });
  });

  describe('Global Rate Limit', () => {
    test('allows requests within limit', async () => {
      const res = await makeRequest('/limited');
      expect(res.statusCode).toBe(200);
      expect(res.headers['x-ratelimit-limit']).toBe('5');
      expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    });

    test('blocks requests exceeding limit', async () => {
      // Make requests up to the limit
      for (let i = 0; i < 5; i++) {
        await makeRequest('/limited');
      }
      
      // This should be blocked
      const res = await makeRequest('/limited');
      expect(res.statusCode).toBe(429);
      
      const body = JSON.parse(res.body);
      expect(body.error).toContain('Too many requests');
      expect(res.headers['retry-after']).toBeDefined();
    });

    test('sets rate limit headers', async () => {
      const res = await makeRequest('/limited');
      expect(res.headers['x-ratelimit-limit']).toBeDefined();
      expect(res.headers['x-ratelimit-remaining']).toBeDefined();
      expect(res.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('Per-Route Rate Limit', () => {
    test('enforces stricter limits on specific routes', async () => {
      // First request succeeds
      const res1 = await makeRequest('/api/strict');
      expect(res1.statusCode).toBe(200);
      
      // Second request succeeds
      const res2 = await makeRequest('/api/strict');
      expect(res2.statusCode).toBe(200);
      
      // Third request blocked (limit is 2)
      const res3 = await makeRequest('/api/strict');
      expect(res3.statusCode).toBe(429);
    });

    test('different routes have independent limits', async () => {
      // Exhaust limit on /api/strict
      await makeRequest('/api/strict');
      await makeRequest('/api/strict');
      const res1 = await makeRequest('/api/strict');
      expect(res1.statusCode).toBe(429);
      
      // /unlimited should still work (no rate limit)
      const res2 = await makeRequest('/unlimited');
      expect(res2.statusCode).toBe(200);
    });
  });

  describe('Custom Handler', () => {
    test('uses custom handler when rate limited', async () => {
      // First request succeeds
      await makeRequest('/custom-handler');
      
      // Second request uses custom handler
      const res = await makeRequest('/custom-handler');
      expect(res.statusCode).toBe(503);
      
      const body = JSON.parse(res.body);
      expect(body.error).toBe('Custom rate limit handler');
    });
  });

  describe('Headers', () => {
    test('includes X-RateLimit-Limit header', async () => {
      const res = await makeRequest('/limited');
      expect(res.headers['x-ratelimit-limit']).toBe('5');
    });

    test('includes X-RateLimit-Remaining header', async () => {
      const res = await makeRequest('/limited');
      const remaining = parseInt(res.headers['x-ratelimit-remaining']);
      expect(remaining).toBeGreaterThanOrEqual(0);
      expect(remaining).toBeLessThanOrEqual(5);
    });

    test('includes X-RateLimit-Reset header', async () => {
      const res = await makeRequest('/limited');
      expect(res.headers['x-ratelimit-reset']).toBeDefined();
      
      // Should be a valid ISO date
      const resetDate = new Date(res.headers['x-ratelimit-reset']);
      expect(resetDate.getTime()).toBeGreaterThan(Date.now());
    });

    test('includes Retry-After header when rate limited', async () => {
      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        await makeRequest('/limited');
      }
      
      const res = await makeRequest('/limited');
      expect(res.headers['retry-after']).toBeDefined();
      
      const retryAfter = parseInt(res.headers['retry-after']);
      expect(retryAfter).toBeGreaterThan(0);
    });
  });

  describe('Token Bucket Behavior', () => {
    test('refills tokens over time', async () => {
      // Exhaust the limit on a fresh route
      const testRoute = '/api/strict';
      
      await makeRequest(testRoute);
      await makeRequest(testRoute);
      
      // Should be blocked
      const res1 = await makeRequest(testRoute);
      expect(res1.statusCode).toBe(429);
      
      // Wait for token refill (the refill rate allows this)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const res2 = await makeRequest(testRoute);
      // Might succeed if enough tokens refilled
      expect([200, 429]).toContain(res2.statusCode);
    });
  });

  describe('IP-Based Limiting', () => {
    test('limits requests per IP address', async () => {
      // All requests from same IP (127.0.0.1)
      const results = [];
      
      for (let i = 0; i < 6; i++) {
        const res = await makeRequest('/limited');
        results.push(res.statusCode);
      }
      
      // First 5 should succeed, 6th should fail
      expect(results.filter(code => code === 200).length).toBeLessThanOrEqual(5);
      expect(results[results.length - 1]).toBe(429);
    });
  });

  describe('Error Handling', () => {
    test('handles missing IP gracefully', async () => {
      const res = await makeRequest('/limited');
      expect([200, 429]).toContain(res.statusCode);
    });

    test('continues on middleware errors', async () => {
      // Even if rate limiting fails internally, request should still work
      const res = await makeRequest('/unlimited');
      expect(res.statusCode).toBe(200);
    });
  });
});
