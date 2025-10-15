/**
 * Integration Tests: Streaming
 * Tests streaming file uploads and downloads
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { writeFileSync, unlinkSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import http from 'http';
import { VeloxServer, VeloxRouter } from '../../lib/index.js';
import { streamToDestination } from '../../lib/utils/stream-parser.js';
import { createWriteStream } from 'fs';

let server;
const PORT = 5013;
const UPLOAD_DIR = join(process.cwd(), 'test-uploads');

beforeAll((done) => {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const router = new VeloxRouter();

  router.post('/upload/:filename', async (res, req, query, params) => {
    const filepath = join(UPLOAD_DIR, params.filename);
    const fileStream = createWriteStream(filepath);
    
    try {
      const bytes = await streamToDestination(req.req, fileStream, 5 * 1024 * 1024);
      res.sendJSON({ uploaded: true, bytes, filename: params.filename });
    } catch (err) {
      res.sendError(err.message, 400);
    }
  });

  router.get('/download/:filename', (res, req, query, params) => {
    const filepath = join(UPLOAD_DIR, params.filename);
    res.sendFile(filepath);
  });

  server = new VeloxServer().setPort(PORT).setRouter(router).start();
  setTimeout(done, 100);
});

afterAll((done) => {
  try {
    const { readdirSync, rmdirSync } = require('fs');
    const files = readdirSync(UPLOAD_DIR);
    files.forEach(file => unlinkSync(join(UPLOAD_DIR, file)));
    rmdirSync(UPLOAD_DIR);
  } catch (err) {}
  
  if (server && server.server) {
    server.server.closeAllConnections?.(); // Close all keep-alive connections
    server.close(done);
  } else {
    done();
  }
});

function uploadFile(filename, content) {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
    
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: `/upload/${filename}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': buffer.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ 
          statusCode: res.statusCode, 
          body: JSON.parse(data) 
        });
      });
    });

    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}/download/${filename}`, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          content: Buffer.concat(chunks)
        });
      });
    }).on('error', reject);
  });
}

describe('Streaming Integration', () => {
  test('streams small file upload', async () => {
    const content = 'Hello, streaming!';
    const res = await uploadFile('small.txt', content);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.uploaded).toBe(true);
    expect(res.body.bytes).toBe(Buffer.byteLength(content));
    
    const saved = readFileSync(join(UPLOAD_DIR, 'small.txt'), 'utf-8');
    expect(saved).toBe(content);
  });

  test('streams larger file (1MB) without buffering', async () => {
    const size = 1024 * 1024;
    const content = Buffer.alloc(size, 'X');
    const res = await uploadFile('large.bin', content);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.bytes).toBe(size);
    
    const filepath = join(UPLOAD_DIR, 'large.bin');
    expect(existsSync(filepath)).toBe(true);
  });

  test('properly closes file after upload', async () => {
    const content = 'File closure test';
    await uploadFile('closure.txt', content);
    
    const filepath = join(UPLOAD_DIR, 'closure.txt');
    const saved = readFileSync(filepath, 'utf-8');
    expect(saved).toBe(content);
  });

  test('streams file download', async () => {
    const content = 'Download this content';
    writeFileSync(join(UPLOAD_DIR, 'download.txt'), content);
    
    const res = await downloadFile('download.txt');
    
    expect(res.statusCode).toBe(200);
    expect(res.content.toString()).toBe(content);
    expect(res.headers['content-type']).toBe('text/plain');
  });

  test('handles binary file upload/download', async () => {
    const binary = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A]);
    await uploadFile('binary.dat', binary);
    
    const res = await downloadFile('binary.dat');
    expect(res.content).toEqual(binary);
  });

  test('preserves file content integrity', async () => {
    const original = 'The quick brown fox jumps over the lazy dog';
    await uploadFile('integrity.txt', original);
    
    const downloaded = await downloadFile('integrity.txt');
    expect(downloaded.content.toString()).toBe(original);
  });
});
