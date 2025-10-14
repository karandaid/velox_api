/**
 * Cookie parser for parsing Cookie header
 * @module cookie-parser
 */

import Cookie from './cookie.js';

/**
 * Cookie parser utility
 */
class CookieParser {
  /**
   * Parses cookie header string into object
   * @param {string} cookieHeader - Cookie header value
   * @returns {Object} Parsed cookies
   */
  static parse(cookieHeader) {
    const cookies = {};

    if (!cookieHeader) {
      return cookies;
    }

    const pairs = cookieHeader.split(';').map((p) => p.trim());

    for (const pair of pairs) {
      const [name, value] = pair.split('=');
      if (name && value) {
        cookies[name.trim()] = decodeURIComponent(value.trim());
      }
    }

    return cookies;
  }

  /**
   * Parses cookies into Cookie objects
   * @param {string} cookieHeader - Cookie header value
   * @returns {Map} Map of Cookie objects
   */
  static parseObjects(cookieHeader) {
    const cookieMap = new Map();
    
    if (!cookieHeader) {
      return cookieMap;
    }

    const pairs = cookieHeader.split(';').map((p) => p.trim());

    for (const pair of pairs) {
      const cookie = Cookie.parse(pair);
      cookieMap.set(cookie.name, cookie);
    }

    return cookieMap;
  }
}

export default CookieParser;
