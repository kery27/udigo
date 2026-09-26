// 항상 네트워크를 먼저 쓰고(배포 직후에도 옛 화면이 남지 않게), 끊겼을 때만 저장해 둔 사본으로 연다.
const CACHE = 'udigo-v1';
const CACHE_HOSTS = [self.location.host, 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', 'manifest.webmanifest', 'icon-192.png'])).catch(() => {}));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (!CACHE_HOSTS.includes(url.host) || url.pathname.endsWith('.gif')) return;
    event.respondWith(
        fetch(req)
            .then((res) => {
                if (res.ok || res.type === 'opaque') {
                    const copy = res.clone();
                    caches.open(CACHE).then((c) => c.put(req, copy));
                }
                return res;
            })
            .catch(() => caches.match(req, { ignoreSearch: true })
                .then((hit) => hit || (req.mode === 'navigate' ? caches.match('./') : Response.error())))
    );
});
