/* =========================================================
 * 中国近代史 · 页面逻辑
 * ========================================================= */

/* ---------- 常量 ---------- */
const CATS = {
  war:      { name: "战争 · 战役", color: "#e05c4b" },
  civil:    { name: "革命 · 起义", color: "#e0994a" },
  reform:   { name: "变革 · 运动", color: "#4fae9b" },
  politics: { name: "政治 · 会议", color: "#5f8ec9" },
  culture:  { name: "文明 · 科技", color: "#a879d8" }
};

const PERIODS = {
  1:  { name: "传说时代",         sub: "远古 — 约前2070 · 炎黄肇始" },
  2:  { name: "夏商西周",         sub: "约前2070 — 前771 · 青铜文明" },
  3:  { name: "春秋战国",         sub: "前770 — 前221 · 百家争鸣" },
  4:  { name: "秦汉",             sub: "前221 — 220 · 大一统奠基" },
  5:  { name: "三国两晋南北朝",   sub: "220 — 589 · 分裂与融合" },
  6:  { name: "隋唐五代",         sub: "581 — 960 · 盛世气象" },
  7:  { name: "宋辽金夏",         sub: "960 — 1279 · 文华鼎盛" },
  8:  { name: "元朝",             sub: "1271 — 1368 · 草原帝国" },
  9:  { name: "明朝",             sub: "1368 — 1644 · 治隆唐宋" },
  10: { name: "清朝前中期",       sub: "1644 — 1840 · 最后的帝国" },
  11: { name: "晚清",             sub: "1840 — 1911 · 内忧外患" },
  12: { name: "民国初年",         sub: "1912 — 1926 · 共和乱局" },
  13: { name: "国共对峙",         sub: "1927 — 1936 · 星火燎原（含局部抗战）" },
  14: { name: "全面抗战",         sub: "1937 — 1945 · 民族浴血" },
  15: { name: "解放战争",         sub: "1946 — 1949 · 天翻地覆" },
  16: { name: "当代中国",         sub: "1949 — 今 · 复兴之路" }
};

/* ---------- 索引 ---------- */
const EVENT_MAP = {};
EVENTS.forEach((e, i) => { EVENT_MAP[e.id] = e; e._order = i; });

const PEOPLE_LIST = Object.keys(PEOPLE).map(id => Object.assign({ id }, PEOPLE[id]));
const PERSON_MAP = {};
PEOPLE_LIST.forEach(p => { PERSON_MAP[p.id] = p; });

const DEGREE = {};
RELATIONS.forEach(r => {
  DEGREE[r.a] = (DEGREE[r.a] || 0) + 1;
  DEGREE[r.b] = (DEGREE[r.b] || 0) + 1;
});

