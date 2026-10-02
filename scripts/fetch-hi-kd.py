# -*- coding: utf-8 -*-
"""从快懂百科移动版补齐剩余人物 440px 高清画像。

输入: scripts/_hi-rest.json  ([[id, 去括号名], ...])
输出: img/p2/<id>.jpg + scripts/_hi-kd-log.jsonl + scripts/_hi-kd-miss.json
通道: m.baike.com/wiki/<名> -> 首个 "image":"//pN-sdbk2-media.byteimg.com/...~tplv-....image"
      -> https 化 + 强制 resize-w:440 -> 下载
"""
import io, json, os, re, sys, time, urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REST = os.path.join(ROOT, "scripts", "_hi-rest.json")
OUT_DIR = os.path.join(ROOT, "img", "p2")
LOG = os.path.join(ROOT, "scripts", "_hi-kd-log.jsonl")
MISS = os.path.join(ROOT, "scripts", "_hi-kd-miss.json")

UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
      "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
IMG_RE = re.compile(r'"image":"//(p\d+-sdbk2-media\.byteimg\.com/tos-cn-i-[^"]+?)~tplv-[^"]+?\.image"')

def img_ok(d):
    """JPEG / PNG / WebP 均可（浏览器按魔数解码，扩展名统一 .jpg）。"""
    return len(d) >= 4000 and (d[:3] == b"\xff\xd8\xff"
                               or d[:8] == b"\x89PNG\r\n\x1a\n"
                               or (d[:4] == b"RIFF" and d[8:12] == b"WEBP"))

def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA,
                                               "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
                                               "Accept-Language": "zh-CN,zh;q=0.9"})
    return urllib.request.urlopen(req, timeout=timeout).read()

def main():
    items = json.load(io.open(REST, encoding="utf-8"))
    if not os.path.isdir(OUT_DIR):
        os.makedirs(OUT_DIR)
    log = io.open(LOG, "a", encoding="utf-8")
    miss, ok, skip = [], 0, 0
    for i, (pid, name) in enumerate(items):
        dst = os.path.join(OUT_DIR, pid + ".jpg")
        if os.path.exists(dst) and os.path.getsize(dst) > 4000:
            skip += 1
            continue
        rec = {"id": pid, "name": name}
        try:
            html = fetch("https://m.baike.com/wiki/" + urllib.parse.quote(name)).decode("utf-8", "ignore")
            m = IMG_RE.search(html)
            if not m:
                raise RuntimeError("no-image-field")
            url = "https://" + m.group(1) + "~tplv-xv4ileqgde-resize-w:440.image"
            data = fetch(url)
            if not img_ok(data):
                raise RuntimeError("bad-img %dB" % len(data))
            io.open(dst, "wb").write(data)
            ok += 1
            rec.update(status="ok", kb=round(len(data) / 1024.0, 1))
            print("[%d/%d] %s ok %dKB" % (i + 1, len(items), name, len(data) // 1024))
        except Exception as e:
            time.sleep(2)
            try:  # 重试一次
                html = fetch("https://m.baike.com/wiki/" + urllib.parse.quote(name)).decode("utf-8", "ignore")
                m = IMG_RE.search(html)
                if not m:
                    raise RuntimeError("no-image-field")
                url = "https://" + m.group(1) + "~tplv-xv4ileqgde-resize-w:440.image"
                data = fetch(url)
                if not img_ok(data):
                    raise RuntimeError("bad-img")
                io.open(dst, "wb").write(data)
                ok += 1
                rec.update(status="ok-retry", kb=round(len(data) / 1024.0, 1))
                print("[%d/%d] %s ok(retry)" % (i + 1, len(items), name))
            except Exception as e2:
                miss.append([pid, name])
                rec.update(status="miss", err=str(e2)[:120])
                print("[%d/%d] %s MISS %s" % (i + 1, len(items), name, str(e2)[:60]))
        log.write(json.dumps(rec, ensure_ascii=False) + "\n")
        log.flush()
        time.sleep(0.3)
    log.close()
    io.open(MISS, "w", encoding="utf-8").write(json.dumps(miss, ensure_ascii=False, indent=0))
    print("DONE ok=%d skip=%d miss=%d" % (ok, skip, len(miss)))

if __name__ == "__main__":
    main()
