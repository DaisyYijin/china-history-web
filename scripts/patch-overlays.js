/* 生成疆域叠加层最终环并补丁进 js/period-map.js
 * 贴边一侧 = scripts/out-overlays.json 中的真实省界弧段（逐像素贴合底图）
 * 用法：node scripts/gen-overlays.js && node scripts/patch-overlays.js
 */
const fs = require("fs");
const path = require("path");
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "out-overlays.json"), "utf8"));

const fmt = pts => "[" + pts.map(p => `[${p[0]},${p[1]}]`).join(",") + "]";

/* 外蒙古：外侧弧（西→东，止于满洲里）+ 真实中蒙界反向（满洲里→西端）闭合 */
const ARC = {
  tang: [[96.5, 43.0], [93, 44.2], [91, 46], [90.5, 48.5], [92.5, 50.2], [97, 51], [103, 51.4], [109, 51.3], [114, 50.8], [117.4, 49.7]],
  yuan: [[90.5, 43.5], [87, 47], [86.5, 50], [89, 52.3], [94, 53.8], [100, 54.3], [107, 54.4], [113, 54], [118, 53], [120.5, 51.4], [117.6, 49.6]],
  qing: [[90.5, 43.5], [88, 46.5], [87.8, 49.3], [89.5, 51.2], [92.5, 52.3], [96.5, 52.2], [101, 51.9], [106, 51.3], [110.5, 50.4], [114.5, 48.6], [117.6, 49.6]]
};
const southRev = [...data.mongoliaSouth].reverse().slice(0, -1); // 去掉与弧线重复的西端点由弧线提供
const mongoliaRing = arc => [...arc, ...southRev];

/* 外东北：真实黑龙江/乌苏里江沿界（漠河→东南角）+ 外侧弧（东南角→漠河以北）闭合 */
const NE_OUTER = [[131.5, 42.4], [133.6, 42.8], [135.2, 44.3], [136.2, 46.8], [137.6, 49.6], [137.2, 52.6], [134, 54.2], [128, 54.6], [123.5, 54.3]];
const neRing = [...data.amurArc, ...NE_OUTER];

const pmp = path.join(__dirname, "..", "js", "period-map.js");
let src = fs.readFileSync(pmp, "utf8");

let ok = 0, fail = 0;
function patch(re, ring) {
  const before = src;
  src = src.replace(re, (m0, a) => a + fmt(ring));
  if (src !== before) ok++; else { fail++; console.error("未命中:", re.source.slice(0, 60)); }
}
patch(/({ name: "安北都护府（漠北，唐鼎盛期）", pol: "tang",\n        pts: )\[\[[^\]]*\](?:,\[[^\]]*\])*\]/, mongoliaRing(ARC.tang));
patch(/({ name: "岭北行省（漠北至西伯利亚）", pol: "yuan",\n        pts: )\[\[[^\]]*\](?:,\[[^\]]*\])*\]/, mongoliaRing(ARC.yuan));
patch(/({ name: "乌里雅苏台将军辖区（外蒙古）", pol: "qing",\n        pts: )\[\[[^\]]*\](?:,\[[^\]]*\])*\]/, mongoliaRing(ARC.qing));
const neRe = /(name: "(?:沙俄割占：外东北（1858\/1860，约100万km²）|外东北（黑龙江以北·乌苏里江以东）|辽阳行省外延（外兴安岭以南）|奴儿干都司（黑龙江流域，外兴安岭以南）)"[^\n]*\n\s*pts: )\[\[[^\]]*\](?:,\[[^\]]*\])*\]/g;
src = src.replace(neRe, (m0, a) => { ok++; return a + fmt(neRing); });

fs.writeFileSync(pmp, src);
console.log(`补丁完成：成功 ${ok} 处，失败 ${fail} 处（蒙古环 ${fmt(mongoliaRing(ARC.qing)).length / 14 | 0} 点级，外东北 ${neRing.length} 点）`);