function periodOf(ev) {
  if (ev.p) return ev.p;
  if (ev.year <= 1911) return 11;
  if (ev.year <= 1926) return 12;
  if (ev.year <= 1936) return 13;
  if (ev.year <= 1945) return 14;
  if (ev.year <= 1949) return 15;
  return 16;
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

/* ---------- 顶部统计 ---------- */
(function renderStats() {
  const battles = EVENTS.filter(e => e.forces).length;
  const items = [
    [EVENTS.length, "重大事件"],
    [PEOPLE_LIST.length, "关键人物"],
    [RELATIONS.length, "人物关系"],
    ["5000", "年文明史"]
  ];
  document.getElementById("stats").innerHTML = items.map(([n, label]) =>
    `<div class="stat"><b>${n}</b><span>${label}</span></div>`).join("");
})();

/* ---------- 大事年表 ---------- */
let catFilter = "all";

function renderCatFilters() {
  const box = document.getElementById("cat-filters");
  const defs = [["all", null]].concat(Object.keys(CATS).map(k => [k, CATS[k]]));
  box.innerHTML = defs.map(([key, c]) =>
    `<button class="filter-btn ${key === catFilter ? "active" : ""}" data-cat="${key}">
      ${c ? `<span class="dot" style="background:${c.color}"></span>${c.name}` : "全部事件"}
     </button>`).join("");
  box.querySelectorAll(".filter-btn").forEach(btn => {
    btn.onclick = () => { catFilter = btn.dataset.cat; renderCatFilters(); renderTimeline(); };
  });
}

function renderTimeline() {
  const wrap = document.getElementById("timeline");
  const term = getTerm();
  const byPeriod = {};
  EVENTS.forEach(ev => {
    const p = periodOf(ev);
    (byPeriod[p] = byPeriod[p] || []).push(ev);
  });

  let html = "";
  Object.keys(PERIODS).forEach(pk => {
    const list = (byPeriod[pk] || []).sort((x, y) => x.year - y.year || x._order - y._order);
    if (!list.length) return;
    html += `<div class="era" data-era="${pk}">
      <div class="era-head"><div class="era-line"></div><span>${PERIODS[pk].name}<em>${PERIODS[pk].sub}</em></span></div>
      <div class="timeline">`;
    list.forEach(ev => {
      const cat = CATS[ev.category];
      const matched = !term || evMatch(ev, term);
      const forceLine = ev.forces ? `<div class="force-line">${ev.forces.map(f =>
        `<b>${esc(f.side)}</b>：${esc(f.troops)}`).join(" ｜ ")}</div>` : "";
      html += `<div class="t-item ${matched ? "" : "hidden-by-filter"}" data-ev="${ev.id}">
        <span class="dot" style="background:${cat.color}"></span>
        <div class="t-card" data-open-event="${ev.id}">
          <div class="t-top">
            <span class="t-year">${ev.year}</span>
            <span class="t-title">${esc(ev.title)}</span>
            <span class="t-tag" style="color:${cat.color}">${cat.name}</span>
          </div>
          <div class="t-date">${esc(ev.date)}</div>
          <div class="t-snippet">${esc(ev.desc.slice(0, 64))}…</div>
          ${forceLine}
          <div class="t-people">关键人物：<i>${ev.people.map(id => esc(PERSON_MAP[id] ? PERSON_MAP[id].name : id)).join("、") || "—"}</i></div>
        </div>
      </div>`;
    });
    html += `</div></div>`;
  });
  wrap.innerHTML = html;
}

function evMatch(ev, term) {
  const hay = [ev.title, ev.date, ev.desc, ev.result || "", ev.people.map(id => PERSON_MAP[id] && PERSON_MAP[id].name).join("、")].join("\n");
  return hay.indexOf(term) !== -1;
}

/* ---------- 人物志 ---------- */
let factionFilter = "all";

function renderFactionFilters() {
  const box = document.getElementById("faction-filters");
  const defs = [["all", { name: "全部人物", color: "#d3a94f" }]]
    .concat(Object.keys(FACTIONS).map(k => [k, FACTIONS[k]]));
  box.innerHTML = defs.map(([key, f]) =>
    `<button class="filter-btn ${key === factionFilter ? "active" : ""}" data-f="${key}">
      <span class="dot" style="background:${f.color}"></span>${f.name}
     </button>`).join("");
  box.querySelectorAll(".filter-btn").forEach(btn => {
    btn.onclick = () => { factionFilter = btn.dataset.f; renderFactionFilters(); renderPeopleGrid(); };
  });
}

function renderPeopleGrid() {
  const grid = document.getElementById("people-grid");
  const term = getTerm();
  const list = PEOPLE_LIST.filter(p =>
    (factionFilter === "all" || p.faction === factionFilter) &&
    (!term || personMatch(p, term)));
  if (!list.length) {
    grid.innerHTML = `<div class="grid-empty">没有匹配的人物</div>`;
    return;
  }
  grid.innerHTML = list.map(p => {
    const f = FACTIONS[p.faction];
    return `<div class="p-card" data-open-person="${p.id}" title="${esc(p.title)}">
      <div class="avatar" style="color:${f.color};border-color:${f.color}">${esc(p.name[0])}</div>
      <div class="p-name">${esc(p.name)}</div>
      <div class="p-life">${esc(p.life)}</div>
      <div class="p-title">${esc(p.title)}</div>
      <span class="p-faction" style="color:${f.color};border-color:${f.color}">${f.name}</span>
    </div>`;
  }).join("");
}

function personMatch(p, term) {
  const f = FACTIONS[p.faction];
  const evNames = (p.events || []).map(id => EVENT_MAP[id] && EVENT_MAP[id].title).join("、");
  return [p.name, p.title, p.life, p.bio, f.name, evNames].join("\n").indexOf(term) !== -1;
}

/* ---------- 搜索 ---------- */
function getTerm() {
  const v = document.getElementById("search").value.trim();
  return v || "";
}

/* ---------- 弹窗 ---------- */
const modalMask = document.getElementById("modal-mask");
const modalBody = document.getElementById("modal-body");
let miniChart = null;

function openModal() {
  modalMask.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeModal() {
  modalMask.hidden = true;
  document.body.style.overflow = "";
  if (miniChart) { miniChart.dispose(); miniChart = null; }
}
document.getElementById("modal-close").onclick = closeModal;
modalMask.addEventListener("click", e => { if (e.target === modalMask) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !modalMask.hidden) closeModal(); });

function openEvent(id) {
  const ev = EVENT_MAP[id];
  if (!ev) return;
  const cat = CATS[ev.category];
  const period = PERIODS[periodOf(ev)];

  const forcesHtml = ev.forces ? `<h4 class="m-h4">对峙双方兵力</h4><div class="vs">
      <div class="side"><div class="s-name" style="color:#e0846f">${esc(ev.forces[0].side)}</div>
        <div class="s-troops">${esc(ev.forces[0].troops)}</div></div>
      <div class="vs-badge">对<small>峙</small></div>
      <div class="side"><div class="s-name" style="color:#7fa8dd">${esc(ev.forces[1].side)}</div>
        <div class="s-troops">${esc(ev.forces[1].troops)}</div></div>
    </div>` : "";

  const peopleHtml = `<h4 class="m-h4">关键人物</h4><div class="chips">${
    ev.people.length ? ev.people.map(pid => {
      const p = PERSON_MAP[pid]; if (!p) return "";
      const f = FACTIONS[p.faction];
      return `<button class="chip" data-open-person="${pid}">
        <span class="dot" style="background:${f.color}"></span>${esc(p.name)}<em style="color:${f.color}">${f.name}</em>
      </button>`;
    }).join("") : `<span style="color:var(--muted);font-size:13.5px">民众自发参与，无明确个体人物记载</span>`
  }</div>`;

  modalBody.innerHTML = `
    <span class="m-cat" style="color:${cat.color}">${cat.name}</span><span class="m-date">${esc(ev.date)} · ${period.name}</span>
    <h3 class="m-title">${esc(ev.title)}</h3>
    <p class="m-desc">${esc(ev.desc)}</p>
    ${forcesHtml}
    <h4 class="m-h4">结局与影响</h4>
    <div class="result-box">${esc(ev.result)}</div>
    ${peopleHtml}`;
  openModal();
  modalBody.scrollTop = 0;
}

function openPerson(id) {
  const p = PERSON_MAP[id];
  if (!p) return;
  const f = FACTIONS[p.faction];

  const evChips = (p.events || []).map(eid => {
    const ev = EVENT_MAP[eid]; if (!ev) return "";
    const c = CATS[ev.category];
    return `<button class="chip" data-open-event="${eid}">
      <span class="dot" style="background:${c.color}"></span>${esc(ev.title)}</button>`;
  }).join("");

  const relChips = RELATIONS.filter(r => r.a === id || r.b === id).map(r => {
    const otherId = r.a === id ? r.b : r.a;
    const other = PERSON_MAP[otherId]; if (!other) return "";
    const of_ = FACTIONS[other.faction];
    return `<button class="chip chip-rel" data-open-person="${otherId}">
      <span class="dot" style="background:${of_.color}"></span>${esc(other.name)}<em>· ${esc(r.t)}</em></button>`;
  }).join("");

  modalBody.innerHTML = `
    <div class="person-head">
      <div class="avatar" style="color:${f.color};border-color:${f.color}">${esc(p.name[0])}</div>
      <div class="p-meta">
        <h3>${esc(p.name)}</h3>
        <div class="p-life">${esc(p.life)}</div>
        <div class="badges">
          <span class="badge" style="color:${f.color};border-color:${f.color}">${f.name}</span>
          <span class="badge" style="color:var(--gold);border-color:var(--gold)">${esc(p.title)}</span>
        </div>
      </div>
    </div>
    <p class="m-desc">${esc(p.bio)}</p>
    <h4 class="m-h4">参与事件</h4>
    <div class="chips">${evChips || "—"}</div>
    <h4 class="m-h4">人物关系（点击跳转）</h4>
    <div id="mini-graph"></div>
    <div class="chips" style="margin-top:12px">${relChips || "暂无连线关系"}</div>`;
  openModal();
  modalBody.scrollTop = 0;
  renderMiniGraph(id, f.color);
}

function renderMiniGraph(centerId, color) {
  const el = document.getElementById("mini-graph");
  if (!el || typeof echarts === "undefined") return;
  const nodes = [{ id: centerId, name: PERSON_MAP[centerId].name, center: true }];
  const seen = { [centerId]: true };
  const links = [];
  RELATIONS.forEach(r => {
    if (r.a === centerId || r.b === centerId) {
      const other = r.a === centerId ? r.b : r.a;
      if (!seen[other]) { seen[other] = true; nodes.push({ id: other, name: PERSON_MAP[other].name }); }
      links.push({ source: r.a, target: r.b, t: r.t });
    }
  });
  miniChart = echarts.init(el);
  miniChart.setOption({
    tooltip: {
      formatter(p) {
        if (p.dataType === "edge") return esc(p.data.t);
        return esc(p.name);
      }
    },
    series: [{
      type: "graph", layout: "force", roam: true,
      force: { repulsion: 420, edgeLength: 110, gravity: .12 },
      color: [color, "#8a8f98"],
      data: nodes.map(n => ({
        id: n.id, name: n.name,
        symbolSize: n.center ? 52 : 34,
        itemStyle: n.center
          ? { color, borderColor: "#f0e8d3", borderWidth: 2, shadowBlur: 16, shadowColor: color }
          : { color: FACTIONS[PERSON_MAP[n.id].faction].color },
        label: {
          show: true, position: "bottom", color: n.center ? "#f0e8d3" : "#c9c2ad",
          fontSize: n.center ? 14 : 12, fontFamily: "serif"
        }
      })),
      links: links.map(l => ({
        source: l.source, target: l.target,
        lineStyle: { color: "rgba(255,255,255,.25)", width: 1.4, curveness: .18 },
        emphasis: { lineStyle: { color: "#d3a94f", width: 2.4 } },
        t: l.t
      })),
      emphasis: { focus: "adjacency" }
    }]
  });
  miniChart.off("click");
  miniChart.on("click", p => {
    if (p.dataType === "node" && p.data.id !== centerId) openPerson(p.data.id);
  });
}

/* ---------- 人物关系主图谱 ---------- */
let mainChart = null;
const factionOff = {};   // factionKey -> bool

function renderGraphLegend() {
  const box = document.getElementById("graph-legend");
  box.innerHTML = Object.keys(FACTIONS).map(k => {
    const f = FACTIONS[k];
    return `<button data-f="${k}" class="${factionOff[k] ? "off" : ""}">
      <span class="dot" style="background:${f.color}"></span>${f.name}（${PEOPLE_LIST.filter(p => p.faction === k).length}）</button>`;
  }).join("");
  box.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => {
      const k = btn.dataset.f;
      factionOff[k] = !factionOff[k];
      renderGraphLegend();
      applyGraphFilter();
    };
  });
}

