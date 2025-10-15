/**
 * Advanced Typed Routing Example
 * 
 * Demonstrates VeloxAPI's powerful typed parameter routing:
 * - Multiple routes with same path but different types
 * - Complex nested routing with type validation
 * - All 12 parameter types in action
 */

import VeloxServer from '../../lib/core/server.js';
import VeloxRouter from '../../lib/core/router.js';

const router = new VeloxRouter();

console.log('🚀 VeloxAPI Advanced Typed Routing Demo\n');

// ===================================
// 1. BASIC TYPE DIFFERENTIATION
// ===================================

// String vs Number - Same path, different handlers
router.get('/users/:id=string', (res, req, query, params) => {
  console.log(`✅ String route: /users/${params.id} (type: ${typeof params.id})`);
  res.sendJSON({
    route: 'String ID',
    id: params.id,
    type: typeof params.id,
    example: 'Username or slug-based lookup'
  });
});

router.get('/users/:id=number', (res, req, query, params) => {
  console.log(`✅ Number route: /users/${params.id} (type: ${typeof params.id})`);
  res.sendJSON({
    route: 'Number ID',
    id: params.id,
    type: typeof params.id,
    example: 'Database ID lookup'
  });
});

// ===================================
// 2. INT VS FLOAT DIFFERENTIATION
// ===================================

router.get('/products/:price=int', (res, req, query, params) => {
  console.log(`✅ Integer price: $${params.price}`);
  res.sendJSON({
    route: 'Integer Price',
    price: params.price,
    isInteger: Number.isInteger(params.price),
    example: 'Whole dollar amounts: $10, $100, $1000'
  });
});

router.get('/products/:price=float', (res, req, query, params) => {
  console.log(`✅ Float price: $${params.price}`);
  res.sendJSON({
    route: 'Float Price',
    price: params.price,
    isFloat: !Number.isInteger(params.price),
    example: 'Decimal prices: $9.99, $19.95, $99.99'
  });
});

// ===================================
// 3. UUID VS SLUG
// ===================================

router.get('/posts/:id=uuid', (res, req, query, params) => {
  console.log(`✅ UUID post: ${params.id}`);
  res.sendJSON({
    route: 'UUID Post',
    id: params.id,
    example: 'API integration with external systems'
  });
});

router.get('/posts/:id=slug', (res, req, query, params) => {
  console.log(`✅ Slug post: ${params.id}`);
  res.sendJSON({
    route: 'Slug Post',
    id: params.id,
    example: 'SEO-friendly blog post URLs'
  });
});

// ===================================
// 4. EMAIL VALIDATION
// ===================================

router.get('/verify/:input=email', (res, req, query, params) => {
  console.log(`✅ Valid email: ${params.input}`);
  res.sendJSON({
    route: 'Email Verified',
    email: params.input,
    action: 'Sending verification email...'
  });
});

router.get('/verify/:input=string', (res, req, query, params) => {
  console.log(`❌ Invalid email: ${params.input}`);
  res.sendJSON({
    route: 'Invalid Email',
    input: params.input,
    error: 'Please provide a valid email address'
  });
});

// ===================================
// 5. BOOLEAN ROUTING
// ===================================

router.get('/settings/:enabled=boolean', (res, req, query, params) => {
  console.log(`✅ Boolean setting: ${params.enabled}`);
  res.sendJSON({
    route: 'Boolean Setting',
    enabled: params.enabled,
    type: typeof params.enabled,
    status: params.enabled ? 'Feature enabled ✅' : 'Feature disabled ❌'
  });
});

// ===================================
// 6. HEX COLOR VALIDATION
// ===================================

router.get('/colors/:code=hex', (res, req, query, params) => {
  console.log(`✅ Hex color: #${params.code}`);
  res.sendJSON({
    route: 'Hex Color',
    color: `#${params.code}`,
    rgb: hexToRgb(params.code)
  });
});

// ===================================
// 7. ALPHA VS ALPHANUMERIC
// ===================================

router.get('/codes/:value=alpha', (res, req, query, params) => {
  console.log(`✅ Alpha code: ${params.value}`);
  res.sendJSON({
    route: 'Alpha Only',
    value: params.value,
    example: 'Letters only (ABC, xyz)'
  });
});

