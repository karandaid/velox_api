/**
 * Hello World Example - VeloxAPI
 * Demonstrates basic routing and typed parameters
 */

import { VeloxServer, VeloxRouter } from '../../lib/index.js';

const router = new VeloxRouter();

router.get('/', (res, req) => {
  res.sendJSON({
    message: 'Welcome to VeloxAPI! 🚀',
    version: '0.1.0',
    features: [
      'Zero dependencies',
      'Radix tree routing',
      'Typed parameters',
      'Streaming I/O',
      'Ultra-fast performance',
    ],
  });
});

router.get('/hello/:name=string', (res, req, query, params) => {
  res.sendJSON({
    message: `Hello, ${params.name}!`,
    paramType: typeof params.name,
  });
});

router.get('/user/:id=number', (res, req, query, params) => {
  res.sendJSON({
    userId: params.id,
    type: typeof params.id,
    message: `User ID is a ${typeof params.id}`,
  });
});

router.get('/email/:email=email', (res, req, query, params) => {
  res.sendJSON({
    email: params.email,
    valid: true,
    message: 'Email format validated!',
  });
});

router.get('/uuid/:id=uuid', (res, req, query, params) => {
  res.sendJSON({
    uuid: params.id,
    valid: true,
    message: 'UUID format validated!',
  });
});

router.post('/data', async (res, req, query, params) => {
  const body = await req.getBody();
  res.sendJSON({
    received: body,
    message: 'Data received successfully',
  });
});

router.get('/test', (res, req, query) => {
  res.sendJSON({
    query,
    message: 'Query parameters test',
  });
});

const server = new VeloxServer().setPort(5000).setRouter(router).start();

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
