// Welile School of AI: minimal service worker.
// It exists only so phones offer "Install app". It caches nothing and never answers a request itself,
// so the site loads exactly as it did before.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* network as usual */ });
