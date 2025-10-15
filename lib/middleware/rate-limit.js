/**
 * Rate Limiting Middleware
 * Token bucket algorithm for high-performance rate limiting
 */

/**
 * Memory store for rate limiting (default)
 */
class MemoryStore {
  constructor() {
    this.clients = new Map();
    this.cleanupInterval = null;
  }

  /**
   * Get or create client bucket
   */
  get(key) {
    return this.clients.get(key);
  }

  /**
   * Set client bucket
   */
  set(key, value) {
    this.clients.set(key, value);
  }

  /**
   * Delete client bucket
   */
  delete(key) {
    this.clients.delete(key);
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  startCleanup(interval = 60000) {
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of this.clients.entries()) {
        // Remove buckets that haven't been accessed in 10 minutes
        if (now - bucket.lastAccess > 600000) {
          this.clients.delete(key);
        }
      }
    }, interval);
    
    // Use unref() to allow Node.js to exit if this is the only active timer
    this.cleanupInterval.unref();
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clear all entries
   */
  clear() {
    this.clients.clear();
  }

  /**
   * Get store size
   */
  get size() {
    return this.clients.size;
  }
}

/**
 * Token Bucket implementation
 */
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate; // tokens per second
    this.lastRefill = Date.now();
    this.lastAccess = Date.now();
  }

  /**
   * Refill tokens based on time passed
   */
  refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // in seconds
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
    this.lastAccess = now;
  }

  /**
   * Try to consume tokens
   * @param {number} tokens - Number of tokens to consume
   * @returns {boolean} - True if tokens were consumed
   */
  consume(tokens = 1) {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  /**
   * Get time until next token is available (in ms)
   */
  getRetryAfter() {
    if (this.tokens >= 1) return 0;
    
    const tokensNeeded = 1 - this.tokens;
    return Math.ceil((tokensNeeded / this.refillRate) * 1000);
  }
}

/**
 * Create rate limiting middleware
 * @param {Object} options - Configuration options
 * @param {number} options.maxRequests - Maximum requests (default: 100)
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @param {Function} options.keyGenerator - Custom key generator (default: IP-based)
 * @param {Function} options.handler - Custom rate limit exceeded handler
 * @param {Object} options.store - Custom store (default: MemoryStore)
 * @param {boolean} options.skipSuccessfulRequests - Don't count successful requests (default: false)
 * @param {boolean} options.skipFailedRequests - Don't count failed requests (default: false)
 * @param {number} options.statusCode - HTTP status code for rate limited requests (default: 429)
 * @param {string} options.message - Response message (default: 'Too many requests')
 * @returns {Function} Middleware function
 */
export function rateLimit(options = {}) {
  const {
    maxRequests = 100,
    windowMs = 60000, // 1 minute
    keyGenerator = (req) => req.ip || req.socket?.remoteAddress || 'unknown',
    handler = null,
    store = new MemoryStore(),
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    statusCode = 429,
    message = 'Too many requests, please try again later.'
  } = options;

  // Calculate refill rate (tokens per second)
  const refillRate = maxRequests / (windowMs / 1000);

  // Start cleanup for memory store
  if (store instanceof MemoryStore) {
    store.startCleanup();
  }

  return async (res, req, query, params, next) => {
    try {
      // Generate unique key for this client
      const key = keyGenerator(req);

      // Get or create token bucket for this client
      let bucket = store.get(key);
      if (!bucket) {
        bucket = new TokenBucket(maxRequests, refillRate);
        store.set(key, bucket);
      }

      // Try to consume a token
      const allowed = bucket.consume(1);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens).toString());
      res.setHeader('X-RateLimit-Reset', new Date(bucket.lastRefill + windowMs).toISOString());

      if (!allowed) {
        // Rate limit exceeded
        const retryAfter = Math.ceil(bucket.getRetryAfter() / 1000); // in seconds
        res.setHeader('Retry-After', retryAfter.toString());
        
        if (handler && typeof handler === 'function') {
          return handler(req, res, next);
        }
        
        res.status(statusCode).sendJSON({
          error: message,
          retryAfter
        });
        return;
      }

      // Handle skip options
      if (skipSuccessfulRequests || skipFailedRequests) {
        // Store original end method
        const originalEnd = res.end.bind(res);
        
        res.end = function(...args) {
          const shouldSkip = 
            (skipSuccessfulRequests && res.statusCode < 400) ||
            (skipFailedRequests && res.statusCode >= 400);
          
          if (shouldSkip) {
            // Refund the token
            bucket.tokens = Math.min(bucket.capacity, bucket.tokens + 1);
          }
          
          return originalEnd(...args);
        };
      }

      // Request allowed, continue
      next?.();
      
    } catch (err) {
      console.error('Rate limit middleware error:', err);
      next?.();
    }
  };
}

/**
 * Create per-route rate limiter
 * @param {string} route - Route pattern
 * @param {Object} options - Rate limit options
 * @returns {Function} Middleware function
 */
export function rateLimitRoute(route, options = {}) {
  const limiter = rateLimit({
    ...options,
    keyGenerator: (req) => {
      const baseKey = req.ip || req.socket?.remoteAddress || 'unknown';
      return `${route}:${baseKey}`;
    }
  });
  
  return limiter;
}

export { MemoryStore, TokenBucket };
export default rateLimit;
