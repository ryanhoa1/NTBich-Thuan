/* Service worker TienTro v5.27: chỉ lưu đệm các tệp của chính app (cùng nguồn).
   Không bao giờ chạm vào yêu cầu tới Google (đăng nhập, Drive) nên không lưu token hay dữ liệu cá nhân. */
const CACHE = 'tientro-v5.27';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // Google, phông chữ...: để trình duyệt tự xử lý
  const vendor = url.pathname.includes('/vendor/');
  if (vendor) {                                             // thư viện cố định: ưu tiên bản đệm
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    })));
    return;
  }
  e.respondWith(                                            // app: ưu tiên mạng để luôn có bản mới, mất mạng thì dùng bản đệm
    fetch(req).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('index.html')))
  );
});
