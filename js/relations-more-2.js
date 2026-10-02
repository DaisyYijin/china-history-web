/* =========================================================
 * 关系补批 · 二（v2.60）：为 24 位图谱孤立人物补上史实关系边
 * （李春、王冕、王选暂无站得住的直接关系，保持孤立）
 * ========================================================= */

RELATIONS.push(
  /* ---------- 明清 · 辽东 ---------- */
  { a: "xiongtingbi",  b: "nuerhachi",    t: "攻守对手 · 辽东经略与后金开国汗" },
  { a: "xiongtingbi",  b: "sunchengzong", t: "先后经略 · 共同撑起辽东守局" },
  /* ---------- 南京大屠杀 · 战犯与国际友人 ---------- */
  { a: "matsuiiwane",      b: "tanihisao",        t: "上下级 · 华中方面军司令与第六师团长（南京大屠杀主犯）" },
  { a: "matsuiiwane",      b: "asakayashuhiko",   t: "上下级 · 华中方面军司令与上海派遣军司令" },
  { a: "asakayashuhiko",   b: "mutoakira",        t: "同僚 · 攻占南京时的派遣军司令部" },
  { a: "matsuiiwane",      b: "mutoakira",        t: "上下级 · 方面军司令与副参谋长" },
  { a: "rabe",             b: "vautrin",          t: "同仁 · 南京安全区国际委员会与金陵女大难民所" },
  /* ---------- 学界 ---------- */
  { a: "lidaoyuan",    b: "xuxiake",      t: "前后相望 · 古代地理学双璧（《水经注》与《徐霞客游记》）" },
  { a: "feixiaotong",  b: "yanyangchu",   t: "同侪 · 社会学改良与平民教育两种乡建路径" },
  { a: "feixiaotong",  b: "liangshuming", t: "论学 · 乡村建设运动的观察者与主持者" },
  { a: "yanyangchu",   b: "taoxingzhi",   t: "同道 · 平民教育与乡村教育运动" },
  { a: "yanyangchu",   b: "liangshuming", t: "同侪 · 乡村建设两大路向" },
  { a: "jixianlin",    b: "fusinian",     t: "北大同事 · 校长与东方语言文学系主任" },
  { a: "huangdanian",  b: "lisiguang",    t: "前后相承 · 两代海归地球科学家报国" },
  { a: "wumengchao",   b: "zhongnanshan", t: "医界双璧 · 肝胆外科与呼吸病学泰斗" },
  { a: "qigong",       b: "qibaishi",     t: "同道 · 二十世纪书画大家（北平书画界）" },
  /* ---------- 体育 ---------- */
  { a: "xuhaifeng",    b: "lining",       t: "同届夺金 · 1984 洛杉矶奥运会首金与三金" },
  { a: "langping",     b: "lining",       t: "80年代双杰 · 女排五连冠与体操三金" },
  { a: "yaoming",      b: "liuxiang",     t: "上海双星 · 同城同时代体育偶像" },
  { a: "dengyaping",   b: "langping",     t: "两代女将 · 乒乓大满贯与女排铁榔头" },
  /* ---------- 文艺 ---------- */
  { a: "changxiangyu", b: "meilanfang",   t: "戏曲双璧 · 豫剧与京剧大师（1952 年全国戏曲观摩演出订交）" },
  { a: "houbaolin",    b: "meilanfang",   t: "同代名家 · 相声与京剧舞台双峰" },
  { a: "zhanghenshui", b: "maodun",       t: "雅俗两路 · 通俗小说大家与文学研究会代表" },
  { a: "wuguanzhong",  b: "linfengmian",  t: "师承 · 杭州国立艺专师生" },
  { a: "wuguanzhong",  b: "xubeihong",    t: "论战 · 关于国画前途的「笔墨」之争" }
);
