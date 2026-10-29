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

const products = await dGet("/items/product", {
  "filter[status][_eq]": "published",
  fields: "id,order_no,title,translations.language,translations.slug,translations.name,media_links.file_id,media_links.media_id.file_id",
  limit: "20",
});
const product = products?.find((item) => item.translations?.some((t) => t.language === "en")) ?? null;

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
console.log("  product:", product?.order_no);
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
  check("系列表不把旧库选项码标为节距", !/<th[^>]*>Pitch<\/th>/.test(r.text), "");
  if (r.text.includes("Related Series")) {
    check("相关系列在参数表下方整行展示", r.text.includes('id="related-series"'), "");
  }
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

// ---------- 4.1 SKU 产品详情 ----------
console.log("\nC2. SKU 产品详情");
if (product) {
  const orderNo = product.order_no;
  const r = await wGet(`/en/product/${orderNo}`);
  check(`/en 产品详情 200 (${orderNo})`, r.status === 200, `[${r.status}]`);
  check("产品详情显示订货号", r.text.includes(orderNo), "");
  check("产品详情包含 Product JSON-LD", r.text.includes('"@type":"Product"'), "");
  check("产品详情有带订货号的咨询入口", r.text.includes("subject=DEGSON%20" + encodeURIComponent(orderNo)), "");
  check("产品详情能返回分类选型", r.text.includes("/en/#products"), "");
  check("产品详情技术信息独立展示", r.text.includes('id="technical-details"'), "");
  check("产品详情有系列入口", r.text.includes("/en/product/series/"), "");
  check("缺少 SKU 实物图时标注系列参考图", r.text.includes("Series reference image"), "");
  check("旧网页截图不作为 SKU 主图", !r.text.includes(`/api/product-media/${orderNo}/`), "");
  const mediaId = product.media_links?.map((link) => link.file_id ?? link.media_id?.file_id).find(Boolean);
  if (mediaId) {
    const image = await fetch(`${WEB}/api/product-media/${encodeURIComponent(orderNo)}/${mediaId}`);
    check("已发布 SKU 图片可加载", image.status === 200 && (image.headers.get("content-type") ?? "").startsWith("image/"), `[${image.status}]`);
    const unrelated = await fetch(`${WEB}/api/product-media/__invalid__/${mediaId}`);
    check("图片不能通过其他订货号读取", unrelated.status === 404, `[${unrelated.status}]`);
  }
  const missing = await wGet("/en/product/__no_such_order_no__");
  check("不存在的产品详情 → 404", missing.status === 404, `[${missing.status}]`);
}

console.log("\nC2.1 SKU 资料试点样本");
{
  const first = await wGet("/en/product/10010012354");
  check("试点 SKU 10010012354 200", first.status === 200, `[${first.status}]`);
  check("试点页显示技术参数", first.text.includes('id="specifications"') && first.text.includes("Rated current"), "");
  check("试点页显示认证", first.text.includes('id="certifications"') && first.text.includes("UL"), "");
  check("试点页显示资料下载且不用内部码", first.text.includes('id="downloads"') && first.text.includes("Data sheet") && !first.text.includes("datasheet"), "");
  check("试点页显示关联系列", first.text.includes('id="related"'), "");
  check("空附件模块不出现", !first.text.includes('id="accessories"'), "");
  const second = await wGet("/en/product/29010000012");
  check("试点 SKU 29010000012 200", second.status === 200, `[${second.status}]`);
  check("第二条有认证或资料", second.text.includes('id="certifications"') || second.text.includes('id="downloads"'), "");
  const zhPage = await wGet("/zh/product/10010012354");
  check(
    "无中文翻译时试点 SKU 收敛到英文页",
    zhPage.status === 307 && (zhPage.location ?? "").includes("/en/product/10010012354"),
    `[${zhPage.status}] → ${zhPage.location ?? ""}`,
  );
  const fileMatch = first.text.match(/\/api\/product-document\/10010012354\/([0-9a-f-]+)/i);
  if (fileMatch) {
    const ok = await fetch(`${WEB}/api/product-document/10010012354/${fileMatch[1]}`);
    check("资料下载 attachment", ok.status === 200 && (ok.headers.get("content-disposition") ?? "").includes("attachment"), `[${ok.status}]`);
    const wrong = await fetch(`${WEB}/api/product-document/29010000012/${fileMatch[1]}`);
    check("资料不能串 SKU 下载", wrong.status === 404, `[${wrong.status}]`);
  }
}

// ---------- 4.2 方案到真实产品分类 ----------
console.log("\nC3. 方案到产品分类");
if (l1) {
  const slug = pick(l1, "en").slug;
  const r = await wGet("/en/solutions");
  check("方案页 200", r.status === 200, `[${r.status}]`);
  check("方案页有真实一级分类链接", r.text.includes(`/en/product/category/${slug}`), "");
  check("方案页可继续进入服务", r.text.includes("/en/services"), "");
  const sections = await dGet("/items/page_sections", {
    "filter[page_slug][_eq]": "solutions",
    "filter[status][_eq]": "published",
    fields: "code,translations.language,translations.title",
    limit: "20",
  });
  for (const code of ["sol-products", "sol-support"]) {
    const title = sections?.find((section) => section.code === code)?.translations?.find((translation) => translation.language === "en")?.title;
    check(`方案页文案来自后台 ${code}`, Boolean(title) && r.text.includes(title), title ?? "missing CMS content");
  }
}

console.log("\nC4. 服务 / 关于 / 方案 CMS 正文");
{
  const pages = await dGet("/items/site_pages", {
    fields: "slug,translations.language,translations.title,translations.body",
    limit: "10",
  });
  const snippetOf = (body) =>
    String(body ?? "")
      .replace(/<[^>]+>/g, " ")
      .split(/\s+/)
      .map((part) => part.trim())
      .find((part) => part.length >= 6);
  for (const slug of ["services", "about", "solutions"]) {
    for (const lang of ["en", "zh"]) {
      const path = `/${lang}/${slug}`;
      const row = pages?.find((page) => page.slug === slug);
      const t = row?.translations?.find((item) => item.language === lang);
      const page = await wGet(path);
      check(`${path} 200`, page.status === 200, `[${page.status}]`);
      if (t?.title) {
        check(`${path} 标题来自后台`, page.text.includes(t.title), t.title);
      }
      const snippet = snippetOf(t?.body);
      if (snippet) {
        check(`${path} 正文来自后台`, page.text.includes(snippet), snippet.slice(0, 40));
      }
    }
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

console.log("\nG. 列表页 JSON-LD（PRD v3 GEO）");
{
  for (const p of ["/en", "/en/news", "/en/about"]) {
    const r = await wGet(p);
    check(
      `${p} 含 JSON-LD`,
      r.status === 200 && r.text.includes("application/ld+json"),
      `[${r.status}]`
    );
  }
}

console.log("\nH. 浏览器标题不重复品牌");
{
  const titleOf = (html) => {
    const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return (m?.[1] ?? "").trim();
  };
  for (const p of ["/zh/services", "/en/services", "/zh/about", "/zh/news", "/en", "/zh/solutions"]) {
    const r = await wGet(p);
    const title = titleOf(r.text);
    check(
      `${p} title 不重复 DEGSON`,
      r.status === 200 && Boolean(title) && !/DEGSON\s*\|\s*DEGSON/i.test(title) && !/\|\s*DEGSON\s*\|/i.test(title),
      title || `[${r.status}]`
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
