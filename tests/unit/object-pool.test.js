/**
 * Unit Tests: Object Pool
 * Tests object pooling functionality in isolation
 */

import { describe, test, expect } from '@jest/globals';
import { ObjectPool, createRequestPool, createResponsePool } from '../../lib/utils/object-pool.js';

describe('ObjectPool', () => {
  test('creates pool with factory function', () => {
    const pool = new ObjectPool(() => ({ id: Math.random() }), (obj) => obj);
    expect(pool).toBeDefined();
    expect(pool.getStats().pooled).toBe(0);
  });

  test('acquires objects from pool', () => {
    const pool = new ObjectPool(() => ({ value: 0 }), (obj) => { obj.value = 0; });
    const obj = pool.acquire();
    
    expect(obj).toBeDefined();
    expect(obj.value).toBe(0);
    expect(pool.getStats().active).toBe(1);
  });

  test('releases objects back to pool', () => {
    const pool = new ObjectPool(() => ({ value: 0 }), (obj) => { obj.value = 0; });
    
    const obj = pool.acquire();
    obj.value = 42;
    pool.release(obj);
    
    expect(pool.getStats().pooled).toBe(1);
    expect(pool.getStats().active).toBe(0);
  });

  test('resets objects when released', () => {
    const pool = new ObjectPool(
      () => ({ value: 0, used: false }),
      (obj) => { obj.value = 0; obj.used = false; }
    );
    
    const obj = pool.acquire();
    obj.value = 100;
    obj.used = true;
    
    pool.release(obj);
    const obj2 = pool.acquire();
    
    expect(obj2.value).toBe(0);
    expect(obj2.used).toBe(false);
  });

  test('reuses pooled objects', () => {
    const pool = new ObjectPool(() => ({ id: Math.random() }), (obj) => obj);
    
    const obj1 = pool.acquire();
    const id1 = obj1.id;
    pool.release(obj1);
    
    const obj2 = pool.acquire();
    expect(obj2.id).toBe(id1);
  });

  test('respects max pool size', () => {
    const pool = new ObjectPool(() => ({ id: 0 }), (obj) => obj, 2);
    
    const obj1 = pool.acquire();
    const obj2 = pool.acquire();
    const obj3 = pool.acquire();
    
    pool.release(obj1);
    pool.release(obj2);
    pool.release(obj3);
    
    expect(pool.getStats().pooled).toBe(2);
  });

  test('tracks statistics correctly', () => {
    const pool = new ObjectPool(() => ({}), (obj) => obj);
    
    const obj1 = pool.acquire();
    const obj2 = pool.acquire();
    pool.release(obj1);
    
    const stats = pool.getStats();
    expect(stats.active).toBe(1);
    expect(stats.pooled).toBe(1);
    expect(stats.total).toBe(2);
  });

  test('handles multiple acquire/release cycles', () => {
    const pool = new ObjectPool(() => ({ count: 0 }), (obj) => { obj.count = 0; });
    
    for (let i = 0; i < 100; i++) {
      const obj = pool.acquire();
      obj.count = i;
      pool.release(obj);
    }
    
    const stats = pool.getStats();
    expect(stats.pooled).toBeGreaterThan(0);
    expect(stats.active).toBe(0);
  });
});

describe('Request Pool Factory', () => {
  test('creates request pool', () => {
    const pool = createRequestPool();
    expect(pool).toBeDefined();
  });

  test('acquires request objects', () => {
    const pool = createRequestPool();
    const req = pool.acquire();
    
    expect(req).toBeDefined();
    expect(req.headers).toBeNull();
    expect(req.query).toBeNull();
    expect(req.body).toBeNull();
  });

  test('resets request objects on release', () => {
    const pool = createRequestPool();
    const req = pool.acquire();
    
    req.headers = { 'content-type': 'application/json' };
    req.query = { page: '1' };
    req.body = { name: 'test' };
    
    pool.release(req);
    const req2 = pool.acquire();
    
    expect(req2.headers).toBeNull();
    expect(req2.query).toBeNull();
    expect(req2.body).toBeNull();
  });
});

describe('Response Pool Factory', () => {
  test('creates response pool', () => {
    const pool = createResponsePool();
    expect(pool).toBeDefined();
  });

  test('acquires response objects', () => {
    const pool = createResponsePool();
    const res = pool.acquire();
    
    expect(res).toBeDefined();
    expect(res.res).toBeNull();
    expect(res._headersSent).toBe(false);
  });

  test('resets response objects on release', () => {
    const pool = createResponsePool();
    const res = pool.acquire();
    
    res.res = { mock: 'response' };
    res._headersSent = true;
    
    pool.release(res);
    const res2 = pool.acquire();
    
    expect(res2.res).toBeNull();
    expect(res2._headersSent).toBe(false);
  });
});