function buildGraphOption(showAllLabels) {
  const nodes = PEOPLE_LIST.filter(p => !factionOff[p.faction]).map(p => {
    const f = FACTIONS[p.faction];
    const deg = DEGREE[p.id] || 0;
    return {
      id: p.id, name: p.name,
      symbolSize: Math.min(16 + deg * 2.6, 44),
      itemStyle: { color: f.color, borderColor: "rgba(0,0,0,.35)", borderWidth: .5 },
      label: {
        show: showAllLabels || deg >= 5,
        position: "bottom",
        color: "#cfc8b4", fontSize: 10.5, fontFamily: "serif",
        formatter: "{b}"
      }
    };
  });
  const visible = new Set(nodes.map(n => n.id));
  const links = RELATIONS.filter(r => visible.has(r.a) && visible.has(r.b)).map(r => ({
    source: r.a, target: r.b,
    lineStyle: { color: "rgba(255,255,255,.16)", width: 1.2, curveness: .15 },
    emphasis: { lineStyle: { color: "#d3a94f", width: 2.4 } },
    t: r.t
  }));
  return {
    tooltip: {
      backgroundColor: "rgba(18,21,30,.94)", borderColor: "rgba(211,169,79,.5)",
      textStyle: { color: "#e9e4d6", fontFamily: "serif" },
      formatter(p) {
        if (p.dataType === "edge") return `<b>${esc(PERSON_MAP[p.data.source].name)}</b> — ${esc(p.data.t)} — <b>${esc(PERSON_MAP[p.data.target].name)}</b>`;
        const person = PERSON_MAP[p.data.id];
        return `<b style="font-size:15px">${esc(person.name)}</b><br>
          <span style="color:#d3a94f">${esc(person.life)} · ${esc(FACTIONS[person.faction].name)}</span><br>
          <span style="color:#9aa2b1">${esc(person.title)}</span><br>
          <span style="color:#7d8593">点击查看人物详情</span>`;
      }
    },
    series: [{
      type: "graph", layout: "force", roam: true,
      force: {
        repulsion: nodes.length > 300 ? 85 : (nodes.length > 150 ? 150 : 300),
        edgeLength: nodes.length > 300 ? 38 : (nodes.length > 150 ? 52 : 80),
        gravity: .08, friction: .2
      },
      data: nodes, links,
      emphasis: { focus: "adjacency", itemStyle: { shadowBlur: 18, shadowColor: "rgba(211,169,79,.7)" } },
      scaleLimit: { min: .4, max: 4 }
    }]
  };
}

