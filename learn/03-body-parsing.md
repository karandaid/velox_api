# Body Parsing - Handle POST/PUT Data

## Overview

VeloxAPI provides **lazy body parsing** - it only parses the request body when you explicitly request it. This gives you:

- ⚡ **Better Performance** - No wasted CPU on unused bodies
- 🎯 **Memory Efficiency** - Parse only what you need
- 📦 **Multiple Formats** - JSON, XML, YAML, form-data, multipart

## The Lazy Parsing Concept

**Traditional frameworks** parse the body for every request:

```javascript
// Express with body-parser
app.use(express.json());  // Parses ALL JSON bodies

app.post('/webhook', (req, res) => {
  // req.body is already parsed (wasted CPU if unused)
  res.send('ok');
});
```

**VeloxAPI** parses only when needed:

```javascript
router.post('/webhook', async (res, req) => {
  // Body NOT parsed yet (zero overhead)
  res.sendText('ok');
});

router.post('/users', async (res, req) => {
  // Parse NOW (only when needed)
  const body = await req.getBody();
  res.sendJSON({ user: body });
});
```

## JSON Parsing

The most common format for APIs:

```javascript
router.post('/api/users', async (res, req) => {
  const body = await req.getBody();
  
  // body is automatically parsed from JSON
  console.log(body.name);   // "Alice"
  console.log(body.age);    // 30
  
  res.status(201).sendJSON({ 
    created: true, 
    user: body 
  });
});
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","age":30}'
```

**Response:**
```json
{
  "created": true,
  "user": {"name":"Alice","age":30}
}
```

## Form Data (URL-encoded)

Handle HTML form submissions:

```javascript
router.post('/contact', async (res, req) => {
  const body = await req.getBody();
  
  // Parsed from application/x-www-form-urlencoded
  console.log(body.name);     // "John"
  console.log(body.email);    // "john@example.com"
  console.log(body.message);  // "Hello!"
  
  res.sendJSON({ 
    received: true,
    data: body 
  });
});
```

**HTML Form:**
```html
<form action="/contact" method="POST">
  <input name="name" value="John">
  <input name="email" value="john@example.com">
  <textarea name="message">Hello!</textarea>
  <button type="submit">Send</button>
</form>
```

**Or with curl:**
```bash
curl -X POST http://localhost:3000/contact \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=John&email=john@example.com&message=Hello"
```

## XML Parsing

VeloxAPI automatically parses XML:

```javascript
router.post('/api/xml', async (res, req) => {
  const body = await req.getBody();
  
  // Parsed from XML to JavaScript object
  console.log(body.user.name);  // "Alice"
  console.log(body.user.age);   // "30"
  
  res.sendJSON({ parsed: body });
});
```

**Request:**
```bash
curl -X POST http://localhost:3000/api/xml \
  -H "Content-Type: application/xml" \
  -d '<user><name>Alice</name><age>30</age></user>'
```

**Response:**
```json
{
  "parsed": {
    "name": "Alice",
    "age": "30"
  }
}
```

## YAML Parsing

Parse YAML configuration:

```javascript
router.post('/config', async (res, req) => {
  const body = await req.getBody();
  
  // Parsed from YAML
  console.log(body.server.port);  // 8080
  console.log(body.server.host);  // "0.0.0.0"
  
  res.sendJSON({ config: body });
});
```

**Request:**
```bash
curl -X POST http://localhost:3000/config \
  -H "Content-Type: application/x-yaml" \
  -d 'server:
  port: 8080
  host: 0.0.0.0'
```

## Multipart File Uploads

Handle file uploads with multipart/form-data:

```javascript
router.post('/upload', async (res, req) => {
  const body = await req.getBody();
  
  // body.files contains uploaded files
  for (const file of body.files) {
    console.log('File:', file.filename);
    console.log('Size:', file.data.length, 'bytes');
    console.log('Type:', file.contentType);
    
    // Save file
    await saveFile(file.filename, file.data);
  }
  
  // body.fields contains text fields
  console.log('Title:', body.fields.title);
  
  res.sendJSON({ 
    uploaded: body.files.length,
    files: body.files.map(f => f.filename)
  });
});
```

**HTML Form:**
```html
<form action="/upload" method="POST" enctype="multipart/form-data">
  <input name="title" value="My Upload">
  <input type="file" name="file" multiple>
  <button type="submit">Upload</button>
</form>
```

**Or with curl:**
```bash
curl -X POST http://localhost:3000/upload \
  -F "title=My Upload" \
  -F "file=@photo.jpg" \
  -F "file=@document.pdf"
```

## Request Size Limits

Protect against huge payloads:

```javascript
router.post('/api/data', async (res, req) => {
  try {
    // Default limit: 10MB
    const body = await req.getBody();
    res.sendJSON({ data: body });
  } catch (err) {
    if (err.message.includes('too large')) {
      res.sendError('Request body too large (max 10MB)', 413);
    } else {
      res.sendError('Invalid request', 400);
    }
  }
});
```

**Large requests are automatically rejected:**
```
Request body exceeds limit (10485760 bytes)
```

## Streaming Large Files

For very large files, use streaming instead of buffering:

