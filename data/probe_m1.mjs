// M1 前端查询形状探针：验证「翻译表 + deep 过滤 + 多级父链」在 Directus 11.17.4 上是否可用
// 用法: node probe_m1.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 直接读前台凭据，避免两处 token 不一致
function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", "web", ".env.local");
  const out = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].trim();
    }
  }
  return out;
}
const envLocal = loadEnvLocal();

const BASE =
  process.env.DIRECTUS_URL ?? envLocal.DIRECTUS_URL ?? "http://localhost:8055";
const TOKEN = process.env.DIRECTUS_TOKEN ?? envLocal.DIRECTUS_TOKEN;
if (!TOKEN) {
  console.error("找不到 DIRECTUS_TOKEN（web/.env.local 缺失）");
  process.exit(1);
}

const LANG = "en";

async function get(path, params) {
  const qs = new URLSearchParams(params ?? {}).toString();
  const url = `${BASE}${path}${qs ? "?" + qs : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body, url };
}

function report(label, r, shape) {
  const ok = r.status === 200;
  console.log(
    `\n${ok ? "PASS" : "FAIL"}  ${label}  [${r.status}]`
  );
  if (!ok) {
    console.log("   err:", JSON.stringify(r.body?.errors?.[0]?.message ?? r.body));
    console.log("   url:", r.url);
    return null;
  }
  const items = r.body?.data ?? [];
  console.log("   count:", Array.isArray(items) ? items.length : "(object)");
  const sample = Array.isArray(items) ? items[0] : items;
  if (sample && shape) {
    for (const k of shape) {
      const v = k.split(".").reduce((o, p) => {
        if (o == null) return o;
        // translations 这类 O2M 字段是数组，取第一项
        return Array.isArray(o) ? o[0]?.[p] : o[p];
      }, sample);
      console.log(`   ${k} =`, JSON.stringify(v));
    }
  }
  return sample;
}

// deep 参数：Directus 用 deep[rel][_filter][field][_eq] 过滤「展开出来的」关联集合
function deepTrans(prefix, lang) {
  return { [`deep[${prefix}][_filter][language][_eq]`]: lang };
}

const results = {};

// ---------- 1. 分类列表（一级）带翻译 ----------
{
  const r = await get("/items/category", {
    "filter[level][_eq]": "1",
    "filter[status][_eq]": "published",
    sort: "sort",
    limit: "100",
    fields:
      "id,level,sort,status,image," +
      "translations.name,translations.slug,translations.short_description,translations.description",
    ...deepTrans("translations", LANG),
  });
  results.catList = report("1 分类列表 level=1 + deep 翻译过滤", r, [
    "id",
    "level",
    "translations.name",
    "translations.slug",
  ]);
}

// ---------- 2. 按 slug 取分类（slug 在翻译表）+ 父链 ----------
{
  // 先拿到一个真实 slug
  const slug = results.catList?.translations?.[0]?.slug;
  console.log("\n>>> 使用 slug:", slug);
  const r = await get("/items/category", {
    "filter[status][_eq]": "published",
    "filter[translations][slug][_eq]": String(slug),
    "filter[translations][language][_eq]": LANG,
    limit: "1",
    fields:
      "id,level,sort,status,image," +
      "translations.name,translations.slug,translations.short_description,translations.description," +
      "parent_id.id,parent_id.level,parent_id.translations.name,parent_id.translations.slug," +
      "parent_id.parent_id.id,parent_id.parent_id.level," +
      "parent_id.parent_id.translations.name,parent_id.parent_id.translations.slug",
    ...deepTrans("translations", LANG),
    ...deepTrans("parent_id.translations", LANG),
    ...deepTrans("parent_id.parent_id.translations", LANG),
  });
  results.catBySlug = report("2 按翻译 slug 取分类 + 两级父链翻译", r, [
    "id",
    "translations.name",
    "parent_id.translations.name",
  ]);
}

// ---------- 3. 子分类 ----------
{
  const pid = results.catList?.id;
  const r = await get("/items/category", {
    "filter[parent_id][_eq]": String(pid),
    "filter[status][_eq]": "published",
    sort: "sort",
    limit: "100",
    fields:
      "id,level,sort,image,translations.name,translations.slug,translations.short_description",
    ...deepTrans("translations", LANG),
  });
  results.subCats = report(`3 子分类 parent_id=${pid}`, r, [
    "id",
    "translations.name",
    "translations.slug",
  ]);
}

// ---------- 4. 系列列表（按分类）带翻译 ----------
{
  // 取一个有 series 的分类：用二级分类
  let catId = results.subCats?.id;
  let r = await get("/items/series", {
    "filter[category_id][_eq]": String(catId),
    "filter[status][_eq]": "published",
    sort: "-sort",
    limit: "12",
    fields:
      "id,matecode,image,translations.name,translations.slug,translations.short_description,translations.description",
    ...deepTrans("translations", LANG),
  });
  if (!r.body?.data?.length) {
    console.log(`   (分类 ${catId} 无系列，扫描一个有的…)`);
    const scan = await get("/items/series", {
      "filter[status][_eq]": "published",
      limit: "1",
      fields: "id,category_id",
    });
    catId = scan.body?.data?.[0]?.category_id;
    console.log("   改用 category_id =", catId);
    r = await get("/items/series", {
      "filter[category_id][_eq]": String(catId),
      "filter[status][_eq]": "published",
      sort: "-sort",
      limit: "12",
      fields:
        "id,matecode,image,translations.name,translations.slug,translations.short_description",
      ...deepTrans("translations", LANG),
    });
  }
  results.seriesList = report(`4 系列列表 category_id=${catId}`, r, [
    "id",
    "matecode",
    "translations.name",
    "translations.slug",
  ]);
}

// ---------- 5. 按 matecode 取系列 + 分类父链 ----------
{
  const mc = results.seriesList?.matecode;
  console.log("\n>>> 使用 matecode:", mc);
  const r = await get("/items/series", {
    "filter[matecode][_eq]": String(mc),
    "filter[status][_eq]": "published",
    limit: "1",
    fields:
      "id,matecode,image," +
      "translations.name,translations.slug,translations.short_description,translations.description," +
      "category_id.id,category_id.level," +
      "category_id.translations.name,category_id.translations.slug," +
      "category_id.parent_id.id,category_id.parent_id.level," +
      "category_id.parent_id.translations.name,category_id.parent_id.translations.slug," +
      "category_id.parent_id.parent_id.id,category_id.parent_id.parent_id.level," +
      "category_id.parent_id.parent_id.translations.name,category_id.parent_id.parent_id.translations.slug",
    ...deepTrans("translations", LANG),
    ...deepTrans("category_id.translations", LANG),
    ...deepTrans("category_id.parent_id.translations", LANG),
    ...deepTrans("category_id.parent_id.parent_id.translations", LANG),
  });
  results.seriesByMatecode = report("5 按 matecode 取系列 + 三级分类父链", r, [
    "id",
    "matecode",
    "translations.name",
    "category_id.translations.name",
  ]);
}

// ---------- 6. 产品变体 ----------
{
  const sid = results.seriesByMatecode?.id;
  const r = await get("/items/product", {
    "filter[series_id][_eq]": String(sid),
    "filter[status][_eq]": "published",
    sort: "id",
    limit: "500",
    fields: "id,title,order_no,poles,pitch",
  });
  results.variants = report(`6 产品变体 series_id=${sid}`, r, [
    "id",
    "title",
    "order_no",
    "poles",
    "pitch",
  ]);
}

// ---------- 7. 新闻列表（翻译） ----------
{
  const r = await get("/items/news_translations", {
    "filter[language][_eq]": LANG,
    fields: "id,name,slug,short_description,news_id",
    limit: "200",
  });
  results.newsTrans = report("7 新闻翻译列表", r, [
    "id",
    "name",
    "slug",
    "news_id",
  ]);
}

// ---------- 8. 新闻主表 ----------
{
  const r = await get("/items/news", {
    fields: "id,publish_date,cover_image,status",
    limit: "200",
  });
  results.news = report("8 新闻主表", r, ["id", "publish_date", "status"]);
}

// ---------- 9. 一次性拿新闻（主表 + deep 翻译）----------
{
  const r = await get("/items/news", {
    "filter[status][_eq]": "published",
    sort: "-publish_date",
    limit: "200",
    fields:
      "id,publish_date,cover_image,status," +
      "translations.name,translations.slug,translations.short_description,translations.description",
    ...deepTrans("translations", LANG),
  });
  results.newsJoined = report("9 新闻一次查询（deep 翻译）", r, [
    "id",
    "translations.name",
    "translations.slug",
  ]);
}

// ---------- 10. 按翻译 slug 取新闻详情 ----------
{
  const slug = results.newsTrans?.slug ?? results.newsJoined?.translations?.[0]?.slug;
  console.log("\n>>> 使用 news slug:", slug);
  const r = await get("/items/news", {
    "filter[status][_eq]": "published",
    "filter[translations][slug][_eq]": String(slug),
    "filter[translations][language][_eq]": LANG,
    limit: "1",
    fields:
      "id,publish_date,cover_image,status," +
      "translations.name,translations.slug,translations.short_description,translations.description",
    ...deepTrans("translations", LANG),
  });
  results.newsDetail = report("10 按翻译 slug 取新闻详情", r, [
    "id",
    "translations.name",
    "translations.description",
  ]);
}

// ---------- 11. site_settings ----------
{
  const r = await get("/items/site_settings/1", {});
  report("11 site_settings", r, ["id", "site_name"]);
}

// ---------- 12. languages ----------
{
  const r = await get("/items/languages", { "filter[enabled][_eq]": "true", sort: "sort" });
  report("12 languages 已启用", r, ["code", "name"]);
}

console.log("\n===== 汇总 =====");
for (const [k, v] of Object.entries(results)) {
  console.log(k.padEnd(20), v == null ? "(null)" : "OK");
}
