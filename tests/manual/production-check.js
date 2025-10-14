import http from 'http';
import { VeloxServer, VeloxRouter } from '../../lib/index.js';
import fs from 'fs';

const PORT = 9999;
const router = new VeloxRouter();

// Test routes
router.get('/', (res) => {
  res.sendJSON({ status: 'ok', message: 'VeloxAPI Production Test' });
});

router.get('/users/:id=number', (res, req, query, params) => {
  res.sendJSON({ userId: params.id, type: typeof params.id });
});

router.get('/email/:email=email', (res, req, query, params) => {
  res.sendJSON({ email: params.email, valid: true });
});

router.get('/search', (res, req, query) => {
  res.sendJSON({ query, count: Object.keys(query).length });
});

router.post('/data', async (res, req) => {
  try {
    const body = await req.getBody();
    res.sendJSON({ received: body, success: true });
  } catch (err) {
    console.error('Body parse error:', err.message);
    res.status(400).sendJSON({ error: err.message });
  }
});

router.get('/file', (res) => {
  res.sendFile('README.md');
});

const veloxServer = new VeloxServer();
veloxServer.setPort(PORT).setRouter(router);

router.get('/stats', (res) => {
  const stats = veloxServer.getStats();
  res.sendJSON(stats);
});

router.get('/error', () => {
  throw new Error('Test error');
});

const serverInstance = veloxServer.start();

console.log('🧪 Starting production readiness tests...\n');

function request(method, path, options = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: options.headers || {}
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function runTests() {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  let passed = 0;
  let failed = 0;

  // Test 1: Basic JSON route
  try {
    const res = await request('GET', '/');
    const json = JSON.parse(res.body);
    if (res.statusCode === 200 && json.status === 'ok') {
      console.log('✅ Test 1: Basic JSON route');
      passed++;
    } else {
      console.log('❌ Test 1: Basic JSON route failed');
      failed++;
    }
  } catch (err) {
    console.log('❌ Test 1: Basic JSON route - Error:', err.message);
    failed++;
  }

  // Test 2: Typed parameter (number)
  try {
    const res = await request('GET', '/users/123');
    const json = JSON.parse(res.body);
    if (res.statusCode === 200 && json.userId === 123 && json.type === 'number') {
      console.log('✅ Test 2: Typed parameter (number) - Converted to number');
      passed++;
    } else {
      console.log('❌ Test 2: Typed parameter failed -', json);
      failed++;
    }
  } catch (err) {
    console.log('❌ Test 2: Typed parameter - Error:', err.message);
    failed++;
  }

  // Test 3: Email validation
  try {
    const res = await request('GET', '/email/test@example.com');
    const json = JSON.parse(res.body);
    if (res.statusCode === 200 && json.email === 'test@example.com') {
      console.log('✅ Test 3: Email parameter validation');
      passed++;
    } else {
      console.log('❌ Test 3: Email validation failed');
      failed++;
    }
  } catch (err) {
    console.log('❌ Test 3: Email validation - Error:', err.message);
    failed++;
  }

  // Test 4: Invalid email rejected (returns 404 because route doesn't match)
  try {
    const res = await request('GET', '/email/invalid-email');
    if (res.statusCode === 404) {
      console.log('✅ Test 4: Invalid email rejected (404 - route not matched)');
      passed++;
    } else {
      console.log('❌ Test 4: Invalid email should return 404, got', res.statusCode);
      failed++;
    }
  } catch (err) {
    console.log('❌ Test 4: Invalid email rejection - Error:', err.message);
    failed++;
  }

  // Test 5: Query parameters
  try {
    const res = await request('GET', '/search?q=velox&limit=10');
    const json = JSON.parse(res.body);
    if (res.statusCode === 200 && json.query.q === 'velox' && json.query.limit === '10') {
      console.log('✅ Test 5: Query parameters parsed correctly');
      passed++;
    } else {
      console.log('❌ Test 5: Query parameters failed');
      failed++;
    }
  } catch (err) {
    console.log('❌ Test 5: Query parameters - Error:', err.message);
    failed++;
  }

  // Test 6: JSON body parsing
  try {
    const payload = { name: 'VeloxAPI', version: '0.2.0' };
    const body = JSON.stringify(payload);
    const res = await request('POST', '/data', {
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      body
    });
    const json = JSON.parse(res.body);
    if (res.statusCode === 200 && json.received.name === 'VeloxAPI') {
      console.log('✅ Test 6: JSON body parsing');
      passed++;
    } else {
      console.log('❌ Test 6: JSON body parsing failed -', res.statusCode);
      failed++;
    }
  } catch (err) {
    console.log('❌ Test 6: JSON body parsing - Error:', err.message);
    failed++;
  }

  // Test 7: File serving
  try {
    const res = await request('GET', '/file');
    if (res.statusCode === 200 && res.body.includes('VeloxAPI')) {
      console.log('✅ Test 7: File serving (README.md)');
      passed++;
    } else {
      console.log('❌ Test 7: File serving failed');
      failed++;
    }
  } catch (err) {
    console.log('❌ Test 7: File serving - Error:', err.message);
    failed++;
  }

  // Test 8: Object pool statistics
  try {
    const res = await request('GET', '/stats');
    const json = JSON.parse(res.body);
    if (res.statusCode === 200 && json.requestPool && json.responsePool) {
      console.log('✅ Test 8: Object pool statistics -', 
        `Req: ${json.requestPool.acquired}, Res: ${json.responsePool.acquired}`);
      passed++;
    } else {
      console.log('❌ Test 8: Object pool stats failed');
      failed++;
    }
  } catch (err) {
    console.log('❌ Test 8: Object pool stats - Error:', err.message);
    failed++;
  }

  // Test 9: 404 handling
  try {
    const res = await request('GET', '/nonexistent');
    if (res.statusCode === 404) {
      console.log('✅ Test 9: 404 error handling');
      passed++;
    } else {
      console.log('❌ Test 9: 404 should return 404, got', res.statusCode);
      failed++;
    }
  } catch (err) {
    console.log('❌ Test 9: 404 handling - Error:', err.message);
    failed++;
  }

  // Test 10: Error handling
  try {
    const res = await request('GET', '/error');
    if (res.statusCode === 500) {
      console.log('✅ Test 10: 500 error handling');
      passed++;
    } else {
      console.log('❌ Test 10: Error route should return 500, got', res.statusCode);
      failed++;
    }
  } catch (err) {
    console.log('❌ Test 10: Error handling - Error:', err.message);
    failed++;
  }

  // Final summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Production Test Results: ${passed}/${passed + failed} passed`);
  if (failed === 0) {
    console.log('🎉 All production tests passed! Framework is ready.');
  } else {
    console.log(`⚠️  ${failed} test(s) failed. Review needed.`);
  }
  console.log('='.repeat(50));

  veloxServer.close(() => {
    process.exit(failed === 0 ? 0 : 1);
  });
}

runTests();
