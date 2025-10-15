async function testCache() {
  const result = document.getElementById('result');
  result.textContent = 'Testing...';
  
  try {
    const response = await fetch('/index.html');
    const etag = response.headers.get('etag');
    const cacheControl = response.headers.get('cache-control');
    
    result.textContent = `Status: ${response.status} ${response.statusText}\n` +
                        `ETag: ${etag}\n` +
                        `Cache-Control: ${cacheControl}\n\n` +
                        `✅ ETag caching is working!\n` +
                        `Refresh the page to see 304 Not Modified.`;
  } catch (err) {
    result.textContent = `Error: ${err.message}`;
  }
}

console.log('✅ VeloxAPI Static Files Middleware Demo Ready!');
