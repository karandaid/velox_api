/**
 * VeloxAPI Rate Limiting Middleware Example
 * Demonstrates token bucket rate limiting for API protection
 */

import { VeloxServer, VeloxRouter, rateLimit, rateLimitRoute } from '../../lib/index.js';

const router = new VeloxRouter();

// Global rate limiter: 10 requests per minute
const globalLimiter = rateLimit({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  message: 'Too many requests from this IP, please try again later.'
});

// Strict API limiter: 3 requests per minute
const strictLimiter = rateLimitRoute('/api/strict', {
  maxRequests: 3,
  windowMs: 60000
});

// Custom rate limit handler
const customLimiter = rateLimit({
  maxRequests: 2,
  windowMs: 60000,
  handler: (req, res) => {
    res.status(503).sendJSON({
      error: 'Service temporarily unavailable',
      message: 'You have exceeded the rate limit. Please slow down.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

// Public route (no rate limit)
router.get('/', (res) => {
  res.sendHTML(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>VeloxAPI - Rate Limiting Example</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 800px;
          width: 100%;
        }
        h1 { color: #667eea; margin-bottom: 20px; }
        h2 { color: #764ba2; margin-top: 30px; margin-bottom: 15px; }
        .endpoint {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin: 10px 0;
          border-left: 4px solid #667eea;
        }
        button {
          background: #667eea;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          margin: 5px;
        }
        button:hover { background: #764ba2; }
        pre {
          background: #2d2d2d;
          color: #f8f8f2;
          padding: 15px;
          border-radius: 5px;
          margin-top: 15px;
          overflow-x: auto;
          max-height: 300px;
        }
        .badge {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 12px;
          margin-left: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🛡️ VeloxAPI Rate Limiting</h1>
        <p>Token bucket algorithm for high-performance API protection</p>
        
        <h2>Test Endpoints</h2>
        
        <div class="endpoint">
          <strong>GET /api/limited</strong> <span class="badge">10 req/min</span>
          <p>Standard rate limit - 10 requests per minute</p>
          <button onclick="testEndpoint('/api/limited')">Test</button>
        </div>
        
        <div class="endpoint">
          <strong>GET /api/strict</strong> <span class="badge">3 req/min</span>
          <p>Strict limit - 3 requests per minute</p>
          <button onclick="testEndpoint('/api/strict')">Test</button>
        </div>
        
        <div class="endpoint">
          <strong>GET /api/custom</strong> <span class="badge">2 req/min</span>
          <p>Custom handler - Custom error response</p>
          <button onclick="testEndpoint('/api/custom')">Test</button>
        </div>
        
        <div class="endpoint">
          <strong>Spam Test</strong>
          <p>Send 15 rapid requests to see rate limiting in action</p>
          <button onclick="spamTest()">Spam Test</button>
        </div>
        
        <h2>Response</h2>
        <pre id="result">Click a button to test...</pre>
      </div>
      
      <script>
        async function testEndpoint(path) {
          const result = document.getElementById('result');
          try {
            const response = await fetch(path);
            const data = await response.json();
            
            result.textContent = 'Status: ' + response.status + ' ' + response.statusText + '\\n' +
              'X-RateLimit-Limit: ' + response.headers.get('X-RateLimit-Limit') + '\\n' +
              'X-RateLimit-Remaining: ' + response.headers.get('X-RateLimit-Remaining') + '\\n' +
              'X-RateLimit-Reset: ' + response.headers.get('X-RateLimit-Reset') + '\\n' +
              (response.headers.get('Retry-After') ? 'Retry-After: ' + response.headers.get('Retry-After') + 's\\n' : '') +
              '\\nResponse:\\n' + JSON.stringify(data, null, 2);
          } catch (err) {
            result.textContent = 'Error: ' + err.message;
          }
        }
        
        async function spamTest() {
          const result = document.getElementById('result');
          result.textContent = 'Sending 15 rapid requests...\\n\\n';
          
          for (let i = 1; i <= 15; i++) {
            try {
              const response = await fetch('/api/limited');
              const remaining = response.headers.get('X-RateLimit-Remaining');
              result.textContent += 'Request ' + i + ': ' + response.status + 
                ' (Remaining: ' + remaining + ')\\n';
            } catch (err) {
              result.textContent += 'Request ' + i + ': Error\\n';
            }
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Rate limited routes
router.get('/api/limited', globalLimiter, (res) => {
  res.sendJSON({
    message: 'Request successful!',
    rateLimit: 'Global (10 req/min)',
    timestamp: new Date().toISOString()
  });
});

router.get('/api/strict', strictLimiter, (res) => {
  res.sendJSON({
    message: 'Strict API access granted',
    rateLimit: 'Strict (3 req/min)',
    timestamp: new Date().toISOString()
  });
});

router.get('/api/custom', customLimiter, (res) => {
  res.sendJSON({
    message: 'Custom handler route',
    rateLimit: 'Custom (2 req/min)',
    timestamp: new Date().toISOString()
  });
});

const server = new VeloxServer()
  .setPort(5000)
  .setRouter(router)
  .start();

console.log('🛡️ Rate Limiting Example:');
console.log('   http://localhost:5000              - Main page');
console.log('   http://localhost:5000/api/limited  - 10 req/min');
console.log('   http://localhost:5000/api/strict   - 3 req/min');
console.log('   http://localhost:5000/api/custom   - 2 req/min (custom handler)');
console.log('');
console.log('💡 Try the spam test to see rate limiting in action!');
