/**
 * VeloxRouter - High-performance router with radix tree
 * Supports typed parameters, middleware, and route grouping
 * @module router
 */

import RadixTree from '../utils/radix-tree.js';
import LRUCache from '../utils/cache.js';

/**
 * VeloxRouter class for defining and matching routes
 */
class VeloxRouter {
  constructor() {
    this.trees = {
      GET: new RadixTree(),
      POST: new RadixTree(),
      PUT: new RadixTree(),
      DELETE: new RadixTree(),
      PATCH: new RadixTree(),
      HEAD: new RadixTree(),
      OPTIONS: new RadixTree(),
    };
    
    this.middlewares = [];
    this.prefix = '';
    this.cache = new LRUCache(1000, 5 * 60 * 1000);
  }

  /**
   * Sets a prefix for all routes
   * @param {string} prefix - Route prefix
   * @returns {VeloxRouter} Router instance for chaining
   */
  setPrefix(prefix) {
    this.prefix = prefix.replace(/\/+$/, '');
    return this;
  }

  /**
   * Adds a GET route with optional middleware
   * @param {string} path - Route path
   * @param {...Function} handlers - Middleware functions and final handler
   * @returns {VeloxRouter} Router instance for chaining
   */
  get(path, ...handlers) {
    return this.addRoute('GET', path, ...handlers);
  }

  /**
   * Adds a POST route with optional middleware
   * @param {string} path - Route path
   * @param {...Function} handlers - Middleware functions and final handler
   * @returns {VeloxRouter} Router instance for chaining
   */
  post(path, ...handlers) {
    return this.addRoute('POST', path, ...handlers);
  }

  /**
   * Adds a PUT route with optional middleware
   * @param {string} path - Route path
   * @param {...Function} handlers - Middleware functions and final handler
   * @returns {VeloxRouter} Router instance for chaining
   */
  put(path, ...handlers) {
    return this.addRoute('PUT', path, ...handlers);
  }

  /**
   * Adds a DELETE route with optional middleware
   * @param {string} path - Route path
   * @param {...Function} handlers - Middleware functions and final handler
   * @returns {VeloxRouter} Router instance for chaining
   */
  delete(path, ...handlers) {
    return this.addRoute('DELETE', path, ...handlers);
  }

  /**
   * Adds a PATCH route with optional middleware
   * @param {string} path - Route path
   * @param {...Function} handlers - Middleware functions and final handler
   * @returns {VeloxRouter} Router instance for chaining
   */
  patch(path, ...handlers) {
    return this.addRoute('PATCH', path, ...handlers);
  }

  /**
   * Adds a route to the router
   * @param {string} method - HTTP method
   * @param {string} path - Route path
   * @param {...Function} handlers - Middleware functions and final handler
   * @returns {VeloxRouter} Router instance for chaining
   */
  addRoute(method, path, ...handlers) {
    method = method.toUpperCase();
    const fullPath = this.prefix + path.replace(/\/+$/, '') || '/';
    
    if (!this.trees[method]) {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }

    // If only one handler, use it directly
    if (handlers.length === 1) {
      this.trees[method].insert(fullPath, handlers[0]);
      return this;
    }

    // If multiple handlers, create a wrapper that executes middleware first
    const middleware = handlers.slice(0, -1);
    const finalHandler = handlers[handlers.length - 1];

    const wrappedHandler = async (res, req, query, params) => {
      let index = 0;

      const next = async () => {
        if (index >= middleware.length) {
          return finalHandler(res, req, query, params);
        }

        const mw = middleware[index++];
        await mw(res, req, query, params, next);
      };

      await next();
    };

    this.trees[method].insert(fullPath, wrappedHandler);
    return this;
  }

  /**
   * Adds middleware to the router
   * Middleware can have @method and @secure annotations in comments
   * @param {string|Function} pathOrHandler - Route path or middleware function
   * @param {Function} [handler] - Middleware function if path is provided
   * @returns {VeloxRouter} Router instance for chaining
   */
  use(pathOrHandler, handler) {
    let path = '/';
    let middleware = pathOrHandler;

    if (typeof pathOrHandler === 'string') {
      path = pathOrHandler;
      middleware = handler;
    }

    const metadata = this._parseMiddlewareMetadata(middleware);
    
    this.middlewares.push({
      path: this.prefix + path,
      handler: middleware,
      methods: metadata.methods,
      secure: metadata.secure,
    });

    return this;
  }

  /**
   * Finds a route handler for the given method and path
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   * @returns {Object|null} Match result with handler and params
   */
  find(method, path) {
    const cacheKey = `${method}:${path}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const tree = this.trees[method];
    if (!tree) {
      return null;
    }

    const result = tree.search(path);
    
    if (result) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Executes middleware chain for a request
   * @param {Object} res - Response object
   * @param {Object} req - Request object
   * @param {Object} query - Query parameters
   * @param {Object} params - Path parameters
   * @param {*} _body - Unused, body parsing is lazy
   * @param {Function} finalHandler - Final route handler
   */
  async executeMiddlewares(res, req, query, params, _body, finalHandler) {
    let index = 0;

    const next = async () => {
      if (index >= this.middlewares.length) {
        return finalHandler();
      }

      const middleware = this.middlewares[index++];
      const url = req.getUrl();
      const method = req.getMethod();

      if (!url.startsWith(middleware.path)) {
        return next();
      }

      if (!middleware.methods.includes(method) && !middleware.methods.includes('ALL')) {
        return next();
      }

      if (middleware.secure && !req.isSecure()) {
        return next();
      }

      try {
        await middleware.handler(res, req, query, params, next);
      } catch (error) {
        res.status(500).sendJSON({ error: 'Middleware error', message: error.message });
      }
    };

    return next();
  }

  /**
   * Parses middleware metadata from function comments
   * Extracts @method and @secure annotations
   * @private
   * @param {Function} handler - Middleware function
   * @returns {Object} Metadata object with methods and secure flag
   */
  _parseMiddlewareMetadata(handler) {
    const source = handler.toString();
    const metadata = {
      methods: ['ALL'],
      secure: false,
    };

    const methodMatch = source.match(/@method\s+([\w\s,]+)/i);
    if (methodMatch) {
      metadata.methods = methodMatch[1]
        .split(',')
        .map((m) => m.trim().toUpperCase())
        .filter(Boolean);
    }

    const secureMatch = source.match(/@secure\s+(HTTPS|true)/i);
    if (secureMatch) {
      metadata.secure = true;
    }

    return metadata;
  }

  /**
   * Gets all registered routes
   * @returns {Object} Object with methods as keys and routes as values
   */
  getAllRoutes() {
    const routes = {};
    for (const [method, tree] of Object.entries(this.trees)) {
      routes[method] = tree.getAllRoutes();
    }
    return routes;
  }
}

export default VeloxRouter;
