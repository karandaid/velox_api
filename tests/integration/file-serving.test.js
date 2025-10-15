/**
 * File serving and MIME type tests
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { writeFileSync, mkdirSync, unlinkSync, rmdirSync } from 'fs';
import { join } from 'path';
import http from 'http';
import { VeloxServer, VeloxRouter } from '../../lib/index.js';

let server;
const PORT = 5002;
const TEST_DIR = join(process.cwd(), 'test-files');

beforeAll((done) => {
  try {
    mkdirSync(TEST_DIR, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }

  writeFileSync(join(TEST_DIR, 'test.html'), '<h1>Test HTML</h1>');
  writeFileSync(join(TEST_DIR, 'test.json'), '{"test": true}');
  writeFileSync(join(TEST_DIR, 'test.txt'), 'Plain text file');
  writeFileSync(join(TEST_DIR, 'test.css'), 'body { color: red; }');
  writeFileSync(join(TEST_DIR, 'test.js'), 'console.log("test");');

  const router = new VeloxRouter();

  router.get('/file/:filename', async (res, req, query, params) => {
    await res.sendFile(params.filename, TEST_DIR);
  });

  server = new VeloxServer().setPort(PORT).setRouter(router).start();

  setTimeout(done, 100);
});

afterAll((done) => {
  try {
    unlinkSync(join(TEST_DIR, 'test.html'));
    unlinkSync(join(TEST_DIR, 'test.json'));
    unlinkSync(join(TEST_DIR, 'test.txt'));
    unlinkSync(join(TEST_DIR, 'test.css'));
    unlinkSync(join(TEST_DIR, 'test.js'));
    rmdirSync(TEST_DIR);
  } catch (err) {
    // Files might not exist
  }

  if (server && server.server) {
    server.server.closeAllConnections?.();
    server.close(done);
  } else {
    done();
  }
});

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', reject);
  });
}

describe('File Serving', () => {
  test('serves HTML with correct MIME type', async () => {
    const res = await makeRequest('/file/test.html');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/html');
    expect(res.body).toBe('<h1>Test HTML</h1>');
  });

  test('serves JSON with correct MIME type', async () => {
    const res = await makeRequest('/file/test.json');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/json');
    expect(res.body).toBe('{"test": true}');
  });

  test('serves plain text with correct MIME type', async () => {
    const res = await makeRequest('/file/test.txt');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/plain');
    expect(res.body).toBe('Plain text file');
  });

  test('serves CSS with correct MIME type', async () => {
    const res = await makeRequest('/file/test.css');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/css');
    expect(res.body).toBe('body { color: red; }');
  });

  test('serves JavaScript with correct MIME type', async () => {
    const res = await makeRequest('/file/test.js');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/javascript');
    expect(res.body).toBe('console.log("test");');
  });

  test('returns 404 for non-existent files', async () => {
    const res = await makeRequest('/file/nonexistent.txt');
    expect(res.statusCode).toBe(404);
  });

  test('sets Content-Length header', async () => {
    const res = await makeRequest('/file/test.txt');
    expect(res.headers['content-length']).toBeDefined();
    expect(parseInt(res.headers['content-length'])).toBeGreaterThan(0);
  });
});