router.get('/codes/:value=alphanumeric', (res, req, query, params) => {
  console.log(`✅ Alphanumeric code: ${params.value}`);
  res.sendJSON({
    route: 'Alphanumeric',
    value: params.value,
    example: 'Letters and numbers (ABC123, xyz789)'
  });
});

// ===================================
// 8. MULTI-PARAM COMPLEX ROUTING
// ===================================

// API versioning with typed parameters
router.get('/api/:version=int/users/:userId=number', (res, req, query, params) => {
  console.log(`✅ API v${params.version} - User #${params.userId}`);
  res.sendJSON({
    route: 'API v1 - Numeric User ID',
    apiVersion: params.version,
    userId: params.userId,
    example: 'Internal API with database IDs'
  });
});

router.get('/api/:version=int/users/:userId=uuid', (res, req, query, params) => {
  console.log(`✅ API v${params.version} - UUID User: ${params.userId}`);
  res.sendJSON({
    route: 'API v1 - UUID User',
    apiVersion: params.version,
    userId: params.userId,
    example: 'External API integration'
  });
});

router.get('/api/:version=float/users/:userId=string', (res, req, query, params) => {
  console.log(`✅ API v${params.version} - Username: ${params.userId}`);
  res.sendJSON({
    route: 'API v2 - Username',
    apiVersion: params.version,
    userId: params.userId,
    example: 'Public API with usernames'
  });
});

// ===================================
// 9. DEEP NESTED ROUTING
// ===================================

router.get('/orgs/:orgId=uuid/projects/:projectId=int/files/:fileId=string', (res, req, query, params) => {
  console.log(`✅ Nested route: Org ${params.orgId} → Project #${params.projectId} → File: ${params.fileId}`);
  res.sendJSON({
    route: 'Deep Nested Structure',
    organization: {
      id: params.orgId,
      type: 'UUID'
    },
    project: {
      id: params.projectId,
      type: 'Integer'
    },
    file: {
      id: params.fileId,
      type: 'String'
    }
  });
});

// ===================================
// 10. URL VALIDATION
// ===================================

router.get('/redirect/:url=url', (res, req, query, params) => {
  console.log(`✅ Valid URL redirect: ${params.url}`);
  res.sendJSON({
    route: 'URL Redirect',
    url: params.url,
    action: `Would redirect to: ${params.url}`
  });
});

// ===================================
// DEMO HOMEPAGE
// ===================================

