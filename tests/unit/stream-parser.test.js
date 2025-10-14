/**
 * Unit Tests: Stream Parser
 * Tests streaming utilities in isolation
 */

import { describe, test, expect } from '@jest/globals';
import { Readable, Writable } from 'stream';
import { streamToDestination, processChunks, parseJSON, parseForm } from '../../lib/utils/stream-parser.js';

describe('streamToDestination', () => {
  test('streams data to destination', async () => {
    const chunks = [Buffer.from('Hello'), Buffer.from(' '), Buffer.from('World')];
    const readable = Readable.from(chunks);
    
    const result = [];
    const writable = new Writable({
      write(chunk, encoding, callback) {
        result.push(chunk);
        callback();
      }
    });
    
    const bytes = await streamToDestination(readable, writable, 1024);
    
    expect(bytes).toBe(11);
    expect(Buffer.concat(result).toString()).toBe('Hello World');
  });

  test('enforces size limit', async () => {
    const largeChunk = Buffer.alloc(1000, 'A');
    const readable = Readable.from([largeChunk]);
    
    const writable = new Writable({
      write(chunk, encoding, callback) {
        callback();
      }
    });
    
    await expect(streamToDestination(readable, writable, 500))
      .rejects.toThrow('Upload exceeds limit');
  });

  test('handles backpressure', async () => {
    const chunks = Array(10).fill(Buffer.from('test'));
    const readable = Readable.from(chunks);
    
    let writeCount = 0;
    const writable = new Writable({
      highWaterMark: 1,
      write(chunk, encoding, callback) {
        writeCount++;
        setTimeout(callback, 10);
      }
    });
    
    await streamToDestination(readable, writable, 10000);
    expect(writeCount).toBe(10);
  });

  test('closes destination on completion', async () => {
    const readable = Readable.from([Buffer.from('test')]);
    
    let finished = false;
    const writable = new Writable({
      write(chunk, encoding, callback) {
        callback();
      },
      final(callback) {
        finished = true;
        callback();
      }
    });
    
    await streamToDestination(readable, writable, 1024);
    expect(finished).toBe(true);
  });

  test('handles stream errors', async () => {
    const readable = new Readable({
      read() {
        this.destroy(new Error('Stream error'));
      }
    });
    
    const writable = new Writable({
      write(chunk, encoding, callback) {
        callback();
      }
    });
    
    await expect(streamToDestination(readable, writable, 1024))
      .rejects.toThrow('Stream error');
  });
});

describe('processChunks', () => {
  test('processes each chunk individually', async () => {
    const chunks = [Buffer.from('a'), Buffer.from('b'), Buffer.from('c')];
    const readable = Readable.from(chunks);
    
    const processed = [];
    await processChunks(readable, async (chunk) => {
      processed.push(chunk.toString());
    }, 1024);
    
    expect(processed).toEqual(['a', 'b', 'c']);
  });

  test('enforces size limit in chunk processing', async () => {
    const chunks = [Buffer.alloc(600, 'X')];
    const readable = Readable.from(chunks);
    
    await expect(processChunks(readable, async () => {}, 500))
      .rejects.toThrow('Request too large');
  });

  test('handles async chunk processing', async () => {
    const readable = new Readable({
      read() {
        this.push(Buffer.from('1'));
        this.push(Buffer.from('2'));
        this.push(null);
      }
    });
    
    const results = [];
    await processChunks(readable, async (chunk) => {
      await new Promise(resolve => setImmediate(resolve));
      results.push(parseInt(chunk.toString()) * 2);
    }, 1024);
    
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]).toBe(2);
  });

  test('pauses stream during chunk processing', async () => {
    const chunks = [Buffer.from('a'), Buffer.from('b')];
    const readable = Readable.from(chunks);
    
    let processing = false;
    await processChunks(readable, async (chunk) => {
      expect(processing).toBe(false);
      processing = true;
      await new Promise(resolve => setTimeout(resolve, 10));
      processing = false;
    }, 1024);
  });
});

describe('parseJSON', () => {
  test('parses valid JSON', async () => {
    const json = { name: 'test', value: 123 };
    const readable = Readable.from([Buffer.from(JSON.stringify(json))]);
    
    const result = await parseJSON(readable, 1024);
    expect(result).toEqual(json);
  });

  test('rejects invalid JSON', async () => {
    const readable = Readable.from([Buffer.from('invalid json')]);
    
    await expect(parseJSON(readable, 1024))
      .rejects.toThrow('Invalid JSON');
  });

  test('enforces JSON size limit', async () => {
    const large = JSON.stringify({ data: 'x'.repeat(600) });
    const readable = Readable.from([Buffer.from(large)]);
    
    await expect(parseJSON(readable, 500))
      .rejects.toThrow('JSON body too large');
  });

  test('handles chunked JSON', async () => {
    const json = JSON.stringify({ key: 'value' });
    const chunks = json.split('').map(c => Buffer.from(c));
    const readable = Readable.from(chunks);
    
    const result = await parseJSON(readable, 1024);
    expect(result).toEqual({ key: 'value' });
  });
});

describe('parseForm', () => {
  test('parses URL encoded form data', async () => {
    const formData = 'name=John&age=30&city=NYC';
    const readable = Readable.from([Buffer.from(formData)]);
    
    const result = await parseForm(readable, 1024);
    expect(result).toEqual({ name: 'John', age: '30', city: 'NYC' });
  });

  test('handles empty form', async () => {
    const readable = Readable.from([Buffer.from('')]);
    
    const result = await parseForm(readable, 1024);
    expect(result).toEqual({});
  });

  test('enforces form size limit', async () => {
    const large = 'data=' + 'x'.repeat(600);
    const readable = Readable.from([Buffer.from(large)]);
    
    await expect(parseForm(readable, 500))
      .rejects.toThrow('Form too large');
  });

  test('handles special characters', async () => {
    const formData = 'email=test%40example.com&message=Hello%20World';
    const readable = Readable.from([Buffer.from(formData)]);
    
    const result = await parseForm(readable, 1024);
    expect(result).toEqual({ 
      email: 'test@example.com', 
      message: 'Hello World' 
    });
  });
});
