/* 生成 js/py-common.js —— 全站文本字频白名单。
 *
 * 规则：统计所有数据文件（人物/事件/年谱/深读/时间线/术语/通俗版）的汉字字频，
 *       出现 ≥ THRESHOLD（默认 12）次的字进白名单（不注音）；其余生僻字在页面上
 *       由 app.js 的 _segHtml 以「字(pīn)」形式注音。
 * 用法：node scripts/gen-py-common.js [threshold]
 * 注意：白名单外的字必须能被 lib/pinyin.min.js 正确注音；本脚本不做该校验，
 *       改版后请在浏览器里抽查 .pyz 注音是否正常（历史校验记录：1961/1961 通过）。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const THRESHOLD = parseInt(process.argv[2] || "12", 10);
const SKIP_RE = /js\/(app|py-common)\.js$|bundle-/;

const files = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/.bundle-files.json"), "utf8"))
  .filter(f => f.startsWith("js/") && !SKIP_RE.test(f));
let src = "";
for (const f of files) src += fs.readFileSync(path.join(ROOT, f), "utf8") + "\n";

/* eval 拿到数据全局后 JSON.stringify 展开为纯文本 */
eval(src + ";globalThis.__D=[PEOPLE,EVENTS,RELATIONS,PEOPLE_VITA,PEOPLE_EXTRA,PEOPLE_TIMELINE,PORTRAITS,GLOSSARY,EVENT_PLAIN];");
const text = JSON.stringify(globalThis.__D);

const freq = {};
for (const ch of text) if (/[\u4e00-\u9fff]/.test(ch)) freq[ch] = (freq[ch] || 0) + 1;
const keep = Object.keys(freq).filter(c => freq[c] >= THRESHOLD).sort();

const out = "/* 全站文本字频白名单：出现 ≥" + THRESHOLD + " 次的 " + keep.length + " 字（scripts/gen-py-common.js 可复现）\n" +
  "   不在此表中的汉字在页面上以 字(pīn) 括号注音 */\n" +
  'const PY_COMMON = new Set("' + keep.join("") + '");\n';
fs.writeFileSync(path.join(ROOT, "js/py-common.js"), out);
console.log("py-common.js:", keep.length, "chars, threshold", THRESHOLD,
  "| annotated chars:", Object.keys(freq).length - keep.length);
