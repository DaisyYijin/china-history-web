# -*- coding: utf-8 -*-
"""
打包静态站点为 dist.zip —— 用于国内静态托管的「上传 ZIP」部署
（腾讯 EdgeOne Pages / 阿里云 OSS / 腾讯云 COS 均支持 ZIP 或解压上传）

用法：python scripts/package.py
输出：项目根目录 dist.zip
"""
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "dist.zip")

INCLUDE_DIRS = ["css", "js", "lib"]
INCLUDE_FILES = ["index.html", "version.json", "sw.js", "manifest.webmanifest", "icon.svg"]
EXCLUDE_JS_PREFIXES = ("_",)  # 临时校验文件

def main():
    if os.path.exists(OUT):
        os.remove(OUT)
    n = 0
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for f in INCLUDE_FILES:
            p = os.path.join(ROOT, f)
            if os.path.exists(p):
                z.write(p, f); n += 1
        for d in INCLUDE_DIRS:
            dp = os.path.join(ROOT, d)
            for base, _, files in os.walk(dp):
                for fn in files:
                    if d == "js" and fn.startswith(EXCLUDE_JS_PREFIXES):
                        continue
                    full = os.path.join(base, fn)
                    rel = os.path.relpath(full, ROOT).replace("\\", "/")
                    z.write(full, rel); n += 1
    size = os.path.getsize(OUT) / 1024
    print(f"已打包 {n} 个文件 -> dist.zip（{size:.0f} KB）")

if __name__ == "__main__":
    main()
