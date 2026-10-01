/* 从维基百科批量抓取人物画像 → img/p/{id}.jpg，并重建 js/portraits.js
 *
 * 用法（在能访问维基百科的网络环境下）：
 *   node scripts/fetch-portraits.js          # 抓取清单内人物
 *   node scripts/fetch-portraits.js 李白     # 只抓指定名字
 *
 * 说明：
 * - 抓取中文维基摘要接口的题图（thumbnail），多数为公有领域古画；
 * - 失败（无条目/无题图/网络不通）自动跳过，不中断批量；
 * - 完成后自动重写 js/portraits.js，随后运行
 *   python scripts/build-bundle.py 重新打包即可生效。
 */
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "img", "p");
const PORTRAITS_JS = path.join(ROOT, "js", "portraits.js");

/* 知名人物清单：id → 维基条目名（中文优先，可加英文备选） */
const WANTED = {
  "huangdi": "黄帝", "yandi": "炎帝", "yu": "禹", "tangshang": "商汤", "zhouwenwang": "周文王",
  "zhouwuwang": "周武王", "jiangtaigong": "姜子牙", "duke_zhou": "周公旦", "laotze": "老子",
  "kongzi": "孔子", "sunwu": "孙子", "mozi": "墨子", "shangyang": "商鞅", "quyuan": "屈原",
  "mengzi": "孟子", "zhuangzi": "庄子", "xunzi": "荀子", "lianpo": "廉颇", "linxiangru": "蔺相如",
  "qinshihuang": "秦始皇", "lixin": "李斯", "hanxin": "韩信", "zhangliang": "张良",
  "xiangyu": "项羽", "liubang": "汉高祖", "lche": "汉武帝", "simaqian": "司马迁",
  "huoqubing": "霍去病", "weiqing": "卫青", "zhangqian": "张骞", "sima_xiangru": "司马相如",
  "caocao": "曹操", "liubei": "刘备", "guanyu": "关羽", "zhangfei": "张飞", "zhugeliang": "诸葛亮",
  "zhouyu": "周瑜", "sunquan": "孙权", "simayi": "司马懿", "jikang": "嵇康", "wangxizhi": "王羲之",
  "gu kaizhi": "顾恺之", "taoyuanming": "陶渊明", "zulchongzhi": "祖冲之", "xiaowendi": "魏孝文帝",
  "yangdi": "隋炀帝", "lijing": "李靖", "tangtaizong": "唐太宗", "wuzetian": "武则天",
  "xuanzang": "玄奘", "libai": "李白", "dufu": "杜甫", "baijuyi": "白居易", "wangwei": "王维",
  "hanyu": "韩愈", "liuzongyuan": "柳宗元", "lihzh": "李贺", "duumu": "杜牧", "lishangyin": "李商隐",
  "zhaokuangyin": "赵匡胤", "fankuangyan": "范宽", "baozheng": "包拯", "simaguang": "司马光",
  "wanganshi": "王安石", "sushi": "苏轼", "suzhe": "苏辙", "liqingzhao": "李清照", "yuefei": "岳飞",
  "zhuxi": "朱熹", "xinqiji": "辛弃疾", "lu_you": "陆游", "wen tianxiang": "文天祥",
  "chengjisihan": "成吉思汗", "hubilie": "忽必烈", "guanshiheng": "关汉卿", "huanggongwang": "黄公望",
  "zhuyuanzhang": "朱元璋", "zhuyuanzhang2": "明太祖", "zhenghe": "郑和", "yujqian": "于谦",
  "wangshouren": "王阳明", "tangyin": "唐伯虎", "qiujrui": "徐渭", "zhangjuzheng": "张居正",
  "qijiguang": "戚继光", "yuan Chonghuan": "袁崇焕", "chzz": "崇祯帝", "lishz": "李自成",
  "nuerhachi": "努尔哈赤", "hongtaiji": "皇太极", "kangxi": "康熙帝", "yongzheng": "雍正帝",
  "qianlong": "乾隆帝", "linzexu": "林则徐", "zenggf": "曾国藩", "lizh": "李鸿章",
 "zuozt": "左宗棠", "zhipd": "张之洞", "cihsi": "慈禧太后", "sunzx": "孙中三",
  "hongxiuquan": "洪秀全", "kangywei": "康有为", "liangqichao": "梁启超", "tanst": "谭嗣同",
  "qiujin": "秋瑾", "huangxing": "黄兴", "songjren": "宋教仁", "cai_e": "蔡锷",
  "chen_duxiu": "陈独秀", "luxun": "鲁迅", "hushi": "胡适", "lidezhao": "李大钊",
  "chenyz": "陈毅", "zhude": "朱德", "pengdh": "彭德怀", "linbiao": "林彪", "liushq": "刘少奇",
  "zhouenlai": "周恩来", "mzd": "毛泽东", "dengxp": "邓小平", "sngql": "宋庆龄",
  "zhangzuo": "张学良", "yangjy": "杨靖宇", "zhaoym": "赵一曼", "zizq": "张自忠",
  "dengyc": "邓稼先", "qianxs": "钱学森", "lisg": "李四光", "huoyn": "华罗庚", "yuanlp": "袁隆平",
  "tuhanyu": "屠呦呦", "zhtly": "钟南山"
};

function get(url, redirects) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "china-history-portraits/1.0" } }, res => {
      if ([301, 302, 303, 307].includes(res.statusCode) && (redirects || 0) < 4) {
        return get(new URL(res.headers.location, url).href, (redirects || 0) + 1).then(resolve, reject);
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error("HTTP " + res.statusCode)); }
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}

async function fetchOne(id, title) {
  const api = "https://zh.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title);
  const buf = await get(api);
  const summary = JSON.parse(buf.toString("utf8"));
  const thumb = summary.thumbnail && summary.thumbnail.source;
  if (!thumb) throw new Error("无题图");
  const img = await get(thumb);
  const file = path.join(OUT_DIR, id + ".jpg");
  fs.writeFileSync(file, img);
  return { id, file: "img/p/" + id + ".jpg", bytes: img.length };
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const only = process.argv[2];
  const entries = Object.entries(WANTED).filter(([, t]) => !only || t.includes(only));
  const ok = [], fail = [];
  for (const [id, title] of entries) {
    try {
      const r = await fetchOne(id, title);
      ok.push(r);
      console.log(`✓ ${title} → ${r.bytes}B`);
    } catch (e) {
      fail.push(title + "(" + e.message + ")");
      console.log(`✗ ${title}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 400)); // 限速礼貌抓取
  }
  // 现有 img/p/ 全量登记（含手工放置的）
  const all = fs.readdirSync(OUT_DIR).filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .map(f => "img/p/" + f);
  const map = {};
  all.forEach(p => { const id = path.basename(p).replace(/\.(jpe?g|png|webp)$/i, ""); map[id] = p; });
  fs.writeFileSync(PORTRAITS_JS,
    `/* 人物画像索引（由 scripts/fetch-portraits.js 维护，也可手工增删）*/\nconst PORTRAITS = ${JSON.stringify(map, null, 1).replace(/"([^"]+)":/g, '"$1":')};\n`);
  console.log(`\n完成：成功 ${ok.length}，失败 ${fail.length}；portraits.js 登记画像 ${Object.keys(map).length} 张`);
  console.log("下一步：python scripts/build-bundle.py 重新打包");
})();
