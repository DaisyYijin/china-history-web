/* 从 lib/china.js 解码 GeoJSON，沿省界原始环绕方向截取边界弧段（保序，不自交）
 * 产出 scripts/out-overlays.json:
 *   mongoliaSouth: 中蒙界（额济纳西端→满洲里，西→东）
 *   amurArc:       黑龙江/乌苏里江沿界（漠河→省界东南角，西→东）
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "..", "lib", "china.js"), "utf8");
/* 直接锚定 GeoJSON 起始串（UMD 包装里可能有多个 registerMap 相关片段） */
const objStart = src.indexOf('{"type":"FeatureCollection"');
if (objStart < 0) { console.error("未找到 FeatureCollection"); process.exit(1); }
/* 括号配平截取完整 JSON 对象 */
let depth = 0, objEnd = -1, inStr = false, esc = false;
for (let i = objStart; i < src.length; i++) {
  const ch = src[i];
  if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
  if (ch === '"') inStr = true;
  else if (ch === "{") depth++;
  else if (ch === "}") { depth--; if (!depth) { objEnd = i + 1; break; } }
}
if (objEnd < 0) { console.error("括号配平失败"); process.exit(1); }
let geo;
try { geo = JSON.parse(src.slice(objStart, objEnd)); }
catch (e) { geo = JSON.parse(src.slice(objStart, objEnd).replace(/,\s*([\]}])/g, "$1")); }

const SCALE = 1024; // 该地图数据的 UTF8Scale（已用台湾省范围标定验证）
function decodePolygon(str, offsets) {
  const pts = [];
  let x = offsets[0], y = offsets[1];
  for (let i = 0; i < str.length; i += 2) {
    let dx = str.charCodeAt(i) - 64, dy = str.charCodeAt(i + 1) - 64;
    dx = (dx >> 1) ^ -(dx & 1);
    dy = (dy >> 1) ^ -(dy & 1);
    x += dx; y += dy;
    pts.push([x / SCALE, y / SCALE]);
  }
  return pts;
}
function ringsOf(f) {
  const g = f.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  const enc = g.encodeOffsets || polys.encodeOffsets;
  const out = [];
  polys.forEach((poly, pi) => poly.forEach((line, li) => out.push(decodePolygon(line, enc[pi][li], SCALE))));
  return out;
}
const byName = {};
for (const f of geo.features) byName[(f.properties || {}).name || ""] = f;

function nearestIdx(ring, P) {
  let bi = 0, bd = 1e9;
  ring.forEach((q, i) => { const d = (q[0] - P[0]) ** 2 + (q[1] - P[1]) ** 2; if (d < bd) { bd = d; bi = i; } });
  return bi;
}
/* 沿环绕行，取锚点 A→B 的两条弧之一（pick 返回 true 选正向弧） */
function arcBetween(ring, A, B, pick) {
  const n = ring.length, ia = nearestIdx(ring, A), ib = nearestIdx(ring, B);
  const fwd = [], bwd = [];
  for (let i = ia; ; i = (i + 1) % n) { fwd.push(ring[i]); if (i === ib) break; }
  for (let i = ia; ; i = (i - 1 + n) % n) { bwd.push(ring[i]); if (i === ib) break; }
  const chosen = pick(fwd, bwd) ? fwd : bwd;
  return chosen.map(p => [+p[0].toFixed(2), +p[1].toFixed(2)]);
}
function thin(pts, min = 0.18) {
  const o = [];
  for (const p of pts) { const l = o[o.length - 1]; if (!l || Math.hypot(p[0] - l[0], p[1] - l[1]) >= min) o.push(p); }
  return o;
}

const nm = ringsOf(byName["内蒙古"]).reduce((a, b) => b.length > a.length ? b : a);
const hlj = ringsOf(byName["黑龙江"]).reduce((a, b) => b.length > a.length ? b : a);

// 中蒙界：额济纳西端(97.2,42.7) → 满洲里(117.8,49.6)，取平均纬度更高（北缘）的弧（不抽稀）
const mongoliaSouth = arcBetween(nm, [97.2, 42.7], [117.8, 49.6],
  (f, b) => f.reduce((s, p) => s + p[1], 0) / f.length > b.reduce((s, p) => s + p[1], 0) / b.length);
// 黑龙江江防+乌苏里江沿界：漠河(122.4,53.4) → 省界东南角(131.2,44.0)，取平均经度更大（东缘）的弧（不抽稀）
const amurArc = arcBetween(hlj, [122.4, 53.4], [131.2, 44.0],
  (f, b) => f.reduce((s, p) => s + p[0], 0) / f.length > b.reduce((s, p) => s + p[0], 0) / b.length);

fs.writeFileSync(path.join(__dirname, "out-overlays.json"),
  JSON.stringify({ mongoliaSouth, amurArc }, null, 1));
console.error(`中蒙界 ${mongoliaSouth.length} 点（${mongoliaSouth[0]} → ${mongoliaSouth[mongoliaSouth.length - 1]}），江防 ${amurArc.length} 点（${amurArc[0]} → ${amurArc[amurArc.length - 1]}）`);
