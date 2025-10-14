/**
 * Example: TRUE streaming file upload
 * Handles multi-GB files with minimal memory usage
 */

import { VeloxServer, VeloxRouter } from '../lib/index.js';
import { streamToDestination, processChunks } from '../lib/utils/stream-parser.js';
import { createWriteStream } from 'fs';
import { createHash } from 'crypto';

const router = new VeloxRouter();

// Example 1: Stream directly to disk (NO BUFFERING)
router.post('/upload/direct/:filename', async (res, req, query, params) => {
  const filepath = `./uploads/${params.filename}`;
  const fileStream = createWriteStream(filepath);
  
  try {
    // Stream completes when file is fully written and flushed
    const bytesWritten = await streamToDestination(
      req.req,
      fileStream,
      1024 * 1024 * 1024  // 1GB max
    );
    
    // File is closed and flushed at this point
    res.sendJSON({ 
      success: true,
      filename: params.filename,
      bytes: bytesWritten,
      path: filepath
    });
  } catch (err) {
    res.sendError(err.message, 400);
  }
});

// Example 2: Process chunks (calculate hash while uploading)
router.post('/upload/hash/:filename', async (res, req, query, params) => {
  const filepath = `./uploads/${params.filename}`;
  const fileStream = createWriteStream(filepath);
  const hash = createHash('sha256');
  let bytesProcessed = 0;
  
  try {
    await processChunks(
      req.req,
      async (chunk) => {
        // Process chunk (update hash)
        hash.update(chunk);
        bytesProcessed += chunk.length;
        
        // Write to disk
        if (!fileStream.write(chunk)) {
          await new Promise(resolve => fileStream.once('drain', resolve));
        }
      },
      1024 * 1024 * 1024  // 1GB max
    );
    
    fileStream.end();
    
    res.sendJSON({
      success: true,
      filename: params.filename,
      bytes: bytesProcessed,
      sha256: hash.digest('hex')
    });
  } catch (err) {
    fileStream.destroy();
    res.sendError(err.message, 400);
  }
});

// Example 3: Monitor upload progress
router.post('/upload/progress/:filename', async (res, req, query, params) => {
  const filepath = `./uploads/${params.filename}`;
  const fileStream = createWriteStream(filepath);
  let bytesProcessed = 0;
  let lastProgress = 0;
  
  try {
    await processChunks(
      req.req,
      async (chunk) => {
        bytesProcessed += chunk.length;
        
        // Log progress every 10MB
        if (bytesProcessed - lastProgress >= 10 * 1024 * 1024) {
          console.log(`Progress: ${(bytesProcessed / 1024 / 1024).toFixed(2)} MB`);
          lastProgress = bytesProcessed;
        }
        
        // Write chunk
        if (!fileStream.write(chunk)) {
          await new Promise(resolve => fileStream.once('drain', resolve));
        }
      },
      5 * 1024 * 1024 * 1024  // 5GB max
    );
    
    fileStream.end();
    
    res.sendJSON({
      success: true,
      filename: params.filename,
      bytes: bytesProcessed,
      sizeMB: (bytesProcessed / 1024 / 1024).toFixed(2)
    });
  } catch (err) {
    fileStream.destroy();
    res.sendError(err.message, 400);
  }
});

const server = new VeloxServer()
  .setPort(5000)
  .setRouter(router)
  .start();

console.log(`
🚀 Streaming Upload Server running on http://localhost:5000

Examples:

# Upload 1GB file (only uses ~16KB RAM)
curl -X POST http://localhost:5000/upload/direct/large-file.bin \\
  --data-binary @large-file.bin

# Upload with SHA256 hash
curl -X POST http://localhost:5000/upload/hash/video.mp4 \\
  --data-binary @video.mp4

# Upload with progress monitoring
curl -X POST http://localhost:5000/upload/progress/database.sql \\
  --data-binary @database.sql
`);
