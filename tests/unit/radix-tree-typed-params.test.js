/**
 * Unit Tests: Radix Tree with Multiple Typed Parameters
 * Tests handling of same route path with different parameter types
 */

import { describe, test, expect } from '@jest/globals';
import RadixTree from '../../lib/utils/radix-tree.js';

describe('RadixTree - Multiple Typed Parameters', () => {
  describe('Same parameter name, different types', () => {
    test('should handle string and number types for same parameter', () => {
      const tree = new RadixTree();
      
      const stringHandler = (res) => res.sendJSON({ type: 'string' });
      const numberHandler = (res) => res.sendJSON({ type: 'number' });
      
      tree.insert('/users/:id=string', stringHandler);
      tree.insert('/users/:id=number', numberHandler);
      
      // Test string route
      const stringResult = tree.search('/users/abc');
      expect(stringResult).toBeTruthy();
      expect(stringResult.handler).toBe(stringHandler);
      expect(stringResult.params.id).toBe('abc');
      
      // Test number route
      const numberResult = tree.search('/users/123');
      expect(numberResult).toBeTruthy();
      expect(numberResult.handler).toBe(numberHandler);
      expect(numberResult.params.id).toBe(123);
    });
    
    test('should handle int and float types for same parameter', () => {
      const tree = new RadixTree();
      
      const intHandler = (res) => res.sendJSON({ type: 'int' });
      const floatHandler = (res) => res.sendJSON({ type: 'float' });
      
      tree.insert('/products/:price=int', intHandler);
      tree.insert('/products/:price=float', floatHandler);
      
      // Test int route
      const intResult = tree.search('/products/100');
      expect(intResult).toBeTruthy();
      expect(intResult.handler).toBe(intHandler);
      expect(intResult.params.price).toBe(100);
      
      // Test float route
      const floatResult = tree.search('/products/99.99');
      expect(floatResult).toBeTruthy();
      expect(floatResult.handler).toBe(floatHandler);
      expect(floatResult.params.price).toBe(99.99);
    });
    
    test('should handle uuid and slug types for same parameter', () => {
      const tree = new RadixTree();
      
      const uuidHandler = (res) => res.sendJSON({ type: 'uuid' });
      const slugHandler = (res) => res.sendJSON({ type: 'slug' });
      
      tree.insert('/posts/:id=uuid', uuidHandler);
      tree.insert('/posts/:id=slug', slugHandler);
      
      // Test UUID route
      const uuidResult = tree.search('/posts/550e8400-e29b-41d4-a716-446655440000');
      expect(uuidResult).toBeTruthy();
      expect(uuidResult.handler).toBe(uuidHandler);
      
      // Test slug route
      const slugResult = tree.search('/posts/my-blog-post');
      expect(slugResult).toBeTruthy();
      expect(slugResult.handler).toBe(slugHandler);
    });
  });
  
  describe('Multiple parameters with different types', () => {
    test('should handle multiple typed parameters in single route', () => {
      const tree = new RadixTree();
      
      const handler = (res) => res.sendJSON({ ok: true });
      tree.insert('/api/:version=number/users/:id=uuid', handler);
      
      const result = tree.search('/api/2/users/550e8400-e29b-41d4-a716-446655440000');
      
      expect(result).toBeTruthy();
      expect(result.handler).toBe(handler);
      expect(result.params.version).toBe(2);
      expect(result.params.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
    
    test('should handle complex multi-param routing', () => {
      const tree = new RadixTree();
      
      const handler1 = (res) => res.sendJSON({ route: 1 });
      const handler2 = (res) => res.sendJSON({ route: 2 });
      const handler3 = (res) => res.sendJSON({ route: 3 });
      
      tree.insert('/api/:version=int/users/:id=number', handler1);
      tree.insert('/api/:version=int/users/:id=string', handler2);
      tree.insert('/api/:version=float/users/:id=uuid', handler3);
      
      // Route 1: int version, number id
      const result1 = tree.search('/api/1/users/123');
      expect(result1.handler).toBe(handler1);
      expect(result1.params.version).toBe(1);
      expect(result1.params.id).toBe(123);
      
      // Route 2: int version, string id
      const result2 = tree.search('/api/1/users/abc');
      expect(result2.handler).toBe(handler2);
      expect(result2.params.version).toBe(1);
      expect(result2.params.id).toBe('abc');
      
      // Route 3: float version, uuid id
      const result3 = tree.search('/api/1.5/users/550e8400-e29b-41d4-a716-446655440000');
      expect(result3.handler).toBe(handler3);
      expect(result3.params.version).toBe(1.5);
    });
  });
  
  describe('Edge cases and validation', () => {
    test('should return null for invalid parameter types', () => {
      const tree = new RadixTree();
      
      tree.insert('/users/:id=number', (res) => res.sendJSON({ ok: true }));
      
      // Invalid: string when expecting number
      const result = tree.search('/users/abc');
      expect(result).toBeNull();
    });
    
    test('should handle email validation correctly', () => {
      const tree = new RadixTree();
      
      const emailHandler = (res) => res.sendJSON({ type: 'email' });
      const stringHandler = (res) => res.sendJSON({ type: 'string' });
      
      tree.insert('/verify/:email=email', emailHandler);
      tree.insert('/verify/:email=string', stringHandler);
      
      // Valid email
      const emailResult = tree.search('/verify/test@example.com');
      expect(emailResult).toBeTruthy();
      expect(emailResult.handler).toBe(emailHandler);
      
      // Invalid email, but valid string
      const stringResult = tree.search('/verify/not-an-email');
      expect(stringResult).toBeTruthy();
      expect(stringResult.handler).toBe(stringHandler);
    });
    
    test('should handle url validation correctly', () => {
      const tree = new RadixTree();
      
      const urlHandler = (res) => res.sendJSON({ type: 'url' });
      const stringHandler = (res) => res.sendJSON({ type: 'string' });
      
      tree.insert('/redirect/:url=url', urlHandler);
      tree.insert('/redirect/:url=string', stringHandler);
      
      // Note: URLs with :// break path routing, so we use URL-encoded or simple domains
      // Valid URL pattern (domain-like)
      const validResult = tree.search('/redirect/example.com');
      expect(validResult).toBeTruthy();
      
      // Invalid URL, matches string
      const invalidResult = tree.search('/redirect/not-url');
      expect(invalidResult).toBeTruthy();
      expect(invalidResult.handler).toBe(stringHandler);
    });
    
    test('should handle boolean type correctly', () => {
      const tree = new RadixTree();
      
      const boolHandler = (res) => res.sendJSON({ type: 'bool' });
      tree.insert('/settings/:enabled=boolean', boolHandler);
      
      // True values
      const trueResult = tree.search('/settings/true');
      expect(trueResult).toBeTruthy();
      expect(trueResult.params.enabled).toBe(true);
      
      // False values
      const falseResult = tree.search('/settings/false');
      expect(falseResult).toBeTruthy();
      expect(falseResult.params.enabled).toBe(false);
      
      // Invalid boolean
      const invalidResult = tree.search('/settings/maybe');
      expect(invalidResult).toBeNull();
    });
    
    test('should handle hex validation', () => {
      const tree = new RadixTree();
      
      tree.insert('/colors/:code=hex', (res) => res.sendJSON({ ok: true }));
      
      // Valid hex
      const validResult = tree.search('/colors/FF5733');
      expect(validResult).toBeTruthy();
      expect(validResult.params.code).toBe('FF5733');
      
      // Invalid hex
      const invalidResult = tree.search('/colors/ZZZZZZ');
      expect(invalidResult).toBeNull();
    });
  });
  
  describe('Priority and route matching order', () => {
    test('should match most specific type first', () => {
      const tree = new RadixTree();
      
      const intHandler = (res) => res.sendJSON({ type: 'int' });
      const numberHandler = (res) => res.sendJSON({ type: 'number' });
      const stringHandler = (res) => res.sendJSON({ type: 'string' });
      
      // Insert in different order
      tree.insert('/items/:id=string', stringHandler);
      tree.insert('/items/:id=int', intHandler);
      tree.insert('/items/:id=number', numberHandler);
      
      // Integer should match int (most specific)
      const intResult = tree.search('/items/123');
      expect(intResult.handler).toBe(intHandler);
      expect(intResult.params.id).toBe(123);
      
      // Float should match number
      const floatResult = tree.search('/items/123.45');
      expect(floatResult.handler).toBe(numberHandler);
      expect(floatResult.params.id).toBe(123.45);
      
      // String
      const stringResult = tree.search('/items/abc');
      expect(stringResult.handler).toBe(stringHandler);
      expect(stringResult.params.id).toBe('abc');
    });
    
    test('should handle overlapping validations correctly', () => {
      const tree = new RadixTree();
      
      const emailHandler = (res) => res.sendJSON({ type: 'email' });
      const alphaHandler = (res) => res.sendJSON({ type: 'alpha' });
      
      tree.insert('/contact/:input=email', emailHandler);
      tree.insert('/contact/:input=alpha', alphaHandler);
      
      // Email match
      const emailResult = tree.search('/contact/user@example.com');
      expect(emailResult.handler).toBe(emailHandler);
      
      // Alpha match (no @ sign)
      const alphaResult = tree.search('/contact/username');
      expect(alphaResult.handler).toBe(alphaHandler);
    });
  });
  
  describe('Performance with many typed routes', () => {
    test('should efficiently handle many typed parameter variations', () => {
      const tree = new RadixTree();
      
      // Create handlers individually for stable references
      const alphaHandler = (res) => res.sendJSON({ type: 'alpha' });
      const intHandler = (res) => res.sendJSON({ type: 'int' });
      const floatHandler = (res) => res.sendJSON({ type: 'float' });
      const emailHandler = (res) => res.sendJSON({ type: 'email' });
      const uuidHandler = (res) => res.sendJSON({ type: 'uuid' });
      const slugHandler = (res) => res.sendJSON({ type: 'slug' });
      const alphanumHandler = (res) => res.sendJSON({ type: 'alphanumeric' });
      const hexHandler = (res) => res.sendJSON({ type: 'hex' });
      const boolHandler = (res) => res.sendJSON({ type: 'boolean' });
      const stringHandler = (res) => res.sendJSON({ type: 'string' });
      
      tree.insert('/data/:value=alpha', alphaHandler);
      tree.insert('/data/:value=int', intHandler);
      tree.insert('/data/:value=float', floatHandler);
      tree.insert('/data/:value=email', emailHandler);
      tree.insert('/data/:value=uuid', uuidHandler);
      tree.insert('/data/:value=slug', slugHandler);
      tree.insert('/data/:value=alphanumeric', alphanumHandler);
      tree.insert('/data/:value=hex', hexHandler);
      tree.insert('/data/:value=boolean', boolHandler);
      tree.insert('/data/:value=string', stringHandler);
      
      // Test each type with non-overlapping inputs
      expect(tree.search('/data/ABC').handler).toBe(alphaHandler);
      expect(tree.search('/data/123').handler).toBe(intHandler);
      expect(tree.search('/data/123.45').handler).toBe(floatHandler);
      expect(tree.search('/data/test@example.com').handler).toBe(emailHandler);
      expect(tree.search('/data/550e8400-e29b-41d4-a716-446655440000').handler).toBe(uuidHandler);
      expect(tree.search('/data/my-slug').handler).toBe(slugHandler);
      expect(tree.search('/data/abc123XYZ').handler).toBe(alphanumHandler);
      // Note: hex, boolean conflict with other types - test separately
      expect(tree.search('/data/anything_else!').handler).toBe(stringHandler);
    });
    
    test('should handle hex validation separately', () => {
      const tree = new RadixTree();
      const hexHandler = (res) => res.sendJSON({ type: 'hex' });
      tree.insert('/colors/:code=hex', hexHandler);
      
      expect(tree.search('/colors/FF5733').handler).toBe(hexHandler);
      expect(tree.search('/colors/DEADBEEF').handler).toBe(hexHandler);
      expect(tree.search('/colors/GGGGGG')).toBeNull();  // Invalid hex
    });
  });
  
  describe('Deep nesting with typed parameters', () => {
    test('should handle deeply nested routes with multiple typed params', () => {
      const tree = new RadixTree();
      
      const handler = (res) => res.sendJSON({ ok: true });
      tree.insert('/api/:version=int/orgs/:orgId=uuid/projects/:projectId=number/files/:fileId=string', handler);
      
      const result = tree.search('/api/1/orgs/550e8400-e29b-41d4-a716-446655440000/projects/42/files/report.pdf');
      
      expect(result).toBeTruthy();
      expect(result.params.version).toBe(1);
      expect(result.params.orgId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.params.projectId).toBe(42);
      expect(result.params.fileId).toBe('report.pdf');
    });
    
    test('should handle variations at different nesting levels', () => {
      const tree = new RadixTree();
      
      const handler1 = (res) => res.sendJSON({ route: 1 });
      const handler2 = (res) => res.sendJSON({ route: 2 });
      
      tree.insert('/api/:v=int/items/:id=number', handler1);
      tree.insert('/api/:v=int/items/:id=string', handler2);
      
      const result1 = tree.search('/api/1/items/123');
      expect(result1.handler).toBe(handler1);
      expect(result1.params.id).toBe(123);
      
      const result2 = tree.search('/api/1/items/abc');
      expect(result2.handler).toBe(handler2);
      expect(result2.params.id).toBe('abc');
    });
  });
});
