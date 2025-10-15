/**
 * Static File Middleware
 * High-performance static file serving with ETag caching and security
 */

import { createHash } from 'crypto';
import { stat, access } from 'fs/promises';
import { constants } from 'fs';
import { join, normalize, sep, resolve } from 'path';

/**
 * Create static file middleware
 * @param {string} publicDir - Directory to serve files from
 * @param {Object} options - Configuration options
 * @param {boolean} options.etag - Enable ETag generation (default: true)
 * @param {number} options.maxAge - Cache-Control max-age in seconds (default: 0)
 * @param {boolean} options.dotfiles - Allow serving dotfiles (default: false)
 * @param {string[]} options.index - Index file names (default: ['index.html'])
 * @param {Function} options.setHeaders - Custom header function
 * @returns {Function} Middleware function
 */
export function staticFiles(publicDir, options = {}) {
  const {
    etag = true,
    maxAge = 0,
    dotfiles = false,
    index = ['index.html'],
    setHeaders = null
  } = options;

  // Resolve the public directory to absolute path
  const resolvedPublicDir = resolve(publicDir);

  return async (res, req, query, params, next) => {
    // Only handle GET and HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next?.();
    }

    try {
      // Get the requested path
      let requestPath = req.url.split('?')[0];
      
      // Security: Prevent path traversal (check BEFORE normalization)
      if (requestPath.includes('..') || requestPath.includes('\0')) {
        res.status(403).sendText('Forbidden');
        return;
      }

      // Normalize and remove leading slash to make it relative
      let normalizedPath = normalize(requestPath);
      if (normalizedPath.startsWith(sep)) {
        normalizedPath = normalizedPath.slice(1);
      }

      // Security: Block dotfiles if not allowed
      const pathParts = normalizedPath.split(sep);
      if (!dotfiles && pathParts.some(part => part.startsWith('.'))) {
        res.status(403).sendText('Forbidden');
        return;
      }

      // Build full file path and resolve to absolute path
      let filePath = resolve(resolvedPublicDir, normalizedPath);

      // Security: Ensure the resolved path is within the public directory
      if (!filePath.startsWith(resolvedPublicDir + sep) && filePath !== resolvedPublicDir) {
        res.status(403).sendText('Forbidden');
        return;
      }

      // Check if path exists
      try {
        await access(filePath, constants.R_OK);
      } catch {
        return next?.() || res.status(404).sendText('Not Found');
      }

      // Get file stats
      const stats = await stat(filePath);

      // If directory, try index files
      if (stats.isDirectory()) {
        let indexFound = false;
        
        for (const indexFile of index) {
          const indexPath = join(filePath, indexFile);
          try {
            await access(indexPath, constants.R_OK);
            const indexStats = await stat(indexPath);
            if (indexStats.isFile()) {
              filePath = indexPath;
              indexFound = true;
              break;
            }
          } catch {
            continue;
          }
        }

        if (!indexFound) {
          return next?.() || res.status(404).sendText('Not Found');
        }
      } else if (!stats.isFile()) {
        return next?.() || res.status(404).sendText('Not Found');
      }

      // Generate ETag if enabled
      let etagValue = null;
      if (etag) {
        const hash = createHash('md5');
        hash.update(`${stats.mtime.getTime()}-${stats.size}`);
        etagValue = `"${hash.digest('hex')}"`;

        // Check If-None-Match header
        const ifNoneMatch = req.getHeader('if-none-match');
        if (ifNoneMatch === etagValue) {
          res.status(304).end();
          return;
        }

        res.setHeader('ETag', etagValue);
      }

      // Set Cache-Control header
      if (maxAge > 0) {
        res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }

      // Set Last-Modified header
      res.setHeader('Last-Modified', stats.mtime.toUTCString());

      // Custom headers
      if (setHeaders && typeof setHeaders === 'function') {
        setHeaders(res, filePath, stats);
      }

      // Send the file (uses streaming from response.js)
      await res.sendFile(filePath);
      
    } catch (err) {
      console.error('Static file middleware error:', err);
      return next?.() || res.status(500).sendText('Internal Server Error');
    }
  };
}

export default staticFiles;
