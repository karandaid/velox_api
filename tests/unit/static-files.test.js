/**
 * Unit Tests: Static File Middleware
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { writeFileSync, unlinkSync, mkdirSync, rmdirSync, existsSync } from 'fs';
import { join } from 'path';
import { staticFiles } from '../../lib/middleware/static-files.js';

const TEST_DIR = join(process.cwd(), 'test-static');

describe('Static Files Middleware', () => {
  beforeEach(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    try {
      if (existsSync(join(TEST_DIR, 'test.html'))) {
        unlinkSync(join(TEST_DIR, 'test.html'));
      }
      if (existsSync(join(TEST_DIR, 'index.html'))) {
        unlinkSync(join(TEST_DIR, 'index.html'));
      }
      if (existsSync(join(TEST_DIR, '.hidden'))) {
        unlinkSync(join(TEST_DIR, '.hidden'));
      }
      if (existsSync(TEST_DIR)) {
        rmdirSync(TEST_DIR);
      }
    } catch (err) {
      // Cleanup errors are ok
    }
  });

  describe('Configuration', () => {
    test('creates middleware with default options', () => {
      const middleware = staticFiles(TEST_DIR);
      expect(middleware).toBeInstanceOf(Function);
    });

    test('creates middleware with custom options', () => {
      const middleware = staticFiles(TEST_DIR, {
        etag: false,
        maxAge: 3600,
        dotfiles: true,
        index: ['index.html', 'index.htm']
      });
      expect(middleware).toBeInstanceOf(Function);
    });
  });

  describe('Security', () => {
    test('blocks path traversal attempts with ..', async () => {
      writeFileSync(join(TEST_DIR, 'test.html'), '<h1>Test</h1>');
      
      const middleware = staticFiles(TEST_DIR);
      
      const mockRes = {
        statusCode: 200,
        headers: {},
        setHeader: function(key, value) { this.headers[key] = value; },
        status: function(code) { this.statusCode = code; return this; },
        sendText: function(text) { this.body = text; },
        end: function() {}
      };
      
      const mockReq = {
        method: 'GET',
        url: '/../../../etc/passwd',
        getHeader: () => null
      };
      
      await middleware(mockRes, mockReq);
      
      expect(mockRes.statusCode).toBe(403);
    });

    test('safely handles absolute-looking path requests', async () => {
      const middleware = staticFiles(TEST_DIR);
      
      const mockRes = {
        statusCode: 200,
        headers: {},
        status: function(code) { this.statusCode = code; return this; },
        sendText: function(text) { this.body = text; }
      };
      
      const mockReq = {
        method: 'GET',
        url: '/etc/passwd',
        getHeader: () => null
      };
      
      await middleware(mockRes, mockReq);
      
      // Should safely resolve to publicDir/etc/passwd (which doesn't exist)
      expect(mockRes.statusCode).toBe(404);
    });

    test('safely handles Windows-style absolute-looking paths', async () => {
      const middleware = staticFiles(TEST_DIR);
      
      const mockRes = {
        statusCode: 200,
        headers: {},
        status: function(code) { this.statusCode = code; return this; },
        sendText: function(text) { this.body = text; }
      };
      
      const mockReq = {
        method: 'GET',
        url: '/windows/system32/drivers/etc/hosts',
        getHeader: () => null
      };
      
      await middleware(mockRes, mockReq);
      
      // Should safely resolve to publicDir/windows/... (which doesn't exist)
      expect(mockRes.statusCode).toBe(404);
    });

    test('blocks null byte injection', async () => {
      const middleware = staticFiles(TEST_DIR);
      
      const mockRes = {
        statusCode: 200,
        headers: {},
        status: function(code) { this.statusCode = code; return this; },
        sendText: function(text) { this.body = text; }
      };
      
      const mockReq = {
        method: 'GET',
        url: '/test.html\0.jpg',
        getHeader: () => null
      };
      
      await middleware(mockRes, mockReq);
      
      expect(mockRes.statusCode).toBe(403);
    });

    test('blocks dotfiles by default', async () => {
      writeFileSync(join(TEST_DIR, '.hidden'), 'secret');
      
      const middleware = staticFiles(TEST_DIR);
      
      const mockRes = {
        statusCode: 200,
        headers: {},
        status: function(code) { this.statusCode = code; return this; },
        sendText: function(text) { this.body = text; }
      };
      
      const mockReq = {
        method: 'GET',
        url: '/.hidden',
        getHeader: () => null
      };
      
      await middleware(mockRes, mockReq);
      
      expect(mockRes.statusCode).toBe(403);
    });

    test('allows dotfiles when enabled', async () => {
      writeFileSync(join(TEST_DIR, '.hidden'), 'secret');
      
      const middleware = staticFiles(TEST_DIR, { dotfiles: true });
      
      const mockRes = {
        statusCode: 200,
        headers: {},
        setHeader: function(key, value) { this.headers[key] = value; },
        status: function(code) { this.statusCode = code; return this; },
        sendFile: async function(path) { this.filePath = path; }
      };
      
      const mockReq = {
        method: 'GET',
        url: '/.hidden',
        getHeader: () => null
      };
      
      await middleware(mockRes, mockReq);
      
      expect(mockRes.filePath).toContain('.hidden');
    });
  });

  describe('HTTP Methods', () => {
    test('handles GET requests', async () => {
      writeFileSync(join(TEST_DIR, 'test.html'), '<h1>Test</h1>');
      
      const middleware = staticFiles(TEST_DIR);
      const mockRes = {
        headers: {},
        setHeader: function(key, value) { this.headers[key] = value; },
        sendFile: async function(path) { this.called = true; }
      };
      
      const mockReq = {
        method: 'GET',
        url: '/test.html',
        getHeader: () => null
      };
      
      await middleware(mockRes, mockReq);
      expect(mockRes.called).toBe(true);
    });

    test('skips POST requests', () => {
      const middleware = staticFiles(TEST_DIR);
      let nextCalled = false;
      
      const mockRes = {};
      const mockReq = {
        method: 'POST',
        url: '/test.html'
      };
      
      middleware(mockRes, mockReq, {}, {}, () => { nextCalled = true; });
      expect(nextCalled).toBe(true);
    });
  });

  describe('ETag Caching', () => {
    test('generates ETag header', async () => {
      writeFileSync(join(TEST_DIR, 'test.html'), '<h1>Test</h1>');
      
      const middleware = staticFiles(TEST_DIR, { etag: true });
      const mockRes = {
        headers: {},
        setHeader: function(key, value) { this.headers[key] = value; },
        sendFile: async function() {}
      };
      
      const mockReq = {
        method: 'GET',
        url: '/test.html',
        getHeader: () => null
      };
      
      await middleware(mockRes, mockReq);
      expect(mockRes.headers['ETag']).toBeDefined();
      expect(mockRes.headers['ETag']).toMatch(/^"/);
    });

    test('returns 304 for matching ETag', async () => {
      writeFileSync(join(TEST_DIR, 'test.html'), '<h1>Test</h1>');
      
      const middleware = staticFiles(TEST_DIR, { etag: true });
      
      // First request to get ETag
      const mockRes1 = {
        headers: {},
        setHeader: function(key, value) { this.headers[key] = value; },
        sendFile: async function() {}
      };
      
      const mockReq1 = {
        method: 'GET',
        url: '/test.html',
        getHeader: () => null
      };
      
      await middleware(mockRes1, mockReq1);
      const etag = mockRes1.headers['ETag'];
      
      // Second request with If-None-Match
      const mockRes2 = {
        statusCode: 200,
        headers: {},
        setHeader: function(key, value) { this.headers[key] = value; },
        status: function(code) { this.statusCode = code; return this; },
        end: function() {}
      };
      
      const mockReq2 = {
        method: 'GET',
        url: '/test.html',
        getHeader: (name) => name === 'if-none-match' ? etag : null
      };
      
      await middleware(mockRes2, mockReq2);
      expect(mockRes2.statusCode).toBe(304);
    });

    test('disables ETag when option is false', async () => {
      writeFileSync(join(TEST_DIR, 'test.html'), '<h1>Test</h1>');
      
      const middleware = staticFiles(TEST_DIR, { etag: false });
      const mockRes = {
        headers: {},
        setHeader: function(key, value) { this.headers[key] = value; },
        sendFile: async function() {}
      };
      
      const mockReq = {
        method: 'GET',
        url: '/test.html',
        getHeader: () => null
      };
      
      await middleware(mockRes, mockReq);
      expect(mockRes.headers['ETag']).toBeUndefined();
    });
  });

  describe('Cache Control', () => {
    test('sets Cache-Control to no-cache by default', async () => {
      writeFileSync(join(TEST_DIR, 'test.html'), '<h1>Test</h1>');
      
      const middleware = staticFiles(TEST_DIR);
      const mockRes = {
        headers: {},
        setHeader: function(key, value) { this.headers[key] = value; },
        sendFile: async function() {}
      };
      
      const mockReq = {
        method: 'GET',
        url: '/test.html',
        getHeader: () => null
      };
      
      await middleware(mockRes, mockReq);
      expect(mockRes.headers['Cache-Control']).toBe('no-cache');
    });

    test('sets Cache-Control with custom maxAge', async () => {
      writeFileSync(join(TEST_DIR, 'test.html'), '<h1>Test</h1>');
      
      const middleware = staticFiles(TEST_DIR, { maxAge: 3600 });
      const mockRes = {
        headers: {},
        setHeader: function(key, value) { this.headers[key] = value; },
        sendFile: async function() {}
      };
      
      const mockReq = {
        method: 'GET',
        url: '/test.html',
        getHeader: () => null
      };
      
      await middleware(mockRes, mockReq);
      expect(mockRes.headers['Cache-Control']).toBe('public, max-age=3600');
    });
  });

  describe('Index Files', () => {
    test('serves index.html for directory requests', async () => {
      mkdirSync(join(TEST_DIR, 'subdir'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'subdir', 'index.html'), '<h1>Index</h1>');
      
      const middleware = staticFiles(TEST_DIR);
      const mockRes = {
        headers: {},
        setHeader: function(key, value) { this.headers[key] = value; },
        sendFile: async function(path) { this.filePath = path; }
      };
      
      const mockReq = {
        method: 'GET',
        url: '/subdir/',
        getHeader: () => null
      };
      
      await middleware(mockRes, mockReq);
      expect(mockRes.filePath).toContain('index.html');
      
      unlinkSync(join(TEST_DIR, 'subdir', 'index.html'));
      rmdirSync(join(TEST_DIR, 'subdir'));
    });
  });
});
