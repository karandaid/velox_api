# File Streaming & Uploads

Master file handling in VeloxAPI with streaming for maximum performance and memory efficiency.

## Table of Contents
1. [File Upload Basics](#file-upload-basics)
2. [Multipart File Uploads](#multipart-file-uploads)
3. [File Streaming Downloads](#file-streaming-downloads)
4. [Image/Video Processing](#imagevideo-processing)
5. [Security & Validation](#security--validation)
6. [Production Best Practices](#production-best-practices)

---

## File Upload Basics

### Simple File Upload

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const router = new VeloxRouter();

// Ensure upload directory exists
if (!existsSync('./uploads')) {
  await mkdir('./uploads', { recursive: true });
}

router.post('/upload', async (res, req) => {
  const body = await req.getBody();
  
  if (!body.files || body.files.length === 0) {
    return res.sendError('No files uploaded', 400);
  }
  
  const file = body.files[0];
  const filepath = path.join('./uploads', file.filename);
  
  await writeFile(filepath, file.data);
  
  res.status(201).sendJSON({
    message: 'File uploaded successfully',
    filename: file.filename,
    size: file.data.length
  });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

**Test upload:**
```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@./photo.jpg"
```

---

## Multipart File Uploads

### Multiple Files Upload

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const router = new VeloxRouter();

// Upload multiple files
router.post('/upload/multiple', async (res, req) => {
  const body = await req.getBody();
  
  if (!body.files || body.files.length === 0) {
    return res.sendError('No files uploaded', 400);
  }
  
  const uploaded = [];
  
  for (const file of body.files) {
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.filename}`;
    const filepath = path.join('./uploads', filename);
    
    await writeFile(filepath, file.data);
    
    uploaded.push({
      original: file.filename,
      saved: filename,
      size: file.data.length,
      mimetype: file.mimetype
    });
  }
  
  res.status(201).sendJSON({
    uploaded: uploaded.length,
    files: uploaded
  });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

**Test multiple uploads:**
```bash
curl -X POST http://localhost:3000/upload/multiple \
  -F "files=@./photo1.jpg" \
  -F "files=@./photo2.jpg" \
  -F "files=@./document.pdf"
```

### Upload with Metadata

```javascript
router.post('/upload/metadata', async (res, req) => {
  const body = await req.getBody();
  
  // File + form data
  const file = body.files[0];
  const title = body.title;
  const description = body.description;
  
  const filename = `${Date.now()}-${file.filename}`;
  const filepath = path.join('./uploads', filename);
  
  await writeFile(filepath, file.data);
  
  // Save metadata to database
  const document = {
    id: Date.now(),
    filename: filename,
    title: title,
    description: description,
    size: file.data.length,
    mimetype: file.mimetype,
    uploadedAt: new Date().toISOString()
  };
  
  res.status(201).sendJSON({ document });
});
```

**Test with metadata:**
```bash
curl -X POST http://localhost:3000/upload/metadata \
  -F "file=@./report.pdf" \
  -F "title=Quarterly Report" \
  -F "description=Q4 2024 Financial Report"
```

---

## File Streaming Downloads

### Basic File Download

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';

const router = new VeloxRouter();

// Download file (streaming)
router.get('/download/:filename', async (res, req, query, params) => {
  const filename = params.filename;
  
  try {
    // Streams file with automatic MIME detection
    await res.sendFile(filename, './uploads');
  } catch (err) {
    res.sendError('File not found', 404);
  }
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

**Test download:**
```bash
curl http://localhost:3000/download/photo.jpg -O
```

### Range Requests (Video Streaming)

VeloxAPI automatically handles range requests for video/audio streaming:

```javascript
router.get('/video/:id', async (res, req, query, params) => {
  const videoFile = `${params.id}.mp4`;
  
  try {
    // Automatically handles:
    // - Range requests (for video seeking)
    // - Partial content (206 status)
    // - MIME type detection
    await res.sendFile(videoFile, './videos');
  } catch (err) {
    res.sendError('Video not found', 404);
  }
});
```

**HTML5 Video Player:**
```html
<!DOCTYPE html>
<html>
<body>
  <video width="640" height="360" controls>
    <source src="http://localhost:3000/video/sample" type="video/mp4">
  </video>
</body>
</html>
```

### Download with Custom Filename

```javascript
router.get('/download/:id', async (res, req, query, params) => {
  const fileId = params.id;
  const actualFilename = `${fileId}.pdf`;
  const downloadName = `report-${fileId}.pdf`;
  
  try {
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    await res.sendFile(actualFilename, './uploads');
  } catch (err) {
    res.sendError('File not found', 404);
  }
});
```

---

## Image/Video Processing

### Image Upload with Validation

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';
import { writeFile } from 'fs/promises';
import path from 'path';

const router = new VeloxRouter();

// Allowed image types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;  // 5MB

router.post('/upload/image', async (res, req) => {
  const body = await req.getBody();
  
  if (!body.files || body.files.length === 0) {
    return res.sendError('No image uploaded', 400);
  }
  
  const file = body.files[0];
  
  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return res.sendError('Invalid image type. Only JPEG, PNG, GIF, WebP allowed', 400);
  }
  
  // Validate file size
  if (file.data.length > MAX_FILE_SIZE) {
    return res.sendError('Image too large. Max size: 5MB', 400);
  }
  
  const filename = `${Date.now()}-${file.filename}`;
  const filepath = path.join('./uploads/images', filename);
  
  await writeFile(filepath, file.data);
  
  res.status(201).sendJSON({
    message: 'Image uploaded successfully',
    url: `/images/${filename}`,
    size: file.data.length,
    type: file.mimetype
  });
});

// Serve images
router.get('/images/:filename', async (res, req, query, params) => {
  await res.sendFile(params.filename, './uploads/images');
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

### Generate Thumbnail (using external library)

```javascript
import sharp from 'sharp';  // npm install sharp

router.post('/upload/image/thumbnail', async (res, req) => {
  const body = await req.getBody();
  const file = body.files[0];
  
  const filename = `${Date.now()}-${file.filename}`;
  const originalPath = path.join('./uploads/images', filename);
  const thumbnailPath = path.join('./uploads/thumbnails', `thumb-${filename}`);
  
  // Save original
  await writeFile(originalPath, file.data);
  
  // Create thumbnail (200x200)
  await sharp(file.data)
    .resize(200, 200, { fit: 'cover' })
    .toFile(thumbnailPath);
  
  res.status(201).sendJSON({
    original: `/images/${filename}`,
    thumbnail: `/thumbnails/thumb-${filename}`
  });
});
```

---

## Security & Validation

### Secure File Upload

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';
import crypto from 'crypto';
import path from 'path';

const router = new VeloxRouter();

// Security helpers
function sanitizeFilename(filename) {
  // Remove path traversal attempts
  const sanitized = filename.replace(/\.\./g, '').replace(/\//g, '');
  // Generate safe filename
  const ext = path.extname(sanitized);
  const hash = crypto.randomBytes(16).toString('hex');
  return `${hash}${ext}`;
}

function validateFileType(mimetype, allowedTypes) {
  return allowedTypes.includes(mimetype);
}

function validateFileSize(size, maxSize) {
  return size <= maxSize;
}

// Secure upload endpoint
router.post('/upload/secure', async (res, req) => {
  const body = await req.getBody();
  
  if (!body.files || body.files.length === 0) {
    return res.sendError('No files uploaded', 400);
  }
  
  const file = body.files[0];
  
  // Validation
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
  const MAX_SIZE = 10 * 1024 * 1024;  // 10MB
  
  if (!validateFileType(file.mimetype, ALLOWED_TYPES)) {
    return res.sendError('File type not allowed', 400);
  }
  
  if (!validateFileSize(file.data.length, MAX_SIZE)) {
    return res.sendError('File too large', 400);
  }
  
  // Generate secure filename
  const secureFilename = sanitizeFilename(file.filename);
  const filepath = path.join('./uploads', secureFilename);
  
  await writeFile(filepath, file.data);
  
  res.status(201).sendJSON({
    message: 'File uploaded securely',
    filename: secureFilename,
    size: file.data.length
  });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

### Virus Scanning (concept)

```javascript
// Example: Integrate with ClamAV or similar
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function scanFile(filepath) {
  try {
    // Example: clamscan
    await execAsync(`clamscan --no-summary ${filepath}`);
    return true;  // Clean
  } catch (err) {
    return false;  // Infected
  }
}

router.post('/upload/scan', async (res, req) => {
  const body = await req.getBody();
  const file = body.files[0];
  
  const tempPath = path.join('./temp', `scan-${Date.now()}`);
  await writeFile(tempPath, file.data);
  
  const isClean = await scanFile(tempPath);
  
  if (!isClean) {
    await unlink(tempPath);
    return res.sendError('File failed security scan', 400);
  }
  
  // Move to uploads
  const finalPath = path.join('./uploads', file.filename);
  await rename(tempPath, finalPath);
  
  res.status(201).sendJSON({ message: 'File uploaded and scanned' });
});
```

---

## Production Best Practices

### Complete File Upload System

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';
import { writeFile, mkdir, readdir, stat, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import crypto from 'crypto';
import path from 'path';

const router = new VeloxRouter();

// Configuration
const UPLOAD_DIR = './uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024;  // 10MB
const ALLOWED_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'text/plain'],
  videos: ['video/mp4', 'video/webm']
};

// Initialize directories
for (const dir of ['images', 'documents', 'videos']) {
  const fullPath = path.join(UPLOAD_DIR, dir);
  if (!existsSync(fullPath)) {
    await mkdir(fullPath, { recursive: true });
  }
}

// File metadata store (use database in production)
const files = new Map();

// Generate secure filename
function generateFilename(originalFilename) {
  const ext = path.extname(originalFilename);
  const hash = crypto.randomBytes(16).toString('hex');
  return `${hash}${ext}`;
}

// Determine file category
function getFileCategory(mimetype) {
  for (const [category, types] of Object.entries(ALLOWED_TYPES)) {
    if (types.includes(mimetype)) {
      return category;
    }
  }
  return null;
}

// Upload endpoint
router.post('/files/upload', async (res, req, query, params, data) => {
  const body = await req.getBody();
  
  if (!body.files || body.files.length === 0) {
    return res.sendError('No files uploaded', 400);
  }
  
  const uploadedFiles = [];
  
  for (const file of body.files) {
    // Validate size
    if (file.data.length > MAX_FILE_SIZE) {
      return res.sendError(`File ${file.filename} exceeds max size`, 400);
    }
    
    // Validate type
    const category = getFileCategory(file.mimetype);
    if (!category) {
      return res.sendError(`File type ${file.mimetype} not allowed`, 400);
    }
    
    // Generate secure filename
    const secureFilename = generateFilename(file.filename);
    const filepath = path.join(UPLOAD_DIR, category, secureFilename);
    
    // Save file
    await writeFile(filepath, file.data);
    
    // Store metadata
    const fileId = crypto.randomBytes(8).toString('hex');
    const metadata = {
      id: fileId,
      originalFilename: file.filename,
      filename: secureFilename,
      category: category,
      mimetype: file.mimetype,
      size: file.data.length,
      uploadedBy: data.user?.userId || 'anonymous',
      uploadedAt: new Date().toISOString()
    };
    
    files.set(fileId, metadata);
    uploadedFiles.push(metadata);
  }
  
  res.status(201).sendJSON({ 
    uploaded: uploadedFiles.length,
    files: uploadedFiles 
  });
});

// List files
router.get('/files', (res) => {
  const fileList = Array.from(files.values());
  res.sendJSON({ files: fileList, total: fileList.length });
});

// Get file info
router.get('/files/:id', (res, req, query, params) => {
  const file = files.get(params.id);
  
  if (!file) {
    return res.sendError('File not found', 404);
  }
  
  res.sendJSON({ file });
});

// Download file
router.get('/files/:id/download', async (res, req, query, params) => {
  const file = files.get(params.id);
  
  if (!file) {
    return res.sendError('File not found', 404);
  }
  
  const filepath = path.join(UPLOAD_DIR, file.category, file.filename);
  
  // Set original filename for download
  res.setHeader('Content-Disposition', `attachment; filename="${file.originalFilename}"`);
  
  await res.sendFile(file.filename, path.join(UPLOAD_DIR, file.category));
});

// Delete file
router.delete('/files/:id', async (res, req, query, params) => {
  const file = files.get(params.id);
  
  if (!file) {
    return res.sendError('File not found', 404);
  }
  
  const filepath = path.join(UPLOAD_DIR, file.category, file.filename);
  
  // Delete physical file
  await unlink(filepath);
  
  // Remove metadata
  files.delete(params.id);
  
  res.sendJSON({ message: 'File deleted successfully' });
});

new VeloxServer().setPort(3000).setRouter(router).start();
```

### Storage Monitoring

```javascript
router.get('/files/stats', async (res) => {
  let totalSize = 0;
  let fileCount = 0;
  const categoryStats = {};
  
  for (const [category, types] of Object.entries(ALLOWED_TYPES)) {
    const categoryPath = path.join(UPLOAD_DIR, category);
    const filesInCategory = await readdir(categoryPath);
    
    let categorySize = 0;
    for (const file of filesInCategory) {
      const stats = await stat(path.join(categoryPath, file));
      categorySize += stats.size;
    }
    
    categoryStats[category] = {
      count: filesInCategory.length,
      size: categorySize
    };
    
    totalSize += categorySize;
    fileCount += filesInCategory.length;
  }
  
  res.sendJSON({
    totalFiles: fileCount,
    totalSize: totalSize,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    categories: categoryStats
  });
});
```

---

## Testing File Operations

```bash
# Upload image
curl -X POST http://localhost:3000/files/upload \
  -F "files=@./photo.jpg" \
  -H "Authorization: Bearer YOUR_TOKEN"

# List all files
curl http://localhost:3000/files

# Get file info
curl http://localhost:3000/files/abc123

# Download file
curl http://localhost:3000/files/abc123/download -O

# Delete file
curl -X DELETE http://localhost:3000/files/abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Storage stats
curl http://localhost:3000/files/stats
```

---

## Next Steps

- **[Testing Strategies](./08-testing-strategies.md)** - Test file uploads/downloads
- **[Authentication & Security](./06-authentication-security.md)** - Protect file operations
- **[Performance Guide](../docs/PERFORMANCE.md)** - Optimize streaming

---

**File Handling Checklist:**
- ✅ Validate file types (mimetype)
- ✅ Validate file sizes (max limits)
- ✅ Sanitize filenames (prevent path traversal)
- ✅ Use secure random filenames
- ✅ Store metadata in database
- ✅ Implement access control
- ✅ Monitor storage usage
- ✅ Handle errors gracefully
- ✅ Use streaming for large files
- ✅ Support range requests for videos
