/**
 * Response class - Wraps Node.js ServerResponse with utilities
 * Provides streaming methods for optimal performance
 * @module response
 */

import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { resolve, extname } from 'path';
import { getMimeType } from '../utils/mime-types.js';

/**
 * Response wrapper with streaming capabilities
 */
class Response {
  constructor(res, req) {
    this.res = res;
    this.req = req;
    this._headersSent = false;
  }

  /**
   * Sets HTTP status code
   * @param {number} code - HTTP status code
   * @returns {Response} Response instance for chaining
   */
  status(code) {
    this.res.statusCode = code;
    return this;
  }

  /**
   * Sets a response header
   * @param {string|Object} name - Header name or object of headers
   * @param {string} [value] - Header value
   * @returns {Response} Response instance for chaining
   */
  setHeader(name, value) {
    if (typeof name === 'object') {
      for (const [key, val] of Object.entries(name)) {
        this.res.setHeader(key, val);
      }
    } else {
      this.res.setHeader(name, value);
    }
    return this;
  }

  /**
   * Sends plain text response
   * @param {string} text - Text content
   */
  sendText(text) {
    this.setHeader('Content-Type', 'text/plain; charset=utf-8');
    this.res.end(text);
  }

  /**
   * Sends HTML response
   * @param {string} html - HTML content
   */
  sendHTML(html) {
    this.setHeader('Content-Type', 'text/html; charset=utf-8');
    this.res.end(html);
  }

  /**
   * Sends JSON response
   * @param {*} data - Data to stringify as JSON
   */
  sendJSON(data) {
    this.setHeader('Content-Type', 'application/json; charset=utf-8');
    this.res.end(JSON.stringify(data));
  }

  /**
   * Sends buffer response
   * @param {Buffer} buffer - Buffer data
   * @param {string} [contentType='application/octet-stream'] - Content type
   */
  sendBuffer(buffer, contentType = 'application/octet-stream') {
    this.setHeader('Content-Type', contentType);
    this.setHeader('Content-Length', buffer.length);
    this.res.end(buffer);
  }

  /**
   * Sends file response with streaming
   * Supports range requests for partial content
   * @param {string} filePath - Path to file
   * @param {string} [baseDir=process.cwd()] - Base directory for security
   */
  async sendFile(filePath, baseDir = process.cwd()) {
    try {
      const safePath = this._securePath(filePath, baseDir);
      const stats = await stat(safePath);

      if (!stats.isFile()) {
        return this.sendError('Not a file', 400);
      }

      const mimeType = getMimeType(extname(safePath));
      const range = this.req.headers.range;

      if (range) {
        return this._sendRangeFile(safePath, stats.size, range, mimeType);
      }

      this.setHeader('Content-Type', mimeType);
      this.setHeader('Content-Length', stats.size);

      const stream = createReadStream(safePath);
      stream.pipe(this.res);

      stream.on('error', (error) => {
        console.error('File stream error:', error);
        if (!this.res.headersSent) {
          this.sendError('Error reading file', 500);
        }
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.sendError('File not found', 404);
      } else {
        console.error('sendFile error:', error);
        this.sendError('Internal server error', 500);
      }
    }
  }

  /**
   * Sends partial file content (range request)
   * @private
   */
  _sendRangeFile(filePath, fileSize, rangeHeader, mimeType) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    this.status(206);
    this.setHeader({
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mimeType,
    });

    const stream = createReadStream(filePath, { start, end });
    stream.pipe(this.res);
  }

  /**
   * Sends error response
   * @param {string} message - Error message
   * @param {number} [statusCode=500] - HTTP status code
   */
  sendError(message, statusCode = 500) {
    this.status(statusCode).sendJSON({ error: message });
  }

  /**
   * Redirects to a different URL
   * @param {string} url - Redirect URL
   * @param {number} [statusCode=302] - Redirect status code
   */
  redirect(url, statusCode = 302) {
    this.status(statusCode).setHeader('Location', url);
    this.res.end();
  }

  /**
   * Sets CORS headers
   * @param {string} [origin='*'] - Allowed origin
   * @param {string} [methods='GET,POST,PUT,DELETE,PATCH'] - Allowed methods
   * @param {string} [headers='Content-Type'] - Allowed headers
   * @returns {Response} Response instance for chaining
   */
  setCORS(origin = '*', methods = 'GET,POST,PUT,DELETE,PATCH', headers = 'Content-Type') {
    this.setHeader({
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': methods,
      'Access-Control-Allow-Headers': headers,
    });
    return this;
  }

  /**
   * Ends the response
   * @param {string} [data=''] - Optional data to send
   */
  end(data = '') {
    this.res.end(data);
  }

  /**
   * Secures file path against traversal attacks
   * @private
   */
  _securePath(filePath, baseDir) {
    const safePath = resolve(baseDir, filePath);
    const safeBase = resolve(baseDir);

    if (!safePath.startsWith(safeBase)) {
      throw new Error('Path traversal detected');
    }

    return safePath;
  }
}

export default Response;
