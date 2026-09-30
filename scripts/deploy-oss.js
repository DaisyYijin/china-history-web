/**
 * 阿里云 OSS 一键部署脚本（国内节点，访问速度快，免备案子域名）
 *
 * 用法：
 *   1. 复制 scripts/oss-config.example.json 为 scripts/oss-config.json，
 *      填入 region / bucket / accessKeyId / accessKeySecret
 *      （也可用环境变量 OSS_REGION / OSS_BUCKET / OSS_AK / OSS_SK 代替）
 *   2. python scripts/package.py        # 重新打包，确保 dist/ 最新
 *   3. npm install                       # 安装依赖（走 npmmirror 镜像）
 *   4. node scripts/deploy-oss.js
 *
 * 脚本会自动：建桶(如不存在) → 设公共读 → 开静态托管 → 上传 dist/ 全部文件
 * 部署完成后访问：http://{bucket}.{region}.aliyuncs.com/index.html
 */
"use strict";

const fs = require("fs");
const path = require("path");
const OSS = require("ali-oss");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");

/* ---------- 读取配置 ---------- */
let cfg = {};
const cfgPath = path.join(__dirname, "oss-config.json");
if (fs.existsSync(cfgPath)) cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));

const REGION = process.env.OSS_REGION || cfg.region;
const BUCKET = process.env.OSS_BUCKET || cfg.bucket;
const AK = process.env.OSS_AK || cfg.accessKeyId;
const SK = process.env.OSS_SK || cfg.accessKeySecret;

if (!REGION || !BUCKET || !AK || !SK) {
  console.error("缺少配置：请创建 scripts/oss-config.json（参考 oss-config.example.json）");
  console.error("或设置环境变量 OSS_REGION / OSS_BUCKET / OSS_AK / OSS_SK");
  process.exit(1);
}
if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.error("dist/ 不存在或未打包，请先运行：python scripts/package.py");
  process.exit(1);
}

const client = new OSS({
  region: REGION,            // 例如 oss-cn-hangzhou
  accessKeyId: AK,
  accessKeySecret: SK,
  bucket: BUCKET,
});

/* ---------- MIME 与缓存策略 ---------- */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};
// 必须每次拿最新的文件不缓存；其余走长缓存（页面用 ?v= 版本号刷新）
const NO_CACHE = new Set(["index.html", "version.json", "sw.js"]);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

async function ensureBucket() {
  try {
    await client.getBucketInfo(BUCKET);
    console.log(`✓ 桶已存在：${BUCKET}`);
  } catch (e) {
    if (String(e.status) === "404") {
      await client.putBucket(BUCKET, { acl: "public-read" });
      console.log(`✓ 已创建桶：${BUCKET}`);
    } else {
      throw e;
    }
  }
  await client.putBucketACL(BUCKET, "public-read");
  await client.putBucketWebsite(BUCKET, {
    index: "index.html",
    error: "index.html", // 单页应用，所有路径回退首页
    subDirType: 0,
  });
  console.log("✓ 已设置：公共读 + 静态托管(index.html)");
}

async function uploadAll() {
  const files = walk(DIST);
  const total = files.length;
  console.log(`开始上传 ${total} 个文件…`);
  let done = 0;
  const CONCURRENCY = 6;
  let cursor = 0;

  async function worker() {
    while (cursor < files.length) {
      const file = files[cursor++];
      const key = path.relative(DIST, file).split(path.sep).join("/");
      const ext = path.extname(key).toLowerCase();
      const headers = {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": NO_CACHE.has(key)
          ? "no-cache"
          : "public, max-age=604800",
      };
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await client.put(key, file, { headers });
          break;
        } catch (e) {
          if (attempt === 3) throw e;
          await new Promise(r => setTimeout(r, 800 * attempt));
        }
      }
      done++;
      if (done % 10 === 0 || done === total) console.log(`  ${done}/${total}`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log("✓ 上传完成");
}

(async () => {
  console.log(`阿里云 OSS 部署：${BUCKET}.${REGION}.aliyuncs.com`);
  await ensureBucket();
  await uploadAll();
  const url = `http://${BUCKET}.${REGION}.aliyuncs.com/index.html`;
  console.log("\n部署成功！访问地址：");
  console.log("  " + url);
  console.log("\n提示：在 OSS 控制台绑定自定义域名可走 HTTPS（需已备案域名）");
})().catch(e => {
  console.error("部署失败：", e.message || e);
  process.exit(1);
});
