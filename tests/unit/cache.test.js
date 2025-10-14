/**
 * Unit tests for LRU Cache
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import LRUCache from '../../lib/utils/cache.js';

describe('LRUCache', () => {
  let cache;

  beforeEach(() => {
    cache = new LRUCache(3);
  });

  test('sets and gets values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  test('returns undefined for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  test('evicts least recently used item when max size exceeded', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4');

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBe('value2');
    expect(cache.get('key3')).toBe('value3');
    expect(cache.get('key4')).toBe('value4');
  });

  test('updates LRU order on get', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    
    cache.get('key1');
    
    cache.set('key4', 'value4');

    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBeUndefined();
  });

  test('deletes values', () => {
    cache.set('key1', 'value1');
    expect(cache.delete('key1')).toBe(true);
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.delete('key1')).toBe(false);
  });

  test('checks if key exists', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('key2')).toBe(false);
  });

  test('clears all values', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();
    
    expect(cache.getSize()).toBe(0);
    expect(cache.get('key1')).toBeUndefined();
  });

  test('respects TTL', async () => {
    const ttlCache = new LRUCache(10, 100);
    ttlCache.set('key1', 'value1');
    
    expect(ttlCache.get('key1')).toBe('value1');
    
    await new Promise((resolve) => setTimeout(resolve, 150));
    
    expect(ttlCache.get('key1')).toBeUndefined();
  });
});
