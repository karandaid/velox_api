/**
 * MIME type detection utility
 * Maps file extensions to MIME types
 * @module mime-types
 */

/**
 * MIME type lookup table
 */
export const MIME_TYPES = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

/**
 * Gets MIME type for a file extension
 * @param {string} ext - File extension (with or without dot)
 * @returns {string} MIME type or default
 */
export function getMimeType(ext, defaultType = 'application/octet-stream') {
  const extension = ext.startsWith('.') ? ext : `.${ext}`;
  return MIME_TYPES[extension.toLowerCase()] || defaultType;
}

export default {
  MIME_TYPES,
  getMimeType,
};