```javascript
import { createWriteStream } from 'fs';

router.post('/upload-large', async (res, req) => {
  const writeStream = createWriteStream('./uploads/large-file.bin');
  
  // Stream directly to disk (no memory buffering)
  req.req.pipe(writeStream);
  
  writeStream.on('finish', () => {
    res.sendJSON({ uploaded: true });
  });
  
  writeStream.on('error', (err) => {
    res.sendError('Upload failed', 500);
  });
});
```

## Handling Different Content Types

Check content type before parsing:

```javascript
router.post('/flexible', async (res, req) => {
  const contentType = req.getHeader('content-type');
  
  if (contentType.includes('application/json')) {
    const body = await req.getBody();
    res.sendJSON({ type: 'json', data: body });
  } 
  else if (contentType.includes('application/xml')) {
    const body = await req.getBody();
    res.sendJSON({ type: 'xml', data: body });
  }
  else {
    res.sendError('Unsupported content type', 415);
  }
});
```

## Validation After Parsing

Validate the parsed data:

```javascript
router.post('/api/users', async (res, req) => {
  const body = await req.getBody();
  
  // Validate required fields
  if (!body.name || !body.email) {
    return res.sendError('Missing required fields', 400);
  }
  
  // Validate email format
  if (!body.email.includes('@')) {
    return res.sendError('Invalid email', 400);
  }
  
  // Validate age range
  if (body.age < 18 || body.age > 120) {
    return res.sendError('Invalid age', 400);
  }
  
  // All good, create user
  const user = await createUser(body);
  res.status(201).sendJSON({ user });
});
```

## Raw Body Access

Get the raw body buffer:

```javascript
router.post('/webhook', async (res, req) => {
  const rawBody = await req.getRawBody();
  
  // rawBody is a Buffer
  console.log('Size:', rawBody.length);
  console.log('Content:', rawBody.toString());
  
  res.sendText('Received');
});
```

## Query + Body Together

Combine query parameters and body:

```javascript
router.post('/api/items', async (res, req, query) => {
  const body = await req.getBody();
  
  const item = {
    ...body,
    category: query.category,  // From URL: ?category=electronics
    featured: query.featured === 'true'
  };
  
  await saveItem(item);
  
  res.status(201).sendJSON({ item });
});
```

**Request:**
```bash
curl -X POST "http://localhost:3000/api/items?category=electronics&featured=true" \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":999}'
```

## Error Handling

Handle parsing errors gracefully:

```javascript
router.post('/api/data', async (res, req) => {
  try {
    const body = await req.getBody();
    res.sendJSON({ success: true, data: body });
  } catch (err) {
    console.error('Parse error:', err);
    
    if (err instanceof SyntaxError) {
      res.sendError('Invalid JSON', 400);
    } else if (err.message.includes('too large')) {
      res.sendError('Payload too large', 413);
    } else {
      res.sendError('Bad request', 400);
    }
  }
});
```

## Real-World Example: Blog API

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const router = new VeloxRouter();
const posts = [];

// Create post (JSON)
router.post('/api/posts', async (res, req) => {
  try {
    const body = await req.getBody();
    
    // Validate
    if (!body.title || !body.content) {
      return res.sendError('Title and content required', 400);
    }
    
    // Create post
    const post = {
      id: posts.length + 1,
      title: body.title,
      content: body.content,
      author: body.author || 'Anonymous',
      createdAt: new Date().toISOString()
    };
    
    posts.push(post);
    
    res.status(201).sendJSON({ post });
  } catch (err) {
    res.sendError('Invalid request', 400);
  }
});

// Upload post image
router.post('/api/posts/:id=number/image', async (res, req, query, params) => {
  try {
    const body = await req.getBody();
    
    if (!body.files || body.files.length === 0) {
      return res.sendError('No image uploaded', 400);
    }
    
    const image = body.files[0];
    const filename = `post-${params.id}-${image.filename}`;
    const filepath = join('./uploads', filename);
    
    await writeFile(filepath, image.data);
    
    res.sendJSON({ 
      uploaded: true,
      url: `/uploads/${filename}`
    });
  } catch (err) {
    res.sendError('Upload failed', 500);
  }
});

// Import posts (XML)
router.post('/api/posts/import', async (res, req) => {
  try {
    const body = await req.getBody();
    
    // XML structure: <posts><post><title>...</title><content>...</content></post></posts>
    const importedPosts = Array.isArray(body.post) ? body.post : [body.post];
    
    for (const xmlPost of importedPosts) {
      posts.push({
        id: posts.length + 1,
        title: xmlPost.title,
        content: xmlPost.content,
        author: xmlPost.author || 'Imported',
        createdAt: new Date().toISOString()
      });
    }
    
    res.sendJSON({ 
      imported: importedPosts.length,
      total: posts.length
    });
  } catch (err) {
    res.sendError('Import failed', 400);
  }
});

const server = new VeloxServer()
  .setPort(3000)
  .setRouter(router)
  .start();
```

## Summary

VeloxAPI body parsing:

- ✅ **Lazy parsing** - Only when needed
- ✅ **Multiple formats** - JSON, XML, YAML, form-data, multipart
- ✅ **Automatic detection** - Based on Content-Type
- ✅ **Size limits** - Protect against huge payloads
- ✅ **Streaming support** - For large files
- ✅ **Error handling** - Graceful failure

**Next:** Learn about [Middleware](04-middleware.md) for authentication, logging, and more!
