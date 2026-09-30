/* Surge 一键部署：node scripts/surge-deploy.js [域名]
   流程：email+password 换 token（首次自动注册）→ tar.gz 流式上传发布 */
const path = require("path");
const fs = require("fs");
const NPM_G = require("child_process").execSync("npm root -g").toString().trim();
const sdk = require(path.join(NPM_G, "surge/node_modules/surge-sdk/lib/sdk.js"));
const streamMod = require(path.join(NPM_G, "surge/node_modules/surge-stream/lib/stream.js"));

const EMAIL = process.env.SURGE_EMAIL || "daisyyijin.history@outlook.com";
const PASS = process.env.SURGE_PASS || "Shijian-2026";
const DOMAIN = process.argv[2] || "china-history.surge.sh";
const DIST = path.join(__dirname, "..", "dist");
const CONFIG = path.join(process.env.USERPROFILE || process.env.HOME, ".surge", "config");

const s = sdk({ endpoint: "https://surge.surge.sh" });

console.log("→ 获取 token（首次自动注册账号 " + EMAIL + "）...");
s.token({ username: EMAIL, password: PASS }, (err, tok) => {
  if (err) { console.error("认证失败:", err.messages || JSON.stringify(err).slice(0, 300)); process.exit(1); }
  if (!tok || !tok.pass) { console.error("未返回 token:", tok); process.exit(1); }
  const token = tok.pass;
  console.log("✓ token 获取成功");
  try {
    fs.mkdirSync(path.dirname(CONFIG), { recursive: true });
    fs.writeFileSync(CONFIG, JSON.stringify({ email: EMAIL, token: token }));
    console.log("✓ 凭据已存 " + CONFIG);
  } catch (e) {}

  console.log("→ 打包 dist/ 并发布到 " + DOMAIN + " ...");
  const strm = streamMod({ endpoint: "https://surge.surge.sh" });
  const em = strm.publish(DIST, DOMAIN, { username: "token", password: token });
  em.on("progress", pct => process.stdout.write("\r  上传 " + pct + "%"));
  em.on("success", () => { console.log("\n🎉 部署成功 → https://" + DOMAIN + "/"); process.exit(0); });
  em.on("fail", () => { console.error("\n发布失败"); process.exit(1); });
  em.on("error", e => { console.error("\n网络错误:", e.message || e); process.exit(1); });
  setTimeout(() => { console.error("\n超时"); process.exit(1); }, 120000).unref();
});
