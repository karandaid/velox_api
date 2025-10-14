/**
 * Unit Tests: Router
 * Tests routing functionality in isolation
 */

import { describe, test, expect } from '@jest/globals';
import { VeloxRouter } from '../../lib/index.js';

describe('VeloxRouter', () => {
  test('creates router instance', () => {
    const router = new VeloxRouter();
    expect(router).toBeDefined();
  });

  test('registers GET route', () => {
    const router = new VeloxRouter();
    const handler = () => {};
    
    router.get('/test', handler);
    const route = router.find('GET', '/test');
    
    expect(route).toBeDefined();
    expect(route.handler).toBe(handler);
  });

  test('registers POST route', () => {
    const router = new VeloxRouter();
    const handler = () => {};
    
    router.post('/api/data', handler);
    const route = router.find('POST', '/api/data');
    
    expect(route).toBeDefined();
  });

  test('registers all HTTP methods', () => {
    const router = new VeloxRouter();
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    
    methods.forEach(method => {
      router[method](`/${method}`, () => {});
      const route = router.find(method.toUpperCase(), `/${method}`);
      expect(route).toBeDefined();
    });
  });

  test('finds static routes', () => {
    const router = new VeloxRouter();
    router.get('/users', () => 'users');
    
    const route = router.find('GET', '/users');
    expect(route).toBeDefined();
    expect(route.params).toEqual({});
  });

  test('finds dynamic routes with parameters', () => {
    const router = new VeloxRouter();
    router.get('/users/:id', () => {});
    
    const route = router.find('GET', '/users/123');
    expect(route).toBeDefined();
    expect(route.params).toEqual({ id: '123' });
  });

  test('finds routes with multiple parameters', () => {
    const router = new VeloxRouter();
    router.get('/users/:userId/posts/:postId', () => {});
    
    const route = router.find('GET', '/users/42/posts/99');
    expect(route).toBeDefined();
    expect(route.params).toEqual({ userId: '42', postId: '99' });
  });

  test('finds routes with typed parameters', () => {
    const router = new VeloxRouter();
    router.get('/users/:id=number', () => {});
    
    const route = router.find('GET', '/users/123');
    expect(route).toBeDefined();
    expect(route.params.id).toBe(123);
  });

  test('returns null for non-existent routes', () => {
    const router = new VeloxRouter();
    router.get('/exists', () => {});
    
    const route = router.find('GET', '/does-not-exist');
    expect(route).toBeNull();
  });

  test('distinguishes between different HTTP methods', () => {
    const router = new VeloxRouter();
    router.get('/resource', () => 'GET');
    router.post('/resource', () => 'POST');
    
    const getRoute = router.find('GET', '/resource');
    const postRoute = router.find('POST', '/resource');
    
    expect(getRoute.handler()).toBe('GET');
    expect(postRoute.handler()).toBe('POST');
  });

  test('handles routes with trailing slashes', () => {
    const router = new VeloxRouter();
    router.get('/api/users/', () => {});
    
    const route = router.find('GET', '/api/users/');
    expect(route).toBeDefined();
  });

  test('validates typed parameters correctly', () => {
    const router = new VeloxRouter();
    router.get('/items/:id=number', () => {});
    
    const validRoute = router.find('GET', '/items/123');
    expect(validRoute).toBeDefined();
    expect(validRoute.params.id).toBe(123);
    
    const invalidRoute = router.find('GET', '/items/abc');
    expect(invalidRoute).toBeNull();
  });

  test('supports wildcard routes', () => {
    const router = new VeloxRouter();
    router.get('/files/*', () => {});
    
    const route1 = router.find('GET', '/files/doc.pdf');
    const route2 = router.find('GET', '/files/images/pic.jpg');
    
    expect(route1).toBeDefined();
    expect(route2).toBeDefined();
  });
});
