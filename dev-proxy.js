import httpProxy from 'http-proxy';
import http from 'http';

// Create a proxy server with custom application logic
const proxy = httpProxy.createProxyServer({
  ws: true,
  xfwd: true
});

proxy.on('error', (err, req, res) => {
  if (res.writeHead) {
    res.writeHead(502, {
      'Content-Type': 'text/plain'
    });
  }
  res.end('Something went wrong. And we are reporting a custom error message.');
});

const server = http.createServer((req, res) => {
  const host = req.headers.host || '';
  
  if (req.url && req.url.startsWith('/api')) {
    // Proxy API requests to Express backend (port 3000)
    proxy.web(req, res, { target: 'http://localhost:3000' });
  } else if (host.startsWith('admin.localhost')) {
    // Proxy to Admin Portal (port 4001)
    proxy.web(req, res, { target: 'http://localhost:4001' });
  } else {
    // Proxy to Frontend (port 4002)
    proxy.web(req, res, { target: 'http://localhost:4002' });
  }
});

server.on('upgrade', (req, socket, head) => {
  const host = req.headers.host || '';
  
  if (host.startsWith('admin.localhost')) {
    proxy.ws(req, socket, head, { target: 'http://localhost:4001' });
  } else {
    proxy.ws(req, socket, head, { target: 'http://localhost:4002' });
  }
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
  console.log(`Frontend routes to localhost:4002`);
  console.log(`Admin routes to localhost:4001`);
});
