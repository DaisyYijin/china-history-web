# -*- coding: utf-8 -*-
"""生成抽查网格页：从 img/p2 随机抽 N 张，供浏览器截图做视觉 QC。"""
import io, json, os, random, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P2 = os.path.join(ROOT, "img", "p2")

def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 36
    seed = int(sys.argv[2]) if len(sys.argv) > 2 else 42
    names = {}
    for f in ("_hi-rest.json", "_hi-list.json"):
        p = os.path.join(ROOT, "scripts", f)
        if os.path.exists(p):
            for pid, nm in json.load(io.open(p, encoding="utf-8")):
                names[pid] = nm
    files = sorted(f for f in os.listdir(P2) if f.endswith(".jpg"))
    random.seed(seed)
    pick = random.sample(files, min(n, len(files)))
    cells = "".join(
        '<figure><img src="../img/p2/%s"><figcaption>%s<br>%s</figcaption></figure>' %
        (f, names.get(f[:-4], "?"), f[:-4])
        for f in pick)
    html = ("<meta charset=utf-8><style>body{background:#222;color:#eee;font:12px/1.4 sans-serif}"
            "main{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;padding:8px}"
            "figure{margin:0}img{width:100%%;height:120px;object-fit:cover;background:#333}"
            "figcaption{text-align:center;padding:2px 0}</style><main>%s</main>" % cells)
    io.open(os.path.join(ROOT, "scripts", "qc-grid.html"), "w", encoding="utf-8").write(html)
    print("qc-grid.html:", len(pick), "images")

if __name__ == "__main__":
    main()
