#!/usr/bin/env python3
"""一键发布脚本：同步三处版本号并可选提交。

用法:
    python scripts/release.py 2.0.0            # 只更新版本号
    python scripts/release.py 2.0.0 --commit   # 更新并 git 提交推送

同步的三处:
    version.json            -> version / build
    js/app.js               -> CURRENT_VERSION
    index.html              -> 所有静态资源 ?v=
"""
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    version = sys.argv[1].lstrip("v")
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        print(f"版本号格式应为 X.Y.Z，收到: {version}")
        sys.exit(1)
    build = int(time.time())
    do_commit = "--commit" in sys.argv

    # 1. version.json
    vpath = ROOT / "version.json"
    vpath.write_text(json.dumps(
        {"version": version, "build": build,
         "repo": "https://github.com/DaisyYijin/china-history-web"},
        ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # 2. app.js CURRENT_VERSION
    apath = ROOT / "js" / "app.js"
    js = apath.read_text(encoding="utf-8")
    js, n1 = re.subn(
        r'const CURRENT_VERSION = \{ version: "[\d.]+", build: \d+ \};',
        f'const CURRENT_VERSION = {{ version: "{version}", build: {build} }};',
        js)
    if n1 != 1:
        print("错误: app.js 中未找到 CURRENT_VERSION"); sys.exit(1)
    apath.write_text(js, encoding="utf-8")

    # 3. index.html ?v=
    ipath = ROOT / "index.html"
    html = ipath.read_text(encoding="utf-8")
    html, n2 = re.subn(r'\?v=[\d.]+', f'?v={version}', html)
    if n2 == 0:
        print("警告: index.html 中未找到 ?v= 参数")
    ipath.write_text(html, encoding="utf-8")

    print(f"版本已同步至 {version} (build {build})：version.json / app.js / index.html×{n2}")

    if do_commit:
        subprocess.run(["git", "add", "-A"], cwd=ROOT, check=True)
        subprocess.run(["git", "commit", "-q", "-m", f"release v{version}"], cwd=ROOT, check=True)
        subprocess.run(["git", "push", "-q"], cwd=ROOT, check=True)
        print(f"已提交并推送 release v{version}")


if __name__ == "__main__":
    main()
