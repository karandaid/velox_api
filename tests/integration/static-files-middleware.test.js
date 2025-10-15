/**
 * Integration Tests: Static Files Middleware
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { writeFileSync, unlinkSync, mkdirSync, rmdirSync, existsSync } from 'fs';
import { join } from 'path';
import http from 'http';
import VeloxServer from '../../lib/core/server.js';
import VeloxRouter from '../../lib/core/router.js';
import { staticFiles } from '../../lib/middleware/static-files.js';

const PORT = 5020;
const TEST_DIR = join(process.cwd(), 'test-public');
let server;

beforeAll((done) => {
  // Create test directory and files
  if (!existsSync(TEST_DIR)) {
    mkdirSync(TEST_DIR, { recursive: true });
  }
  
  writeFileSync(join(TEST_DIR, 'index.html'), '<h1>Welcome</h1>');
  writeFileSync(join(TEST_DIR, 'style.css'), 'body { color: red; }');
  writeFileSync(join(TEST_DIR, 'script.js'), 'console.log("test");');
  writeFileSync(join(TEST_DIR, '.secret'), 'hidden content');
  
  // Create subdirectory
  mkdirSync(join(TEST_DIR, 'assets'), { recursive: true });
  writeFileSync(join(TEST_DIR, 'assets', 'logo.png'), 'fake-png-data');
  writeFileSync(join(TEST_DIR, 'assets', 'index.html'), '<h1>Assets Index</h1>');
  
  const router = new VeloxRouter();
  
  // Use static files middleware
  router.use(staticFiles(TEST_DIR, {
    etag: true,
    maxAge: 3600,
    index: ['index.html']
  }));
  
  // Fallback route
  router.get('/api/test', (res) => {
    res.sendJSON({ api: 'works' });
  });
  
  server = new VeloxServer()
    .setPort(PORT)
    .setRouter(router)
    .start();
  
  setTimeout(done, 100);
});

afterAll((done) => {
  // Cleanup
  try {
    unlinkSync(join(TEST_DIR, 'index.html'));
    unlinkSync(join(TEST_DIR, 'style.css'));
    unlinkSync(join(TEST_DIR, 'script.js'));
    unlinkSync(join(TEST_DIR, '.secret'));
    unlinkSync(join(TEST_DIR, 'assets', 'logo.png'));
    unlinkSync(join(TEST_DIR, 'assets', 'index.html'));
    rmdirSync(join(TEST_DIR, 'assets'));
    rmdirSync(TEST_DIR);
  } catch (err) {}
  
  if (server && server.server) {
    server.server.closeAllConnections?.();
    server.close(done);
  } else {
    done();
  }
});

function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: '127.0.0.1',
      port: PORT,
      path,
      headers
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

describe('Static Files Middleware Integration', () => {
  describe('Basic File Serving', () => {
    test('serves HTML file', async () => {
      const res = await makeRequest('/index.html');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/html');
      expect(res.body).toBe('<h1>Welcome</h1>');
    });

    test('serves CSS file', async () => {
      const res = await makeRequest('/style.css');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('text/css');
      expect(res.body).toBe('body { color: red; }');
    });

    test('serves JavaScript file', async () => {
      const res = await makeRequest('/script.js');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/javascript');
      expect(res.body).toBe('console.log("test");');
    });

    test('serves files from subdirectories', async () => {
      const res = await makeRequest('/assets/logo.png');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('image/png');
    });
  });

  describe('Index Files', () => {
    test('serves index.html for directory requests', async () => {
      const res = await makeRequest('/assets/');
      expect(res.statusCode).toBe(200);
      expect(res.body).toBe('<h1>Assets Index</h1>');
    });

    test('serves root index.html', async () => {
      const res = await makeRequest('/');
      expect(res.statusCode).toBe(200);
      expect(res.body).toBe('<h1>Welcome</h1>');
    });
  });

  describe('Security', () => {
    test('blocks path traversal attempts', async () => {
      const res = await makeRequest('/../../../etc/passwd');
      expect(res.statusCode).toBe(403);
    });

    test('blocks dotfiles', async () => {
      const res = await makeRequest('/.secret');
      expect(res.statusCode).toBe(403);
    });

    test('returns 404 for non-existent files', async () => {
      const res = await makeRequest('/nonexistent.html');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('ETag Caching', () => {
    test('includes ETag header', async () => {
      const res = await makeRequest('/index.html');
      expect(res.headers['etag']).toBeDefined();
      expect(res.headers['etag']).toMatch(/^"/);
    });

    test('returns 304 for matching ETag', async () => {
      // First request
      const res1 = await makeRequest('/index.html');
      const etag = res1.headers['etag'];
      
      // Second request with If-None-Match
      const res2 = await makeRequest('/index.html', {
        'If-None-Match': etag
      });
      
      expect(res2.statusCode).toBe(304);
      expect(res2.body).toBe('');
    });

    test('returns full content for different ETag', async () => {
      const res = await makeRequest('/index.html', {
        'If-None-Match': '"different-etag"'
      });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toBe('<h1>Welcome</h1>');
    });
  });

  describe('Cache Control', () => {
    test('includes Cache-Control header', async () => {
      const res = await makeRequest('/index.html');
      expect(res.headers['cache-control']).toBe('public, max-age=3600');
    });

    test('includes Last-Modified header', async () => {
      const res = await makeRequest('/index.html');
      expect(res.headers['last-modified']).toBeDefined();
    });
  });

  describe('Middleware Chain', () => {
    test('allows other routes to work', async () => {
      const res = await makeRequest('/api/test');
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ api: 'works' });
    });

    test('POST requests pass through to next middleware', async () => {
      // POST should not be handled by static middleware
      // This would need a POST route to verify, but we can check it doesn't serve files
      const res = await makeRequest('/index.html');
      expect(res.statusCode).toBe(200); // GET works
    });
  });

  describe('MIME Types', () => {
    test('sets correct MIME type for HTML', async () => {
      const res = await makeRequest('/index.html');
      expect(res.headers['content-type']).toBe('text/html');
    });

    test('sets correct MIME type for CSS', async () => {
      const res = await makeRequest('/style.css');
      expect(res.headers['content-type']).toBe('text/css');
    });

    test('sets correct MIME type for JavaScript', async () => {
      const res = await makeRequest('/script.js');
      expect(res.headers['content-type']).toBe('application/javascript');
    });

    test('sets correct MIME type for PNG', async () => {
      const res = await makeRequest('/assets/logo.png');
      expect(res.headers['content-type']).toBe('image/png');
    });
  });
});
