// M1 前台端到端验收：从 Directus 取真实 slug，再逐路由核验 Next 前台
// 用法: node verify_m1_web.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(__dirname, "..", "web", ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const DIRECTUS = env.DIRECTUS_URL;
const TOKEN = env.DIRECTUS_TOKEN;
const WEB = "http://localhost:3000";

let pass = 0;
let fail = 0;
const failures = [];

function check(label, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`  PASS  ${label}${detail ? "  " + detail : ""}`);
  } else {
    fail++;
    failures.push(label);
    console.log(`  FAIL  ${label}  ${detail}`);
  }
}

async function dGet(p, q = {}) {
  const url = `${DIRECTUS}${p}?${new URLSearchParams(q)}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  const j = await r.json().catch(() => null);
  return j?.data ?? null;
}

async function wGet(p, opts = {}) {
  const r = await fetch(`${WEB}${p}`, { redirect: "manual", ...opts });
  const text = await r.text().catch(() => "");
  return { status: r.status, text, location: r.headers.get("location") };
}

// ---------- 0. 等服务就绪 ----------
console.log("等待前台就绪…");
let ready = false;
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(`${WEB}/en`, { redirect: "manual" });
    if (r.status < 500) {
      ready = true;
      break;
    }
  } catch {}
  await new Promise((s) => setTimeout(s, 1000));
}
if (!ready) {
  console.error("前台未就绪，退出");
  process.exit(1);
}
console.log("前台已就绪\n");

// ---------- 1. 取真实数据 ----------
const cats = await dGet("/items/category", {
  "filter[status][_eq]": "published",
  fields: "id,level,translations.language,translations.slug,translations.name",
  limit: "200",
});
const pick = (n, lang) => n.translations.find((t) => t.language === lang);
const l1 = cats.find((c) => c.level === 1 && pick(c, "en")) ?? null;
const l2 = cats.find((c) => c.level === 2 && pick(c, "en")) ?? null;
const l3 = cats.find((c) => c.level === 3 && pick(c, "en")) ?? null;

const seriesArr = await dGet("/items/series", {
  "filter[status][_eq]": "published",
  fields: "id,matecode,translations.language,translations.slug,translations.name",
  limit: "1",
});
const series = seriesArr?.[0] ?? null;

const newsAll = await dGet("/items/news", {
  "filter[status][_eq]": "published",
  fields: "id,translations.language,translations.slug,translations.name",
  limit: "50",
});
const newsEn = newsAll.find((n) => pick(n, "en")) ?? null;
const newsZh = newsAll.find((n) => pick(n, "zh")) ?? null;

console.log("实测素材：");
console.log("  level1 :", l1 && pick(l1, "en").slug);
console.log("  level2 :", l2 && pick(l2, "en").slug);
console.log("  level3 :", l3 && pick(l3, "en").slug);
console.log("  series :", series?.matecode);
console.log("  news en:", newsEn && pick(newsEn, "en").slug);
console.log("  news zh:", newsZh && pick(newsZh, "zh").slug);
console.log("");

// ---------- 2. 根路径与语言入口 ----------
console.log("A. 语言入口 / middleware");
{
  const r = await wGet("/");
  check("GET / 重定向", r.status === 307 || r.status === 308, `[${r.status}] → ${r.location}`);
  check("GET / 落到 /en", (r.location ?? "").endsWith("/en"), String(r.location));
}
for (const lang of ["en", "zh"]) {
  const r = await wGet(`/${lang}`);
  check(`GET /${lang} = 200`, r.status === 200, `[${r.status}]`);
  check(
    `/${lang} <html lang> 正确`,
    r.text.includes(`<html lang="${lang === "zh" ? "zh-Hans" : "en"}"`),
    ""
  );
}
{
  const zh = await wGet("/zh");
  check("/zh 出现中文分类名", zh.text.includes("接线端子") || /[\u4e00-\u9fa5]/.test(zh.text), "");
}
{
  const unsupported = await wGet("/product/category/nonexistent-route-probe");
  check(
    "无语言前缀路径被收敛到 /en",
    unsupported.status === 307 || unsupported.status === 308,
    `[${unsupported.status}] → ${unsupported.location}`
  );
}

// ---------- 3. 分类链 ----------
console.log("\nB. 分类（level1 → level2 → level3）");
if (l1) {
  const slug = pick(l1, "en").slug;
  const r = await wGet(`/en/product/category/${slug}`);
  check(`level1 页 200 (${slug})`, r.status === 200, `[${r.status}]`);
  check("level1 页有子分类卡片", r.text.includes("/product/category/"), "");
  check("canonical 自指", r.text.includes(`/en/product/category/${slug}`), "");
  check("含 hreflang 互链", /hreflang=/i.test(r.text), "");
}
if (l2) {
  const slug = pick(l2, "en").slug;
  const r = await wGet(`/en/product/category/${slug}`);
  check(`level2 页 200 (${slug})`, r.status === 200, `[${r.status}]`);
}
if (l3) {
  const slug = pick(l3, "en").slug;
  const r = await wGet(`/en/product/category/${slug}`);
  check(`level3 页 200 (${slug})`, r.status === 200, `[${r.status}]`);
  check("level3 页出现系列链接", r.text.includes("/product/series/"), "");
}

// ---------- 4. 系列详情（含语言收敛）----------
console.log("\nC. 系列详情");
if (series) {
  const mc = series.matecode;
  const r = await wGet(`/en/product/series/${mc}`);
  check(`/en 系列页 200 (${mc})`, r.status === 200, `[${r.status}]`);
  check("系列页有变体表", r.text.includes("Variants"), "");
  check("系列页有 Product JSON-LD", r.text.includes('"@type":"Product"'), "");

  const zhLangs = series.translations.map((t) => t.language);
  const rz = await wGet(`/zh/product/series/${mc}`);
  if (zhLangs.includes("zh")) {
    check(`/zh 系列页 200（有中文翻译）`, rz.status === 200, `[${rz.status}]`);
  } else {
    check(
      `/zh 无中文翻译 → 收敛到 /en`,
      (rz.status === 307 || rz.status === 308) && (rz.location ?? "").includes("/en/"),
      `[${rz.status}] → ${rz.location}`
    );
  }
}

// ---------- 5. 新闻 ----------
console.log("\nD. 新闻");
for (const lang of ["en", "zh"]) {
  const r = await wGet(`/${lang}/news`);
  check(`/${lang}/news = 200`, r.status === 200, `[${r.status}]`);
}
if (newsEn) {
  const s = pick(newsEn, "en").slug;
  const r = await wGet(`/en/news/${s}`);
  check(`/en 新闻详情 200`, r.status === 200, `[${r.status}]`);
  check("新闻详情有正文", r.text.includes("<p>"), "");
  check("新闻详情有 NewsArticle/正文段落", r.text.length > 500, "");
}
if (newsZh) {
  const s = pick(newsZh, "zh").slug;
  const r = await wGet(`/zh/news/${s}`);
  check(`/zh 新闻详情 200`, r.status === 200, `[${r.status}]`);
  check("zh 新闻详情是中文", /[\u4e00-\u9fa5]/.test(r.text), "");
}
if (newsEn && newsZh) {
  const zhSlug = pick(newsZh, "zh").slug;
  const enSlug = pick(newsEn, "en").slug;
  if (zhSlug !== enSlug) {
    const r = await wGet(`/en/news/${zhSlug}`);
    check(
      "用 zh slug 访问 /en → 收敛到 /zh",
      (r.status === 307 || r.status === 308) && (r.location ?? "").includes("/zh/"),
      `[${r.status}] → ${r.location}`
    );
  }
}

// ---------- 6. 404 ----------
console.log("\nE. 404");
{
  const r = await wGet("/en/product/series/__no_such_matecode__");
  check("不存在的系列 → 404", r.status === 404, `[${r.status}]`);
  const r2 = await wGet("/en/product/category/__no_such_slug__");
  check("不存在的分类 → 404", r2.status === 404, `[${r2.status}]`);
}

// ---------- 7. metadata 必须落在 <head> 内（对不执行 JS 的爬虫可见）----------
console.log("\nF. metadata 在 <head> 内（GEO 关键）");
{
  const BOTS = {
    Googlebot:
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    GPTBot:
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
    ClaudeBot: "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
    PerplexityBot:
      "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
    Bytespider:
      "Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)",
  };
  const targets = [
    "/en",
    "/en/news",
    l3 ? `/en/product/category/${pick(l3, "en").slug}` : null,
    series ? `/en/product/series/${series.matecode}` : null,
  ].filter(Boolean);

  for (const [bot, ua] of Object.entries(BOTS)) {
    let allOk = true;
    const detail = [];
    for (const p of targets) {
      const r = await fetch(`${WEB}${p}`, { headers: { "User-Agent": ua } });
      const t = await r.text();
      const headEnd = t.indexOf("</head>");
      const ti = t.indexOf("<title");
      const ci = t.indexOf('rel="canonical"');
      const ok = ti >= 0 && ti < headEnd && ci >= 0 && ci < headEnd;
      if (!ok) {
        allOk = false;
        detail.push(p);
      }
    }
    check(
      `${bot} 拿到 head 内 title+canonical`,
      allOk,
      allOk ? `(${targets.length} 个页型)` : `失败于 ${detail.join(", ")}`
    );
  }
}

console.log(`\n================ 结果 ================`);
console.log(`PASS ${pass}   FAIL ${fail}`);
if (failures.length) {
  console.log("失败项：");
  for (const f of failures) console.log("  - " + f);
}
process.exit(fail === 0 ? 0 : 1);
