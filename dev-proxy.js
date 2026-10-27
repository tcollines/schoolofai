import httpProxy from 'http-proxy';
import http from 'http';

// Create a proxy server with custom application logic
const proxy = httpProxy.createProxyServer({
  ws: true,
  xfwd: true
});

proxy.on('error', (err, req, res) => {
  console.warn('[Proxy Warning]:', err.message);
  if (res && typeof res.writeHead === 'function') {
    try {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Proxy Error: ' + (err.message || 'Service unavailable'));
    } catch (_) {}
  } else if (res && typeof res.destroy === 'function') {
    try {
      res.destroy();
    } catch (_) {}
  }
});

process.on('uncaughtException', (err) => {
  if (err.code === 'ECONNRESET') {
    return; // Ignore harmless socket disconnects
  }
  console.error('[Proxy Uncaught Exception]:', err);
});

const server = http.createServer((req, res) => {
  const host = (req.headers.host || '').toLowerCase();
  
  if (req.url && req.url.startsWith('/api')) {
    // Proxy API requests to Express backend (port 3000)
    proxy.web(req, res, { target: 'http://localhost:3000' });
  } else if (host.startsWith('admin.localhost') || host.startsWith('admin.')) {
    // Proxy to Admin Portal (port 4001)
    proxy.web(req, res, { target: 'http://localhost:4001' });
  } else {
    // Proxy to Frontend (port 4004)
    proxy.web(req, res, { target: 'http://localhost:4004' });
  }
});

server.on('upgrade', (req, socket, head) => {
  const host = (req.headers.host || '').toLowerCase();
  
  if (host.startsWith('admin.localhost') || host.startsWith('admin.')) {
    proxy.ws(req, socket, head, { target: 'http://localhost:4001' });
  } else {
    proxy.ws(req, socket, head, { target: 'http://localhost:4004' });
  }
});

const PORT = 4002;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`Dev proxy listening on port ${PORT}`);
  console.log(`- http://admin.localhost:${PORT} -> Admin Portal (port 4001)`);
  console.log(`- http://localhost:${PORT}       -> Student Portal (port 4004)`);
  console.log(`- http://localhost:${PORT}/api   -> Express Backend (port 3000)`);
  console.log(`=======================================================`);
});