function initGraph() {
  const el = document.getElementById("graph");
  if (typeof echarts === "undefined") {
    el.innerHTML = `<div class="grid-empty">图表库加载失败，请检查 lib/echarts.min.js</div>`;
    return;
  }
  mainChart = echarts.init(el);
  mainChart.setOption(buildGraphOption(false));
  mainChart.on("click", p => { if (p.dataType === "node") openPerson(p.data.id); });

  document.getElementById("toggle-labels").onchange = e => {
    mainChart.setOption(buildGraphOption(e.target.checked));
  };
  window.addEventListener("resize", () => mainChart && mainChart.resize());
}

function applyGraphFilter() {
  if (mainChart) mainChart.setOption(buildGraphOption(document.getElementById("toggle-labels").checked), { notMerge: true });
}

/* ---------- 事件委托：卡片 / 弹窗内跳转 ---------- */
document.addEventListener("click", e => {
  const evCard = e.target.closest("[data-open-event]");
  if (evCard) { openEvent(evCard.dataset.openEvent); return; }
  const pCard = e.target.closest("[data-open-person]");
  if (pCard) { openPerson(pCard.dataset.openPerson); return; }
});

/* ---------- 启动 ---------- */
renderCatFilters();
renderTimeline();
renderFactionFilters();
renderPeopleGrid();
renderGraphLegend();
initGraph();
