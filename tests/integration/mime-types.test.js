/**
 * MIME type detection tests
 * Tests the actual framework MIME type detection
 */

import { describe, test, expect } from '@jest/globals';
import { getMimeType, MIME_TYPES } from '../../lib/utils/mime-types.js';

describe('MIME Type Detection', () => {
  describe('Web Documents', () => {
    test('HTML files', () => {
      expect(MIME_TYPES['.html']).toBe('text/html');
      expect(MIME_TYPES['.htm']).toBe('text/html');
    });

    test('CSS files', () => {
      expect(MIME_TYPES['.css']).toBe('text/css');
    });

    test('JavaScript files', () => {
      expect(MIME_TYPES['.js']).toBe('application/javascript');
      expect(MIME_TYPES['.mjs']).toBe('application/javascript');
    });

    test('JSON files', () => {
      expect(MIME_TYPES['.json']).toBe('application/json');
    });

    test('XML files', () => {
      expect(MIME_TYPES['.xml']).toBe('application/xml');
    });
  });

  describe('Text Files', () => {
    test('Plain text', () => {
      expect(MIME_TYPES['.txt']).toBe('text/plain');
    });

    test('Markdown', () => {
      expect(MIME_TYPES['.md']).toBe('text/markdown');
    });
  });

  describe('Images', () => {
    test('PNG', () => {
      expect(MIME_TYPES['.png']).toBe('image/png');
    });

    test('JPEG', () => {
      expect(MIME_TYPES['.jpg']).toBe('image/jpeg');
      expect(MIME_TYPES['.jpeg']).toBe('image/jpeg');
    });

    test('GIF', () => {
      expect(MIME_TYPES['.gif']).toBe('image/gif');
    });

    test('SVG', () => {
      expect(MIME_TYPES['.svg']).toBe('image/svg+xml');
    });

    test('WebP', () => {
      expect(MIME_TYPES['.webp']).toBe('image/webp');
    });

    test('Icon', () => {
      expect(MIME_TYPES['.ico']).toBe('image/x-icon');
    });
  });

  describe('Documents', () => {
    test('PDF', () => {
      expect(MIME_TYPES['.pdf']).toBe('application/pdf');
    });
  });

  describe('Archives', () => {
    test('ZIP', () => {
      expect(MIME_TYPES['.zip']).toBe('application/zip');
    });

    test('TAR', () => {
      expect(MIME_TYPES['.tar']).toBe('application/x-tar');
    });

    test('GZIP', () => {
      expect(MIME_TYPES['.gz']).toBe('application/gzip');
    });
  });

  describe('Video', () => {
    test('MP4', () => {
      expect(MIME_TYPES['.mp4']).toBe('video/mp4');
    });

    test('WebM', () => {
      expect(MIME_TYPES['.webm']).toBe('video/webm');
    });
  });

  describe('Audio', () => {
    test('MP3', () => {
      expect(MIME_TYPES['.mp3']).toBe('audio/mpeg');
    });

    test('WAV', () => {
      expect(MIME_TYPES['.wav']).toBe('audio/wav');
    });
  });

  describe('Fonts', () => {
    test('WOFF', () => {
      expect(MIME_TYPES['.woff']).toBe('font/woff');
    });

    test('WOFF2', () => {
      expect(MIME_TYPES['.woff2']).toBe('font/woff2');
    });

    test('TTF', () => {
      expect(MIME_TYPES['.ttf']).toBe('font/ttf');
    });

    test('OTF', () => {
      expect(MIME_TYPES['.otf']).toBe('font/otf');
    });
  });

  describe('getMimeType function', () => {
    test('returns correct MIME type for extensions with dot', () => {
      expect(getMimeType('.html')).toBe('text/html');
      expect(getMimeType('.json')).toBe('application/json');
      expect(getMimeType('.png')).toBe('image/png');
    });

    test('returns correct MIME type for extensions without dot', () => {
      expect(getMimeType('html')).toBe('text/html');
      expect(getMimeType('json')).toBe('application/json');
      expect(getMimeType('png')).toBe('image/png');
    });

    test('returns default for unknown extensions', () => {
      expect(getMimeType('.unknown')).toBe('application/octet-stream');
      expect(getMimeType('xyz')).toBe('application/octet-stream');
    });

    test('accepts custom default type', () => {
      expect(getMimeType('.unknown', 'text/plain')).toBe('text/plain');
    });

    test('handles case insensitivity', () => {
      expect(getMimeType('.HTML')).toBe('text/html');
      expect(getMimeType('.PNG')).toBe('image/png');
    });
  });
});