router.get('/', (res) => {
  res.sendHTML(`
<!DOCTYPE html>
<html>
<head>
  <title>VeloxAPI - Advanced Typed Routing Demo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #0a0a0a;
      color: #e0e0e0;
    }
    h1 { color: #00d4ff; }
    h2 { color: #00ff88; margin-top: 30px; }
    .route {
      background: #1a1a1a;
      border-left: 4px solid #00d4ff;
      padding: 15px;
      margin: 10px 0;
      border-radius: 4px;
    }
    code {
      background: #2a2a2a;
      padding: 2px 6px;
      border-radius: 3px;
      color: #ff6b6b;
    }
    .curl {
      background: #2a2a2a;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
      overflow-x: auto;
    }
    .success { color: #00ff88; }
    .info { color: #00d4ff; }
  </style>
</head>
<body>
  <h1>🚀 VeloxAPI - Advanced Typed Routing Demo</h1>
  <p>This demo shows <strong>multiple routes with the same path but different parameter types</strong>.</p>

  <h2>1. String vs Number</h2>
  <div class="route">
    <div>GET <code>/users/:id=string</code></div>
    <div class="curl">curl http://localhost:5000/users/alice</div>
  </div>
  <div class="route">
    <div>GET <code>/users/:id=number</code></div>
    <div class="curl">curl http://localhost:5000/users/123</div>
  </div>

  <h2>2. Integer vs Float</h2>
  <div class="route">
    <div>GET <code>/products/:price=int</code></div>
    <div class="curl">curl http://localhost:5000/products/100</div>
  </div>
  <div class="route">
    <div>GET <code>/products/:price=float</code></div>
    <div class="curl">curl http://localhost:5000/products/99.99</div>
  </div>

  <h2>3. UUID vs Slug</h2>
  <div class="route">
    <div>GET <code>/posts/:id=uuid</code></div>
    <div class="curl">curl http://localhost:5000/posts/550e8400-e29b-41d4-a716-446655440000</div>
  </div>
  <div class="route">
    <div>GET <code>/posts/:id=slug</code></div>
    <div class="curl">curl http://localhost:5000/posts/my-blog-post-2024</div>
  </div>

  <h2>4. Email Validation</h2>
  <div class="route">
    <div>GET <code>/verify/:input=email</code></div>
    <div class="curl">curl http://localhost:5000/verify/user@example.com</div>
  </div>
  <div class="route">
    <div>GET <code>/verify/:input=string</code> (fallback)</div>
    <div class="curl">curl http://localhost:5000/verify/not-an-email</div>
  </div>

  <h2>5. Boolean Values</h2>
  <div class="route">
    <div>GET <code>/settings/:enabled=boolean</code></div>
    <div class="curl">curl http://localhost:5000/settings/true</div>
    <div class="curl">curl http://localhost:5000/settings/false</div>
  </div>

  <h2>6. Hex Colors</h2>
  <div class="route">
    <div>GET <code>/colors/:code=hex</code></div>
    <div class="curl">curl http://localhost:5000/colors/FF5733</div>
  </div>

  <h2>7. Alpha vs Alphanumeric</h2>
  <div class="route">
    <div>GET <code>/codes/:value=alpha</code></div>
    <div class="curl">curl http://localhost:5000/codes/ABC</div>
  </div>
  <div class="route">
    <div>GET <code>/codes/:value=alphanumeric</code></div>
    <div class="curl">curl http://localhost:5000/codes/ABC123</div>
  </div>

  <h2>8. Multi-Parameter Routing</h2>
  <div class="route">
    <div>GET <code>/api/:version=int/users/:userId=number</code></div>
    <div class="curl">curl http://localhost:5000/api/1/users/123</div>
  </div>
  <div class="route">
    <div>GET <code>/api/:version=int/users/:userId=uuid</code></div>
    <div class="curl">curl http://localhost:5000/api/1/users/550e8400-e29b-41d4-a716-446655440000</div>
  </div>
  <div class="route">
    <div>GET <code>/api/:version=float/users/:userId=string</code></div>
    <div class="curl">curl http://localhost:5000/api/1.5/users/john-doe</div>
  </div>

  <h2>9. Deep Nested Structure</h2>
  <div class="route">
    <div>GET <code>/orgs/:orgId=uuid/projects/:projectId=int/files/:fileId=string</code></div>
    <div class="curl">curl http://localhost:5000/orgs/550e8400-e29b-41d4-a716-446655440000/projects/42/files/report.pdf</div>
  </div>

  <h2>10. URL Validation</h2>
  <div class="route">
    <div>GET <code>/redirect/:url=url</code></div>
    <div class="curl">curl http://localhost:5000/redirect/https://example.com</div>
  </div>

  <p class="success">✅ Check the server console to see which routes are being matched!</p>
  <p class="info">📚 See <a href="https://github.com/yourrepo/veloxapi/blob/main/docs/TYPED-ROUTING.md" style="color: #00d4ff">TYPED-ROUTING.md</a> for full documentation.</p>
</body>
</html>
  `);
});

// ===================================
// UTILITY FUNCTIONS
// ===================================

function hexToRgb(hex) {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

// ===================================
// START SERVER
// ===================================

const server = new VeloxServer()
  .setPort(5000)
  .setRouter(router)
  .start();

console.log('\n📚 Documentation: docs/TYPED-ROUTING.md');
console.log('🧪 Unit Tests: tests/unit/radix-tree-typed-params.test.js');
console.log('🔗 Integration Tests: tests/integration/typed-params-routes.test.js\n');
console.log('Try these examples:\n');
console.log('  curl http://localhost:5000/users/123           # Number route');
console.log('  curl http://localhost:5000/users/alice         # String route');
console.log('  curl http://localhost:5000/products/100        # Integer route');
console.log('  curl http://localhost:5000/products/99.99      # Float route');
console.log('  curl http://localhost:5000/posts/550e8400-e29b-41d4-a716-446655440000  # UUID');
console.log('  curl http://localhost:5000/posts/my-blog-post  # Slug\n');
