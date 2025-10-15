/**
 * VeloxAPI Static Files Middleware Example
 * Demonstrates high-performance static file serving with ETag caching
 */

import { VeloxServer, VeloxRouter, staticFiles } from '../../lib/index.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = new VeloxRouter();

// Serve static files from 'public' directory
router.use(staticFiles(join(__dirname, 'public'), {
  etag: true,           // Enable ETag caching
  maxAge: 3600,         // Cache for 1 hour
  dotfiles: false,      // Block dotfiles for security
  index: ['index.html'] // Serve index.html for directories
}));

// API routes (served after static files)
router.get('/api/stats', (res) => {
  res.sendJSON({
    message: 'Static files middleware is working!',
    timestamp: new Date().toISOString(),
    features: [
      'ETag caching',
      'Path traversal protection',
      'MIME type detection',
      'Streaming delivery'
    ]
  });
});

// 404 handler
router.get('*', (res) => {
  res.status(404).sendHTML(`
    <!DOCTYPE html>
    <html>
      <head><title>404 Not Found</title></head>
      <body>
        <h1>404 - Page Not Found</h1>
        <p>The requested resource was not found.</p>
      </body>
    </html>
  `);
});

const server = new VeloxServer()
  .setPort(5000)
  .setRouter(router)
  .start();

console.log('📂 Static Files Example:');
console.log('   http://localhost:5000           - Main page');
console.log('   http://localhost:5000/styles.css - CSS file');
console.log('   http://localhost:5000/app.js     - JavaScript file');
console.log('   http://localhost:5000/api/stats  - API endpoint');
console.log('');
console.log('💡 Refresh the page to see ETag caching in action!');
