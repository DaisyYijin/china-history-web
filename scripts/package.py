# -*- coding: utf-8 -*-
"""
打包静态站点：同步 dist/ 目录 + 生成 dist.zip

自 v2.34.0 起站点为单文件形态（js/bundle.js + css/bundle.css，
由 scripts/build-bundle.py 生成），dist/ 仅含 7 个文件，
弱网一次请求即可载完全部数据。

用法：python scripts/package.py
"""
import io
import json
import os
import re
import shutil
import subprocess
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
OUT = os.path.join(ROOT, "dist.zip")

FILES = [
    "index.html",
    "version.json",
    "sw.js",
    "manifest.webmanifest",
    "icon.svg",
    "js/bundle.js",
    "css/bundle.css",
]

def extra_files():
    """img/p/ 下的画像（存在才打包）"""
    import glob
    return [f.replace("\\", "/") for f in glob.glob("img/p/*") if "/" in f]


def main():
    # 1. 先重建 bundle（保证与源文件同步）
    subprocess.run(
        ["python", os.path.join(ROOT, "scripts", "build-bundle.py")],
        check=True, cwd=ROOT)

    FILES.extend(extra_files())
    missing = [f for f in FILES if not os.path.exists(os.path.join(ROOT, f))]
    if missing:
        raise SystemExit("缺少文件: %s" % missing)

    # 2. 注入 SW 预缓存清单（先改 sw.js 再复制，保证 dist 内外一致）
    swp = os.path.join(ROOT, "sw.js")
    sw = io.open(swp, encoding="utf-8").read()
    data = ["./js/bundle.js", "./css/bundle.css"]
    sw = re.sub(r"const DATA = \[[^\]]*\];",
                "const DATA = " + json.dumps(data) + ";", sw)
    io.open(swp, "w", encoding="utf-8", newline="\n").write(sw)

    # 3. 清空并重建 dist/
    if os.path.isdir(DIST):
        shutil.rmtree(DIST)
    os.makedirs(os.path.join(DIST, "js"))
    os.makedirs(os.path.join(DIST, "css"))
    for f in FILES:
        dst = os.path.join(DIST, f)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(os.path.join(ROOT, f), dst)

    # 4. dist.zip
    if os.path.exists(OUT):
        os.remove(OUT)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for f in FILES:
            z.write(os.path.join(ROOT, f), f)

    size = sum(os.path.getsize(os.path.join(DIST, f)) for f in FILES) / 1024
    print("dist/ 已同步 %d 个文件（%.0f KB）；dist.zip %.0f KB"
          % (len(FILES), size, os.path.getsize(OUT) / 1024))


if __name__ == "__main__":
    main()
