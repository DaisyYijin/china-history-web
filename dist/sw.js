/* Service Worker：史鉴 · 离线缓存
 * 策略：核心壳预缓存 + 运行时缓存优先（同源 GET）；
 * version.json 永远走网络（保证检查更新可靠）。
 */
const BUILD = "1790778577";
const CACHE = "shijian-" + BUILD;
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];
/* 数据脚本清单由 deploy 时注入（见 scripts/package.py 同步），先内置核心批次 */
const DATA = ["./js/app.js", "./js/battle-map.js", "./js/era-batch3.js", "./js/era-batch4.js", "./js/era-batch5.js", "./js/era-batch6.js", "./js/era-batch7.js", "./js/era-batch8.js", "./js/era-contemporary.js", "./js/era-culture.js", "./js/era-family.js", "./js/era-lit-art.js", "./js/era-mingqing.js", "./js/era-modern-extra.js", "./js/era-patches.js", "./js/era-qinhan.js", "./js/era-sci.js", "./js/era-songyuan.js", "./js/era-suitang.js", "./js/era-writers.js", "./js/era-writers2.js", "./js/era-xianqin.js", "./js/event-plain-2.js", "./js/event-plain-2b.js", "./js/event-plain.js", "./js/events.js", "./js/glossary.js", "./js/people-extra-2.js", "./js/people-extra-3.js", "./js/people-extra-4.js", "./js/people-extra-5.js", "./js/people-extra-6.js", "./js/people-extra-7.js", "./js/people-extra.js", "./js/people-timeline.js", "./js/people-vita-2.js", "./js/people-vita-3.js", "./js/people-vita-4.js", "./js/people-vita-5.js", "./js/people-vita-6.js", "./js/people-vita-7.js", "./js/people-vita.js", "./js/people.js", "./js/period-map.js", "./js/py-common.js", "./js/relations.js", "./js/timelines-10.js", "./js/timelines-11.js", "./js/timelines-12.js", "./js/timelines-13.js", "./js/timelines-13b.js", "./js/timelines-14.js", "./js/timelines-14b.js", "./js/timelines-14c.js", "./js/timelines-14d.js", "./js/timelines-14e.js", "./js/timelines-15.js", "./js/timelines-15b.js", "./js/timelines-15c.js", "./js/timelines-16.js", "./js/timelines-16b.js", "./js/timelines-16c.js", "./js/timelines-16d.js", "./js/timelines-17.js", "./js/timelines-17b.js", "./js/timelines-17c.js", "./js/timelines-17d.js", "./js/timelines-2.js", "./js/timelines-3.js", "./js/timelines-4.js", "./js/timelines-5.js", "./js/timelines-6.js", "./js/timelines-7.js", "./js/timelines-8.js", "./js/timelines-9.js", "./js/wiki-bios.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.concat(DATA))).then(() => self.skipWaiting()));
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
    caches.match(req).then(hit => { // 不忽略 ?v=：版本号变更即绕过旧缓存
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
