/* Service Worker：史鉴 · 离线缓存
 * 策略：核心壳预缓存 + 运行时缓存优先（同源 GET）；
 * version.json 永远走网络（保证检查更新可靠）。
 */
const BUILD = "1790770656";
const CACHE = "shijian-" + BUILD;
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith("version.json") || url.pathname.endsWith("sw.js")) return; // 更新通道不受缓存

  // 导航请求（HTML）网络优先：确保发版后用户拿到最新页面，离线时才回退缓存
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => { c.put("./index.html", clone); c.put("./", clone); });
        }
        return res;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  e.respondWith(
    caches.match(req) // 不忽略 ?v=：版本号变更即绕过旧缓存.then(hit => {
      if (hit) {
        // 后台静默更新
        fetch(req).then(res => {
          if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
        }).catch(() => {});
        return hit;
      }
      return fetch(req).then(res => {
        if (res && res.ok && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
