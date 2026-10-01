# -*- coding: utf-8 -*-
"""合并全部 JS / CSS 为单文件，并把 index.html 改为引用合并产物。

背景：站点部署在海外节点，80+ 个小文件在慢网下容易出现个别请求
超时导致数据缺失；合并为 1 个 JS + 1 个 CSS 后一次请求即可载完。

用法：python scripts/build-bundle.py
产物：js/bundle.js、css/bundle.css（index.html 首次运行后被改写，幂等）
顺序：以 index.html 中 defer 脚本顺序为准；lib/pinyin.min.js 自动插在
lib/china.js 之后（原本由 app.js 动态注入，进 bundle 后注入逻辑自动短路）。
"""
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, "index.html")
MANIFEST = os.path.join(ROOT, "scripts", ".bundle-files.json")

PINYIN_LIB = "lib/pinyin.min.js"
CSS_ORDER = ["css/style.css", "css/intro.css", "css/ui-polish.css"]

SCRIPT_RE = re.compile(r'[ \t]*<script defer src="((?:lib|js)/[^"?]+)(?:\?[^"]*)?"></script>\s*')
LINK_CSS_RE = re.compile(r'[ \t]*<link rel="stylesheet" href="css/[^"]*">\s*')


def read(p):
    return io.open(os.path.join(ROOT, p), encoding="utf-8-sig").read()


def strip_sourcemap(src):
    # 合并后 sourceMappingURL 指向不存在的 map 文件，去掉避免控制台噪音
    return re.sub(r'^//# sourceMappingURL=.*$\n?', "", src, flags=re.M)


def build_js(files, ver):
    parts = []
    for f in files:
        body = strip_sourcemap(read(f)).rstrip()
        parts.append("\n;\n/* ===================== %s ===================== */\n%s\n" % (f, body))
    out = "".join(parts)
    io.open(os.path.join(ROOT, "js", "bundle.js"), "w", encoding="utf-8", newline="\n").write(out)
    return len(out)


def build_css(ver):
    parts = []
    for f in CSS_ORDER:
        parts.append("/* ===================== %s ===================== */\n%s\n" % (f, read(f).rstrip()))
    out = "".join(parts)
    io.open(os.path.join(ROOT, "css", "bundle.css"), "w", encoding="utf-8", newline="\n").write(out)
    return len(out)


def main():
    html = io.open(HTML, encoding="utf-8").read()

    if 'src="js/bundle.js' in html:
        # 已合并过：从清单恢复文件顺序，只重建产物
        files = json.load(io.open(MANIFEST, encoding="utf-8"))
        ver = re.search(r'js/bundle\.js\?v=([\d.]+)', html).group(1)
    else:
        files = [m.group(1) for m in SCRIPT_RE.finditer(html)]
        if PINYIN_LIB not in files:
            files.insert(files.index("lib/china.js") + 1, PINYIN_LIB)
        m = re.search(r'\?v=([\d.]+)', html)
        ver = m.group(1) if m else "1"
        io.open(MANIFEST, "w", encoding="utf-8").write(json.dumps(files, ensure_ascii=False, indent=1))

        # 改写 index.html：N 个脚本 → 1 个；3 个 CSS → 1 个
        html = SCRIPT_RE.sub("", html)
        html = LINK_CSS_RE.sub("", html)
        html = html.replace(
            "</title>",
            '</title>\n<link rel="stylesheet" href="css/bundle.css?v=%s">' % ver, 1)
        html = html.replace(
            "</body>",
            '<script defer src="js/bundle.js?v=%s"></script>\n</body>' % ver)
        html = re.sub(r'\n{3,}', '\n\n', html)
        io.open(HTML, "w", encoding="utf-8", newline="\n").write(html)

    js_n = build_js(files, ver)
    css_n = build_css(ver)
    print("bundle.js  %6.0f KB（%d 个文件）" % (js_n / 1024, len(files)))
    print("bundle.css %6.0f KB（%d 个文件）" % (css_n / 1024, len(CSS_ORDER)))


if __name__ == "__main__":
    main()
