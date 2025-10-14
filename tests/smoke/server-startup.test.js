/**
 * Smoke Tests: Server Startup
 * Quick sanity check that server starts and responds
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import http from 'http';
import { VeloxServer, VeloxRouter } from '../../lib/index.js';

let server;
const PORT = 6000;

beforeAll((done) => {
  const router = new VeloxRouter();
  router.get('/health', (res) => res.sendJSON({ status: 'ok' }));
  
  server = new VeloxServer().setPort(PORT).setRouter(router).start();
  setTimeout(done, 100);
});

afterAll((done) => {
  server.close(done);
});

function ping(path = '/health') {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

describe('Server Startup Smoke Tests', () => {
  test('server starts successfully', () => {
    expect(server).toBeDefined();
  });

  test('server responds to requests', async () => {
    const res = await ping();
    expect(res.statusCode).toBe(200);
  });

  test('health endpoint returns ok', async () => {
    const res = await ping();
    expect(JSON.parse(res.body)).toEqual({ status: 'ok' });
  });

  test('server handles 404', async () => {
    const res = await ping('/nonexistent');
    expect(res.statusCode).toBe(404);
  });

  test('server accepts multiple concurrent requests', async () => {
    const requests = Array(20).fill(null).map(() => ping());
    const results = await Promise.all(requests);
    
    results.forEach(res => {
      expect(res.statusCode).toBe(200);
    });
  });
});
