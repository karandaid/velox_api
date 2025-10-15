/**
 * Unit tests for parameter validators
 */

import { describe, test, expect } from '@jest/globals';
import { validateParam, convertParam } from '../../lib/utils/validators.js';

describe('Validators', () => {
  describe('validateParam', () => {
    test('validates number type', () => {
      expect(validateParam('123', 'number')).toBe(true);
      expect(validateParam('abc', 'number')).toBe(false);
      expect(validateParam('12.34', 'number')).toBe(true); // Changed: number now accepts floats
    });

    test('validates string type', () => {
      // String has no validator - it's a wildcard fallback that accepts anything
      expect(validateParam('hello', 'string')).toBe(true);
      expect(validateParam('hello123', 'string')).toBe(true); // Changed: string is wildcard
      expect(validateParam('123', 'string')).toBe(true); // Changed: string is wildcard
    });

    test('validates email type', () => {
      expect(validateParam('test@example.com', 'email')).toBe(true);
      expect(validateParam('invalid.email', 'email')).toBe(false);
      expect(validateParam('@example.com', 'email')).toBe(false);
    });

    test('validates uuid type', () => {
      expect(validateParam('123e4567-e89b-12d3-a456-426614174000', 'uuid')).toBe(true);
      expect(validateParam('not-a-uuid', 'uuid')).toBe(false);
    });

    test('validates slug type', () => {
      expect(validateParam('my-blog-post', 'slug')).toBe(true);
      expect(validateParam('My-Blog-Post', 'slug')).toBe(false);
      expect(validateParam('my_blog_post', 'slug')).toBe(false);
    });
  });

  describe('convertParam', () => {
    test('converts number strings to numbers', () => {
      expect(convertParam('123', 'number')).toBe(123);
      expect(typeof convertParam('123', 'number')).toBe('number');
    });

    test('converts boolean strings to booleans', () => {
      expect(convertParam('true', 'boolean')).toBe(true);
      expect(convertParam('false', 'boolean')).toBe(false);
      expect(convertParam('1', 'boolean')).toBe(true);
      expect(convertParam('0', 'boolean')).toBe(false);
    });

    test('returns original value for other types', () => {
      expect(convertParam('test', 'string')).toBe('test');
      expect(convertParam('test@example.com', 'email')).toBe('test@example.com');
    });
  });
});
