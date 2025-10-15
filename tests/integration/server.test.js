/**
 * Integration tests for VeloxAPI server
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import http from 'http';
import { VeloxServer, VeloxRouter } from '../../lib/index.js';

let server;
const PORT = 5001;

beforeAll((done) => {
  const router = new VeloxRouter();

  router.get('/', (res) => {
    res.sendJSON({ message: 'Hello VeloxAPI' });
  });

  router.get('/hello/:name=string', (res, req, query, params) => {
    res.sendJSON({ message: `Hello, ${params.name}!` });
  });

  router.get('/user/:id=number', (res, req, query, params) => {
    res.sendJSON({ userId: params.id, type: typeof params.id });
  });

  router.get('/email/:email=email', (res, req, query, params) => {
    res.sendJSON({ email: params.email });
  });

  router.get('/uuid/:id=uuid', (res, req, query, params) => {
    res.sendJSON({ uuid: params.id });
  });

  router.get('/slug/:slug=slug', (res, req, query, params) => {
    res.sendJSON({ slug: params.slug });
  });

  router.get('/text', (res) => {
    res.sendText('Plain text response');
  });

  router.get('/html', (res) => {
    res.sendHTML('<h1>HTML Response</h1>');
  });

  router.post('/json', async (res, req) => {
    const body = await req.getBody();
    res.sendJSON({ received: body });
  });

  router.post('/form', async (res, req) => {
    const body = await req.getBody();
    res.sendJSON({ form: body });
  });

  router.post('/xml', async (res, req) => {
    const body = await req.getBody();
    res.sendJSON({ xml: body });
  });

  router.get('/query', (res, req, query) => {
    res.sendJSON({ query });
  });

  router.get('/error', (res) => {
    res.sendError('Test error', 400);
  });

  router.get('/redirect', (res) => {
    res.redirect('/');
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

function makeRequest(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }

    req.end();
  });
}

describe('VeloxAPI Integration Tests', () => {
  describe('Basic Routes', () => {
    test('GET / returns JSON', async () => {
      const res = await makeRequest('GET', '/');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
      expect(JSON.parse(res.body)).toEqual({ message: 'Hello VeloxAPI' });
    });

    test('GET /text returns plain text', async () => {
      const res = await makeRequest('GET', '/text');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.body).toBe('Plain text response');
    });

    test('GET /html returns HTML', async () => {
      const res = await makeRequest('GET', '/html');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.body).toBe('<h1>HTML Response</h1>');
    });
  });

  describe('Typed Parameters', () => {
    test('string parameter validation', async () => {
      const res = await makeRequest('GET', '/hello/john');
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.message).toBe('Hello, john!');
    });

    test('string parameter accepts numbers (wildcard behavior)', async () => {
      // String is a wildcard fallback - it accepts anything
      const res = await makeRequest('GET', '/hello/123');
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.message).toBe('Hello, 123!');
    });

    test('number parameter validation and conversion', async () => {
      const res = await makeRequest('GET', '/user/123');
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.userId).toBe(123);
      expect(body.type).toBe('number');
    });

    test('number parameter rejects non-numbers', async () => {
      const res = await makeRequest('GET', '/user/abc');
      expect(res.statusCode).toBe(404);
    });

    test('email parameter validation', async () => {
      const res = await makeRequest('GET', '/email/test@example.com');
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.email).toBe('test@example.com');
    });

    test('email parameter rejects invalid emails', async () => {
      const res = await makeRequest('GET', '/email/invalid-email');
      expect(res.statusCode).toBe(404);
    });

    test('uuid parameter validation', async () => {
      const res = await makeRequest('GET', '/uuid/123e4567-e89b-12d3-a456-426614174000');
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.uuid).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    test('uuid parameter rejects invalid UUIDs', async () => {
      const res = await makeRequest('GET', '/uuid/not-a-uuid');
      expect(res.statusCode).toBe(404);
    });

    test('slug parameter validation', async () => {
      const res = await makeRequest('GET', '/slug/my-blog-post');
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.slug).toBe('my-blog-post');
    });

    test('slug parameter rejects invalid slugs', async () => {
      const res = await makeRequest('GET', '/slug/My-Blog-Post');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Request Body Parsing', () => {
    test('POST with JSON body', async () => {
      const res = await makeRequest('POST', '/json', { name: 'John', age: 30 });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.received).toEqual({ name: 'John', age: 30 });
    });

    test('POST with URL-encoded form', async () => {
      const res = await makeRequest(
        'POST',
        '/form',
        'name=John&age=30',
        { 'Content-Type': 'application/x-www-form-urlencoded' }
      );
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.form).toEqual({ name: 'John', age: '30' });
    });

    test('POST with XML', async () => {
      const xml = '<user><name>John</name><age>30</age></user>';
      const res = await makeRequest('POST', '/xml', xml, {
        'Content-Type': 'application/xml',
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.xml).toHaveProperty('name', 'John');
      expect(body.xml).toHaveProperty('age', '30');
    });
  });

  describe('Query Parameters', () => {
    test('handles query parameters', async () => {
      const res = await makeRequest('GET', '/query?name=John&age=30');
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.query).toEqual({ name: 'John', age: '30' });
    });

    test('handles empty query parameters', async () => {
      const res = await makeRequest('GET', '/query');
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.query).toEqual({});
    });
  });

  describe('Error Handling', () => {
    test('handles 404 for non-existent routes', async () => {
      const res = await makeRequest('GET', '/non-existent');
      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res.body);
      expect(body.error).toBe('Not found');
    });

    test('handles custom errors', async () => {
      const res = await makeRequest('GET', '/error');
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toBe('Test error');
    });
  });

  describe('Redirects', () => {
    test('handles redirects', async () => {
      const res = await makeRequest('GET', '/redirect');
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/');
    });
  });
});
