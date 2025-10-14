/**
 * Unit tests for Radix Tree router
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import RadixTree from '../../lib/utils/radix-tree.js';

describe('RadixTree', () => {
  let tree;

  beforeEach(() => {
    tree = new RadixTree();
  });

  test('inserts and finds static routes', () => {
    const handler = () => 'test';
    tree.insert('/users', handler);

    const result = tree.search('/users');
    expect(result).not.toBeNull();
    expect(result.handler).toBe(handler);
    expect(result.params).toEqual({});
  });

  test('finds static routes from cache', () => {
    const handler = () => 'test';
    tree.insert('/users', handler);

    const result1 = tree.search('/users');
    const result2 = tree.search('/users');
    
    expect(result1.handler).toBe(result2.handler);
  });

  test('handles dynamic parameters without types', () => {
    const handler = () => 'test';
    tree.insert('/users/:id', handler);

    const result = tree.search('/users/123');
    expect(result).not.toBeNull();
    expect(result.params).toEqual({ id: '123' });
  });

  test('handles typed parameters with validation', () => {
    const handler = () => 'test';
    tree.insert('/users/:id=number', handler);

    const validResult = tree.search('/users/123');
    expect(validResult).not.toBeNull();
    expect(validResult.params.id).toBe(123);
    expect(typeof validResult.params.id).toBe('number');

    const invalidResult = tree.search('/users/abc');
    expect(invalidResult).toBeNull();
  });

  test('handles email type validation', () => {
    const handler = () => 'test';
    tree.insert('/contact/:email=email', handler);

    const validResult = tree.search('/contact/test@example.com');
    expect(validResult).not.toBeNull();
    expect(validResult.params.email).toBe('test@example.com');

    const invalidResult = tree.search('/contact/invalid-email');
    expect(invalidResult).toBeNull();
  });

  test('handles uuid type validation', () => {
    const handler = () => 'test';
    tree.insert('/items/:id=uuid', handler);

    const validResult = tree.search('/items/123e4567-e89b-12d3-a456-426614174000');
    expect(validResult).not.toBeNull();
    expect(validResult.params.id).toBe('123e4567-e89b-12d3-a456-426614174000');

    const invalidResult = tree.search('/items/not-a-uuid');
    expect(invalidResult).toBeNull();
  });

  test('handles slug type validation', () => {
    const handler = () => 'test';
    tree.insert('/blog/:slug=slug', handler);

    const validResult = tree.search('/blog/my-first-post');
    expect(validResult).not.toBeNull();
    expect(validResult.params.slug).toBe('my-first-post');

    const invalidResult = tree.search('/blog/My-Post');
    expect(invalidResult).toBeNull();
  });

  test('handles multiple parameters', () => {
    const handler = () => 'test';
    tree.insert('/users/:userId=number/posts/:postId=number', handler);

    const result = tree.search('/users/123/posts/456');
    expect(result).not.toBeNull();
    expect(result.params).toEqual({ userId: 123, postId: 456 });
  });

  test('handles mixed static and dynamic segments', () => {
    const handler = () => 'test';
    tree.insert('/api/v1/users/:id=number', handler);

    const result = tree.search('/api/v1/users/789');
    expect(result).not.toBeNull();
    expect(result.params.id).toBe(789);
  });

  test('returns null for non-matching routes', () => {
    tree.insert('/users', () => 'test');
    
    const result = tree.search('/posts');
    expect(result).toBeNull();
  });

  test('handles root route', () => {
    const handler = () => 'test';
    tree.insert('/', handler);

    const result = tree.search('/');
    expect(result).not.toBeNull();
    expect(result.handler).toBe(handler);
  });

  test('converts boolean parameters', () => {
    const handler = () => 'test';
    tree.insert('/settings/:enabled=boolean', handler);

    const result1 = tree.search('/settings/true');
    expect(result1.params.enabled).toBe(true);
    expect(typeof result1.params.enabled).toBe('boolean');

    const result2 = tree.search('/settings/false');
    expect(result2.params.enabled).toBe(false);

    const result3 = tree.search('/settings/1');
    expect(result3.params.enabled).toBe(true);
  });
});
