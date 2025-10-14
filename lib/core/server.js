/**
 * VeloxServer - High-performance HTTP/HTTPS server
 * Built on native Node.js http/https modules
 * @module server
 */

import http from 'http';
import https from 'https';
import Request from './request.js';
import Response from './response.js';
import { createRequestPool, createResponsePool } from '../utils/object-pool.js';

/**
 * VeloxServer class for creating HTTP/HTTPS servers
 */
class VeloxServer {
  constructor() {
    this.port = 3000;
    this.host = '0.0.0.0';
    this.router = null;
    this.server = null;
    this.isHttps = false;
    this.sslOptions = null;
    this.requestPool = createRequestPool(1000);
    this.responsePool = createResponsePool(1000);
    this.enablePooling = true;
  }

  /**
   * Sets the port for the server
   * @param {number} port - Port number
   * @returns {VeloxServer} Server instance for chaining
   */
  setPort(port) {
    this.port = port;
    return this;
  }

  /**
   * Sets the host for the server
   * @param {string} host - Host address
   * @returns {VeloxServer} Server instance for chaining
   */
  setHost(host) {
    this.host = host;
    return this;
  }

  /**
   * Sets the router for handling requests
   * @param {VeloxRouter} router - Router instance
   * @returns {VeloxServer} Server instance for chaining
   */
  setRouter(router) {
    this.router = router;
    return this;
  }

  /**
   * Enables HTTPS with SSL options
   * @param {Object} options - SSL options (key, cert)
   * @returns {VeloxServer} Server instance for chaining
   */
  enableHTTPS(options) {
    this.isHttps = true;
    this.sslOptions = options;
    return this;
  }

  /**
   * Starts the server
   * @returns {http.Server|https.Server} Server instance
   */
  start() {
    const requestHandler = async (req, res) => {
      try {
        await this._handleRequest(req, res);
      } catch (error) {
        console.error('Request handling error:', error);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      }
    };

    if (this.isHttps && this.sslOptions) {
      this.server = https.createServer(this.sslOptions, requestHandler);
    } else {
      this.server = http.createServer(requestHandler);
    }

    this.server.listen(this.port, this.host, () => {
      const protocol = this.isHttps ? 'https' : 'http';
      console.log(`🚀 VeloxAPI server running at ${protocol}://${this.host}:${this.port}`);
    });

    return this.server;
  }

  /**
   * Stops the server gracefully
   * @param {Function} [callback] - Callback function
   */
  stop(callback) {
    if (this.server) {
      this.server.close(callback);
    }
  }

  /**
   * Alias for stop
   * @param {Function} [callback] - Callback function
   */
  close(callback) {
    this.stop(callback);
  }

  /**
   * Gets server statistics including pool usage
   * @returns {Object} Server stats
   */
  getStats() {
    return {
      requestPool: this.requestPool.getStats(),
      responsePool: this.responsePool.getStats(),
      poolingEnabled: this.enablePooling,
    };
  }

  /**
   * Handles incoming HTTP requests
   * @private
   */
  async _handleRequest(req, res) {
    if (!this.router) {
      res.statusCode = 500;
      res.end('No router configured');
      return;
    }

    const request = new Request(req);
    const response = new Response(res, req);

    const pathname = request.getPathname();
    const method = request.getMethod();

    const match = this.router.find(method, pathname);

    if (!match) {
      response.status(404).sendJSON({ error: 'Not found', path: pathname });
      return;
    }

    const query = request.getQuery();
    const params = match.params;

    if (this.router.middlewares.length > 0) {
      await this.router.executeMiddlewares(
        response,
        request,
        query,
        params,
        null,
        () => match.handler(response, request, query, params)
      );
    } else {
      await match.handler(response, request, query, params);
    }
  }
}

export default VeloxServer;
