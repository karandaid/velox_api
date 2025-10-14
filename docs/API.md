# VeloxAPI - API Reference

## Table of Contents

- [VeloxServer](#veloxserver)
- [VeloxRouter](#veloxrouter)
- [Request](#request)
- [Response](#response)
- [Cookie](#cookie)
- [LRUCache](#lrucache)

---

## VeloxServer

High-performance HTTP/HTTPS server class.

### Constructor

```javascript
const server = new VeloxServer();
```

### Methods

#### `setPort(port)`

Sets the server port.

**Parameters:**
- `port` (number): Port number (default: 3000)

**Returns:** `VeloxServer` instance for chaining

#### `setHost(host)`

Sets the server host.

**Parameters:**
- `host` (string): Host address (default: '0.0.0.0')

**Returns:** `VeloxServer` instance for chaining

#### `setRouter(router)`

Sets the router for handling requests.

**Parameters:**
- `router` (VeloxRouter): Router instance

**Returns:** `VeloxServer` instance for chaining

#### `enableHTTPS(options)`

Enables HTTPS with SSL options.

**Parameters:**
- `options` (Object): SSL options (`key`, `cert`)

**Returns:** `VeloxServer` instance for chaining

#### `start()`

Starts the server.

**Returns:** `http.Server` or `https.Server` instance

#### `stop(callback)`

Stops the server gracefully.

**Parameters:**
- `callback` (Function): Optional callback function

---

## VeloxRouter

High-performance router with radix tree routing.

### Constructor

```javascript
const router = new VeloxRouter();
```

### Methods

#### `get(path, handler)`

Adds a GET route.

**Parameters:**
- `path` (string): Route path (supports typed parameters)
- `handler` (Function): Route handler `(res, req, query, params) => {}`
  - `res` (Response): Response object
  - `req` (Request): Request object
  - `query` (Object): Query parameters
  - `params` (Object): Path parameters (typed and validated)

**Note:** Body parsing is lazy - call `await req.getBody()` when needed.

**Returns:** `VeloxRouter` instance for chaining

#### `post(path, handler)`

Adds a POST route (same signature as `get`).

#### `put(path, handler)`

Adds a PUT route (same signature as `get`).

#### `delete(path, handler)`

Adds a DELETE route (same signature as `get`).

#### `patch(path, handler)`

Adds a PATCH route (same signature as `get`).

#### `use(pathOrHandler, handler)`

Adds middleware.

**Parameters:**
- `pathOrHandler` (string|Function): Path or middleware function
- `handler` (Function): Middleware function if path is provided

**Returns:** `VeloxRouter` instance for chaining

#### `setPrefix(prefix)`

Sets a prefix for all routes.

**Parameters:**
- `prefix` (string): Route prefix

**Returns:** `VeloxRouter` instance for chaining

### Typed Parameters

VeloxAPI supports typed route parameters for automatic validation:

```javascript
router.get('/user/:id=number', (res, req, query, params) => {
  console.log(typeof params.id); // 'number'
});
```

**Supported Types:**
- `number` - Numeric values only
- `string` - Alphabetic characters only
- `alphanumeric` - Letters and numbers
- `uuid` - UUID format
- `email` - Email format
- `slug` - URL-friendly slugs
- `date` - Date format (YYYY-MM-DD)
- `phone` - Phone numbers
- `ip` - IPv4 addresses
- `hex` - Hexadecimal values
- `version` - Version strings (v1, v2, etc.)
- `boolean` - true/false/1/0

---

## Request

Request wrapper with utilities.

### Methods

#### `getUrl()`

Returns the full request URL.

#### `getPathname()`

Returns the pathname.

#### `getMethod()`

Returns the HTTP method.

#### `getHeader(name)`

Gets a specific header.

**Parameters:**
- `name` (string): Header name

**Returns:** Header value or `undefined`

#### `getQuery(key)`

Gets query parameter(s).

**Parameters:**
- `key` (string): Optional specific query key

**Returns:** Query value or all query params

#### `getBody(maxSize)`

Parses and returns the request body.

**Parameters:**
- `maxSize` (number): Maximum body size in bytes (default: 10MB)

**Returns:** `Promise<*>` Parsed body

**Supported Content Types:**
- `application/json`
- `application/x-www-form-urlencoded`
- `multipart/form-data`
- `text/plain`
- `application/xml`

#### `isSecure()`

Checks if request is HTTPS.

**Returns:** `boolean`

#### `getClientIP()`

Gets client IP address.

**Returns:** `string`

---

## Response

Response wrapper with streaming methods.

### Methods

#### `status(code)`

Sets HTTP status code.

**Parameters:**
- `code` (number): Status code

**Returns:** `Response` instance for chaining

#### `setHeader(name, value)`

Sets response header(s).

**Parameters:**
- `name` (string|Object): Header name or object of headers
- `value` (string): Header value

**Returns:** `Response` instance for chaining

#### `sendJSON(data)`

Sends JSON response.

**Parameters:**
- `data` (*): Data to stringify

#### `sendHTML(html)`

Sends HTML response.

**Parameters:**
- `html` (string): HTML content

#### `sendText(text)`

Sends plain text response.

**Parameters:**
- `text` (string): Text content

#### `sendFile(filePath, baseDir)`

Sends file with streaming (supports range requests).

**Parameters:**
- `filePath` (string): Path to file
- `baseDir` (string): Base directory (default: `process.cwd()`)

#### `sendBuffer(buffer, contentType)`

Sends buffer response.

**Parameters:**
- `buffer` (Buffer): Buffer data
- `contentType` (string): Content type (default: 'application/octet-stream')

#### `sendError(message, statusCode)`

Sends error response.

**Parameters:**
- `message` (string): Error message
- `statusCode` (number): Status code (default: 500)

#### `redirect(url, statusCode)`

Redirects to a URL.

**Parameters:**
- `url` (string): Redirect URL
- `statusCode` (number): Status code (default: 302)

#### `setCORS(origin, methods, headers)`

Sets CORS headers.

**Parameters:**
- `origin` (string): Allowed origin (default: '*')
- `methods` (string): Allowed methods (default: 'GET,POST,PUT,DELETE,PATCH')
- `headers` (string): Allowed headers (default: 'Content-Type')

**Returns:** `Response` instance for chaining

---

## Cookie

Cookie management with signing support.

### Constructor

```javascript
const cookie = new Cookie('name', 'value', options);
```

**Options:**
- `httpOnly` (boolean): HttpOnly flag (default: true)
- `secure` (boolean): Secure flag (default: true)
- `sameSite` (string): SameSite attribute (default: 'Strict')
- `maxAge` (number): Max age in seconds
- `path` (string): Cookie path (default: '/')
- `domain` (string): Cookie domain

### Methods

#### `toString()`

Converts cookie to string format.

#### `sign(secret)`

Signs the cookie value.

**Parameters:**
- `secret` (string): Secret key

**Returns:** Signed value

#### `Cookie.verify(signedValue, secret)` (static)

Verifies a signed cookie.

**Parameters:**
- `signedValue` (string): Signed value
- `secret` (string): Secret key

**Returns:** Original value or `null`

---

## LRUCache

Least Recently Used cache with TTL support.

### Constructor

```javascript
const cache = new LRUCache(maxSize, ttl);
```

**Parameters:**
- `maxSize` (number): Maximum cache size (default: 500)
- `ttl` (number): Time to live in milliseconds (optional)

### Methods

#### `get(key)`

Gets a value from cache.

**Returns:** Cached value or `undefined`

#### `set(key, value)`

Sets a value in cache.

#### `delete(key)`

Deletes a key from cache.

**Returns:** `boolean`

#### `has(key)`

Checks if key exists.

**Returns:** `boolean`

#### `clear()`

Clears all cached values.

#### `getSize()`

Gets current cache size.

**Returns:** `number`

---

## Example Usage

```javascript
import { VeloxServer, VeloxRouter } from 'veloxapi';

const router = new VeloxRouter();

router.get('/user/:id=number', (res, req, query, params) => {
  res.sendJSON({ userId: params.id });
});

router.post('/data', async (res, req, query, params, body) => {
  res.sendJSON({ received: body });
});

const server = new VeloxServer()
  .setPort(3000)
  .setRouter(router)
  .start();
```
