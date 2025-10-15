/**
 * VeloxAPI - Ultra-fast, zero-dependency Node.js web framework
 * 
 * Main exports for the VeloxAPI framework
 * @module veloxapi
 */

import VeloxServer from './core/server.js';
import VeloxRouter from './core/router.js';
import Request from './core/request.js';
import Response from './core/response.js';
import Cookie from './cookies/cookie.js';
import CookieParser from './cookies/parser.js';
import LRUCache from './utils/cache.js';

// Middleware
import { staticFiles } from './middleware/static-files.js';
import { rateLimit, rateLimitRoute, MemoryStore, TokenBucket } from './middleware/rate-limit.js';

export {
  VeloxServer,
  VeloxRouter,
  Request,
  Response,
  Cookie,
  CookieParser,
  LRUCache,
  // Middleware
  staticFiles,
  rateLimit,
  rateLimitRoute,
  MemoryStore,
  TokenBucket,
};

export default VeloxServer;
