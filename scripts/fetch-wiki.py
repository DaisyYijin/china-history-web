#!/usr/bin/env python3
"""在可访问维基百科的网络环境下运行本脚本，为全站人物抓取维基百科摘要。

用法：
    python scripts/fetch-wiki.py            # 抓取全部人物（自动断点续传）
    python scripts/fetch-wiki.py 50         # 只处理前 50 人（测试用）

输出：
    js/wiki-bios.js   —— 页面自动加载并显示"扩展阅读"区块

说明：
    - 数据来源：zh.wikipedia.org（CC BY-SA 4.0，页面内已附署名与链接）
    - 幂等可续传：中断后重跑即可，已抓取的不会重复请求
    - 请控制频率（内置限速），尊重维基百科服务器
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://zh.wikipedia.org/w/api.php"
UA = {"User-Agent": "china-history-web/1.0 (personal educational project)"}


def http_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))


def collect_names():
    """从数据文件中提取人物 id 与标准名（去掉括号部分）。"""
    people = {}
    for f in sorted((ROOT / "js").glob("*.js")):
        if f.name.startswith(("app", "glossary", "event-plain", "timelines", "wiki-bios", "fetch")):
            continue
        text = f.read_text(encoding="utf-8")
        for m in re.finditer(r'^\s*"([a-zA-Z_][\w]*)":\s*\{\s*$', text, re.M):
            pid = m.group(1)
            block_start = m.end()
            block = text[block_start:block_start + 1200]
            nm = re.search(r'name:\s*"([^"]+)"', block)
            if nm and pid not in people:
                people[pid] = nm.group(1)
    return people


WIKI_TITLE_FIX = {
    # 与维基词条名不一致的人物，在此手工指定
    "唐寅（唐伯虎）": "唐寅",
    "吕雉（吕后）": "吕后",
    "邓世昌": "邓世昌",
    "秦昭襄王": "秦昭襄王",
    "孙武": "孙武",
    "扁鹊": "扁鹊",
    "冼夫人": "冼夫人",
    "八大山人": "朱耷",
    "刘裕_daijin": "刘裕",
    "曹丕": "曹魏高祖文皇帝曹丕",
}


def resolve_title(name):
    name = WIKI_TITLE_FIX.get(name, re.sub(r"（[^）]*）", "", name))
    q = urllib.parse.quote
    # 先直接取摘要
    url = (f"{API}?action=query&format=json&redirects=1"
           f"&prop=extracts&exintro=1&explaintext=1&exlimit=1"
           f"&titles={q(name)}")
    data = http_json(url)
    pages = data.get("query", {}).get("pages", {})
    for pid, page in pages.items():
        if int(pid) > 0 and page.get("extract"):
            title = page.get("title", name)
            # 规范化标题用于链接
            return title, page["extract"].strip()
    return None, None


def search_title(name):
    """直接命中失败时用搜索找词条。"""
    q = urllib.parse.quote
    url = (f"{API}?action=query&format=json&list=search&srlimit=3"
           f"&srsearch={q(name)}")
    data = http_json(url)
    hits = data.get("query", {}).get("search", [])
    for h in hits:
        if "消歧义" not in h["title"] and "(消歧义)" not in h["title"]:
            return h["title"]
    return None


def fetch_one(name):
    title, extract = resolve_title(name)
    if not title:
        found = search_title(name)
        if found:
            title, extract = resolve_title(found)
    if title and extract:
        extract = extract[:900] + ("……" if len(extract) > 900 else "")
        return {"title": title, "extract": extract,
                "url": "https://zh.wikipedia.org/wiki/" + urllib.parse.quote(title)}
    return None


def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    out_path = ROOT / "js" / "wiki-bios.js"
    done = {}
    if out_path.exists():
        m = re.search(r"const WIKI_BIOS = (\{.*\});", out_path.read_text(encoding="utf-8"), re.S)
        if m:
            try:
                done = json.loads(m.group(1))
            except Exception:
                done = {}
    people = collect_names()
    items = list(people.items())
    if limit:
        items = items[:limit]
    todo = [(pid, name) for pid, name in items if pid not in done]
    print(f"人物总数 {len(people)}，已完成 {len(done)}，本次待抓 {len(todo)}")

    ok = fail = 0
    for i, (pid, name) in enumerate(todo, 1):
        try:
            info = fetch_one(name)
            if info:
                done[pid] = info
                ok += 1
                print(f"[{i}/{len(todo)}] ✓ {name} -> {info['title']}")
            else:
                print(f"[{i}/{len(todo)}] ✗ {name}（未找到词条，跳过）")
                done[pid] = {"title": "", "extract": "", "url": ""}
                fail += 1
        except Exception as e:
            print(f"[{i}/{len(todo)}] ! {name} 出错：{e}（稍后重跑即可续传）")
            time.sleep(3)
            continue
        # 每 20 人写盘一次，防中断丢失
        if i % 20 == 0:
            write_out(out_path, done)
        time.sleep(0.4)  # 限速，尊重服务器

    write_out(out_path, done)
    print(f"\n完成：成功 {ok}，未找到 {fail}。输出：{out_path}")


def write_out(path, done):
    body = json.dumps(done, ensure_ascii=False, indent=1)
    path.write_text(
        "/* 维基百科摘要（CC BY-SA 4.0，各条目附原文链接）\n"
        " * 由 scripts/fetch-wiki.py 在可访问维基百科的网络环境下生成 */\n"
        "const WIKI_BIOS = " + body + ";\n",
        encoding="utf-8")


if __name__ == "__main__":
    main()
