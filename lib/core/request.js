/**
 * Request class - Wraps Node.js IncomingMessage with utilities
 * Provides streaming body parsing with zero dependencies
 * @module request
 */

import { parse as parseUrl } from 'url';
import { parse as parseQueryString } from 'querystring';

/**
 * Request wrapper with streaming body parsers
 */
class Request {
  constructor(req) {
    this.req = req;
    this.url = req.url;
    this.method = req.method;
    this.headers = req.headers;
    
    const parsed = parseUrl(req.url, true);
    this.pathname = parsed.pathname;
    this.query = parsed.query;
    
    this._bodyParsed = false;
    this._body = null;
  }

  /**
   * Gets the full URL
   * @returns {string} Full request URL
   */
  getUrl() {
    return this.url;
  }

  /**
   * Gets the pathname
   * @returns {string} Request pathname
   */
  getPathname() {
    return this.pathname;
  }

  /**
   * Gets the HTTP method
   * @returns {string} HTTP method
   */
  getMethod() {
    return this.method;
  }

  /**
   * Gets a specific header
   * @param {string} name - Header name
   * @returns {string|undefined} Header value
   */
  getHeader(name) {
    return this.headers[name.toLowerCase()];
  }

  /**
   * Gets all headers
   * @returns {Object} All headers
   */
  getHeaders() {
    return this.headers;
  }

  /**
   * Gets query parameter(s)
   * @param {string} [key] - Specific query key
   * @returns {*} Query value or all query params
   */
  getQuery(key) {
    return key ? this.query[key] : this.query;
  }

  /**
   * Checks if request is secure (HTTPS)
   * @returns {boolean} True if HTTPS
   */
  isSecure() {
    return this.req.connection.encrypted || this.headers['x-forwarded-proto'] === 'https';
  }

  /**
   * Gets client IP address
   * @returns {string} Client IP
   */
  getClientIP() {
    const forwarded = this.headers['x-forwarded-for'];
    return forwarded ? forwarded.split(',')[0].trim() : this.req.connection.remoteAddress;
  }

  /**
   * Gets content type
   * @returns {string} Content-Type header value
   */
  getContentType() {
    return this.headers['content-type'] || '';
  }

  /**
   * Parses request body based on content type
   * Streaming implementation with size limits
   * @param {number} [maxSize=10485760] - Maximum body size in bytes (default 10MB)
   * @returns {Promise<*>} Parsed body
   */
  async getBody(maxSize = 10 * 1024 * 1024) {
    if (this._bodyParsed) {
      return this._body;
    }

    const fullContentType = this.getContentType();
    const contentType = fullContentType.split(';')[0].trim();
    
    const rawBody = await this._readBody(maxSize);
    
    if (!rawBody) {
      this._body = {};
      this._bodyParsed = true;
      return this._body;
    }

    switch (contentType) {
      case 'application/json':
        this._body = this._parseJSON(rawBody);
        break;
      case 'application/x-www-form-urlencoded':
        this._body = this._parseFormURLEncoded(rawBody);
        break;
      case 'multipart/form-data':
        this._body = await this._parseMultipart(rawBody, fullContentType);
        break;
      case 'text/plain':
        this._body = rawBody;
        break;
      case 'application/xml':
      case 'text/xml':
        this._body = this._parseXML(rawBody);
        break;
      default:
        this._body = rawBody;
    }

    this._bodyParsed = true;
    return this._body;
  }

  /**
   * Reads raw body from stream with size limit
   * @private
   * @param {number} maxSize - Maximum allowed size
   * @returns {Promise<string>} Raw body string
   */
  _readBody(maxSize) {
    return new Promise((resolve, reject) => {
      let body = '';
      let size = 0;

      this.req.on('data', (chunk) => {
        size += chunk.length;
        if (size > maxSize) {
          this.req.connection.destroy();
          reject(new Error(`Request body too large. Max: ${maxSize} bytes`));
          return;
        }
        body += chunk.toString();
      });

      this.req.on('end', () => {
        resolve(body);
      });

      this.req.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Parses JSON body
   * @private
   */
  _parseJSON(body) {
    try {
      return JSON.parse(body);
    } catch (error) {
      throw new Error('Invalid JSON in request body');
    }
  }

  /**
   * Parses URL-encoded form data
   * @private
   */
  _parseFormURLEncoded(body) {
    return parseQueryString(body);
  }

  /**
   * Parses multipart/form-data
   * Custom implementation without dependencies
   * @private
   */
  async _parseMultipart(body, contentType) {
    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    if (!boundaryMatch) {
      throw new Error('Missing boundary in multipart/form-data');
    }

    const boundary = '--' + boundaryMatch[1];
    const parts = body.split(boundary).slice(1, -1);
    const result = { fields: {}, files: {} };

    for (const part of parts) {
      if (!part.trim()) continue;

      const [headerSection, ...bodyParts] = part.split('\r\n\r\n');
      const content = bodyParts.join('\r\n\r\n').replace(/\r\n$/, '');

      const nameMatch = headerSection.match(/name="([^"]+)"/);
      if (!nameMatch) continue;

      const fieldName = nameMatch[1];
      const filenameMatch = headerSection.match(/filename="([^"]+)"/);

      if (filenameMatch) {
        result.files[fieldName] = {
          filename: filenameMatch[1],
          data: content,
          size: Buffer.byteLength(content),
        };
      } else {
        result.fields[fieldName] = content;
      }
    }

    return result;
  }

  /**
   * Parses XML body (basic implementation)
   * @private
   */
  _parseXML(body) {
    const result = {};
    const tagPattern = /<(\w+)>([^<]+)<\/\1>/g;
    let match;

    while ((match = tagPattern.exec(body)) !== null) {
      result[match[1]] = match[2];
    }

    return Object.keys(result).length > 0 ? result : body;
  }
}

export default Request;
