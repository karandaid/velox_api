/**
 * Cookie class for managing HTTP cookies
 * Provides signing and secure defaults
 * @module cookie
 */

import { createHmac } from 'crypto';

/**
 * Cookie class with secure defaults
 */
class Cookie {
  constructor(name, value, options = {}) {
    this.name = name;
    this.value = value;
    this.options = {
      httpOnly: options.httpOnly !== false,
      secure: options.secure !== false,
      sameSite: options.sameSite || 'Strict',
      maxAge: options.maxAge || null,
      path: options.path || '/',
      domain: options.domain || null,
    };
  }

  /**
   * Converts cookie to string format
   * @returns {string} Cookie string
   */
  toString() {
    let cookie = `${this.name}=${encodeURIComponent(this.value)}`;

    if (this.options.path) {
      cookie += `; Path=${this.options.path}`;
    }

    if (this.options.domain) {
      cookie += `; Domain=${this.options.domain}`;
    }

    if (this.options.maxAge) {
      cookie += `; Max-Age=${this.options.maxAge}`;
    }

    if (this.options.httpOnly) {
      cookie += '; HttpOnly';
    }

    if (this.options.secure) {
      cookie += '; Secure';
    }

    if (this.options.sameSite) {
      cookie += `; SameSite=${this.options.sameSite}`;
    }

    return cookie;
  }

  /**
   * Signs a cookie value with a secret
   * @param {string} secret - Secret key for signing
   * @returns {string} Signed value
   */
  sign(secret) {
    const signature = createHmac('sha256', secret).update(this.value).digest('hex');
    return `${this.value}.${signature}`;
  }

  /**
   * Verifies a signed cookie value
   * @param {string} signedValue - Signed cookie value
   * @param {string} secret - Secret key for verification
   * @returns {string|null} Original value if valid, null otherwise
   */
  static verify(signedValue, secret) {
    const parts = signedValue.split('.');
    if (parts.length !== 2) {
      return null;
    }

    const [value, signature] = parts;
    const expectedSignature = createHmac('sha256', secret).update(value).digest('hex');

    if (signature === expectedSignature) {
      return value;
    }

    return null;
  }

  /**
   * Parses a cookie string into a Cookie object
   * @param {string} cookieString - Cookie string
   * @returns {Cookie} Cookie instance
   */
  static parse(cookieString) {
    const parts = cookieString.split(';').map((p) => p.trim());
    const [nameValue] = parts;
    const [name, value] = nameValue.split('=');

    const options = {};

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.toLowerCase() === 'httponly') {
        options.httpOnly = true;
      } else if (part.toLowerCase() === 'secure') {
        options.secure = true;
      } else if (part.toLowerCase().startsWith('samesite=')) {
        options.sameSite = part.split('=')[1];
      } else if (part.toLowerCase().startsWith('max-age=')) {
        options.maxAge = parseInt(part.split('=')[1], 10);
      } else if (part.toLowerCase().startsWith('path=')) {
        options.path = part.split('=')[1];
      } else if (part.toLowerCase().startsWith('domain=')) {
        options.domain = part.split('=')[1];
      }
    }

    return new Cookie(name, decodeURIComponent(value), options);
  }
}

export default Cookie;
