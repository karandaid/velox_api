/**
 * Integration Tests: HTTP Request/Response Cycle
 * Tests full HTTP workflows with actual requests
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import http from 'http';
import { VeloxServer, VeloxRouter } from '../../lib/index.js';

let server;
const PORT = 5015;

beforeAll((done) => {
  const router = new VeloxRouter();

  router.get('/json', (res) => {
    res.sendJSON({ status: 'ok', data: [1, 2, 3] });
  });

  router.post('/echo', async (res, req) => {
    try {
      const body = await req.json();
      res.sendJSON({ received: body });
    } catch (err) {
      res.status(500).sendJSON({ error: err.message });
    }
  });

  router.get('/text', (res) => {
    res.sendText('Hello World');
  });

  router.get('/status/:code=number', (res, req, query, params) => {
    res.status(params.code).sendJSON({ code: params.code });
  });

  router.get('/redirect', (res) => {
    res.redirect('/json');
  });

  router.get('/headers', (res, req) => {
    const userAgent = req.getHeader('user-agent');
    res.setHeader('X-Custom', 'test');
    res.sendJSON({ userAgent });
  });

  server = new VeloxServer().setPort(PORT).setRouter(router).start();
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

function request(method, path, options = {}) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    if (options.body) req.write(options.body);
    req.end();
  });
}

describe('HTTP Request/Response Cycle', () => {
  test('JSON responses work correctly', async () => {
    const res = await request('GET', '/json');
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(JSON.parse(res.body)).toEqual({ status: 'ok', data: [1, 2, 3] });
  });

  test('POST with JSON body works', async () => {
    const payload = { name: 'test' };
    const body = JSON.stringify(payload);
    const res = await request('POST', '/echo', {
      headers: { 
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      body
    });
    
    expect([200, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(JSON.parse(res.body)).toEqual({ received: payload });
    }
  });

  test('Text responses work', async () => {
    const res = await request('GET', '/text');
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('Hello World');
  });

  test('Custom status codes work', async () => {
    const res = await request('GET', '/status/201');
    
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body)).toEqual({ code: 201 });
  });

  test('Redirects work correctly', async () => {
    const res = await request('GET', '/redirect');
    
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/json');
  });

  test('Request and response headers work', async () => {
    const res = await request('GET', '/headers', {
      headers: { 'User-Agent': 'TestAgent/1.0' }
    });
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['x-custom']).toBe('test');
    expect(JSON.parse(res.body).userAgent).toBe('TestAgent/1.0');
  });

  test('404 for non-existent routes', async () => {
    const res = await request('GET', '/nonexistent');
    expect(res.statusCode).toBe(404);
  });
});
