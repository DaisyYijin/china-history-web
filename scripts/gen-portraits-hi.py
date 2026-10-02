# -*- coding: utf-8 -*-
"""扫描 img/p2/*.jpg 重建 js/portraits-hi.js（灯箱高清索引）。

登记条件：图像尺寸有效（JPEG/PNG/WebP/GIF），且像素面积 > img/p 同名 220px 基线的 1.4 倍
（基线缺失时按 220x280 估算），否则不登记——灯箱自动回退 220px 版更清晰。
"""
import io, os, re, struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "img", "p2")
BASE = os.path.join(ROOT, "img", "p")
DST = os.path.join(ROOT, "js", "portraits-hi.js")

def img_size(p):
    try:
        d = open(p, "rb").read(64 * 1024)
    except OSError:
        return None
    if d[:3] == b"\xff\xd8\xff":                      # JPEG
        i = 2
        while i < len(d) - 9:
            if d[i] != 0xFF:
                i += 1
                continue
            m = d[i + 1]
            if m in (0xC0, 0xC1, 0xC2, 0xC3):
                h, w = struct.unpack(">HH", d[i + 5:i + 9])
                return w, h
            if 0xD0 <= m <= 0xD9:
                i += 2
                continue
            i += 2 + struct.unpack(">H", d[i + 2:i + 4])[0]
        return None
    if d[:8] == b"\x89PNG\r\n\x1a\n":                 # PNG
        return struct.unpack(">II", d[16:24])
    if d[:4] == b"RIFF" and d[8:12] == b"WEBP":       # WebP（VP8X 粗解）
        b = struct.unpack("<I", d[26:30])[0]
        return b & 0xFFFFFF, b >> 8 & 0xFFFFFF
    if d[:4] in (b"GIF8",):                           # GIF
        return struct.unpack("<HH", d[6:10])
    return None

def main():
    keep, drop = [], []
    for f in sorted(os.listdir(SRC)):
        if not f.endswith(".jpg"):
            continue
        pid = f[:-4]
        if not re.match(r"^[a-z0-9_]+$", pid):
            continue
        s = img_size(os.path.join(SRC, f))
        if not s:
            drop.append((pid, "unreadable"))
            continue
        b = img_size(os.path.join(BASE, f)) or (220, 280)
        if s[0] * s[1] < b[0] * b[1] * 1.4:
            drop.append((pid, "%dx%d vs %dx%d" % (s + b)))
            continue
        keep.append(pid)
    lines = ["/* 高清画像索引（440px，灯箱用；仅登记已抓取的，未登记者自动回退 220px 版） */",
             "const PORTRAITS_HI = {"]
    lines += [' "%s": "img/p2/%s.jpg",' % (i, i) for i in keep]
    lines.append("};")
    io.open(DST, "w", encoding="utf-8", newline="\n").write("\n".join(lines) + "\n")
    print("portraits-hi.js: %d entries, dropped %d" % (len(keep), len(drop)))
    for pid, why in drop:
        print("  drop %s (%s)" % (pid, why))

if __name__ == "__main__":
    main()
