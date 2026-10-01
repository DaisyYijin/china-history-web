/* 生成疆域叠加层最终环（全点不抽稀）+ 外弧描线，补丁进 js/period-map.js
 * 用法：node scripts/gen-overlays.js && node scripts/patch-overlays.js
 * 贴边型条目带 arc 字段：渲染时贴边侧不描边（借用底图省界线），仅外弧描线
 */
const fs = require("fs");
const path = require("path");
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "out-overlays.json"), "utf8"));

const fmt = pts => "[" + pts.map(p => `[${p[0]},${p[1]}]`).join(",") + "]";

const southRev = [...data.mongoliaSouth].reverse(); // 满洲里→西端（贴边侧，全部原始点）
const ARC = {
  tang: [[96.5, 43.0], [93, 44.2], [91, 46], [90.5, 48.5], [92.5, 50.2], [97, 51], [103, 51.4], [109, 51.3], [114, 50.8], [117.4, 49.7]],
  yuan: [[90.5, 43.5], [87, 47], [86.5, 50], [89, 52.3], [94, 53.8], [100, 54.3], [107, 54.4], [113, 54], [118, 53], [120.5, 51.4]],
  qing: [[90.5, 43.5], [88, 46.5], [87.8, 49.3], [89.5, 51.2], [92.5, 52.3], [96.5, 52.2], [101, 51.9], [106, 51.3], [110.5, 50.4], [114.5, 48.6]]
};
const mongolia = arcKey => {
  const arc = ARC[arcKey];
  return {
    pts: [...arc, ...southRev],                                        // 闭合环
    arc: [southRev[southRev.length - 1], ...arc, southRev[0]]          // 描线：西端帽 + 外弧 + 东端衔接
  };
};

const NE_OUTER = [[131.5, 42.4], [133.6, 42.8], [135.2, 44.3], [136.2, 46.8], [137.6, 49.6], [137.2, 52.6], [134, 54.2], [128, 54.6], [123.5, 54.3]];
const amur = data.amurArc;
const ne = {
  pts: [...amur, ...NE_OUTER],
  arc: [amur[amur.length - 1], ...NE_OUTER, amur[0]]
};

const pmp = path.join(__dirname, "..", "js", "period-map.js");
let src = fs.readFileSync(pmp, "utf8");

let ok = 0;
function patch(re, ring, withArc) {
  const body = `pts: ${fmt(ring.pts)}${withArc ? `,\n        arc: ${fmt(ring.arc)}` : ""}`;
  const before = src;
  src = src.replace(re, (m0, a) => a + body);
  if (src !== before) ok++; else console.error("未命中:", re.source.slice(0, 70));
}
patch(/({ name: "安北都护府（漠北，唐鼎盛期）", pol: "tang",\n        )pts: \[\[[^\]]*\](?:,\[[^\]]*\])*\]/, mongolia("tang"), true);
patch(/({ name: "岭北行省（漠北至西伯利亚）", pol: "yuan",\n        )pts: \[\[[^\]]*\](?:,\[[^\]]*\])*\]/, mongolia("yuan"), true);
patch(/({ name: "乌里雅苏台将军辖区（外蒙古）", pol: "qing",\n        )pts: \[\[[^\]]*\](?:,\[[^\]]*\])*\]/, mongolia("qing"), true);
// 外东北四环：三个政权型带外弧，晚清失地保持整环虚线
const nePolity = /(name: "(?:外东北（黑龙江以北·乌苏里江以东）|辽阳行省外延（外兴安岭以南）|奴儿干都司（黑龙江流域，外兴安岭以南）)"[^\n]*\n\s*)pts: \[\[[^\]]*\](?:,\[[^\]]*\])*\]/g;
src = src.replace(nePolity, (m0, a) => { ok++; return a + `pts: ${fmt(ne.pts)},\n        arc: ${fmt(ne.arc)}`; });
const neLost = /(name: "沙俄割占：外东北（1858\/1860，约100万km²）"[^\n]*\n\s*)pts: \[\[[^\]]*\](?:,\[[^\]]*\])*\]/;
src = src.replace(neLost, (m0, a) => { ok++; return a + `pts: ${fmt(ne.pts)}`; });

fs.writeFileSync(pmp, src);
console.log(`补丁完成 ${ok}/7：中蒙界 ${southRev.length} 点全量、江防 ${amur.length} 点全量`);
