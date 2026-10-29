import { readFileSync } from "node:fs";

const BASE = process.env.DIRECTUS_URL ?? "http://localhost:8055";
const tokenPath = process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? "D:/degson-pilot/.admin_token";
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN ?? readFileSync(tokenPath, "utf8").trim();
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

async function api(method, path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, json };
}

const SEO_NOTE_TITLE = "浏览器标题。可留空则前台用页面标题。已写 DEGSON/高松 时前台不再追加；否则自动加「| DEGSON」。";
const SEO_NOTE_DESC = "搜索结果摘要。可留空则前台用简介或标题。";
const SEO_NOTE_H1 = "页面主标题 H1。可留空则前台用名称/标题。";
const SEO_NOTE_KEYWORDS = "关键词，用逗号分隔。可留空。结构化数据（Schema）由前台按页型自动输出，不用在此贴 JSON。";

const SEO_META = {
  seo_title: {
    interface: "input",
    note: SEO_NOTE_TITLE,
    translations: [{ language: "zh-CN", translation: "SEO 标题" }],
  },
  seo_description: {
    interface: "input-multiline",
    note: SEO_NOTE_DESC,
    translations: [{ language: "zh-CN", translation: "SEO 描述" }],
  },
  h1: {
    interface: "input",
    note: SEO_NOTE_H1,
    translations: [{ language: "zh-CN", translation: "页面 H1" }],
  },
  seo_keywords: {
    interface: "input",
    note: SEO_NOTE_KEYWORDS,
    translations: [{ language: "zh-CN", translation: "SEO 关键词" }],
  },
};

async function ensureField(collection, field, type, schema, meta) {
  const exists = await api("GET", `/fields/${collection}/${field}`);
  if (exists.status === 200) {
    await api("PATCH", `/fields/${collection}/${field}`, { meta });
    return;
  }
  const created = await api("POST", `/fields/${collection}`, {
    field,
    type,
    schema: { is_nullable: true, ...schema },
    meta,
  });
  if (created.status < 200 || created.status >= 300) {
    throw new Error(
      `POST ${collection}.${field} ${created.status} ${JSON.stringify(created.json).slice(0, 300)}`
    );
  }
  console.log(`+ ${collection}.${field}`);
}

const translationTables = [
  "category_translations",
  "series_translations",
  "product_translations",
  "news_translations",
];

for (const collection of translationTables) {
  await ensureField(collection, "seo_title", "string", { max_length: 255 }, SEO_META.seo_title);
  await ensureField(collection, "seo_description", "text", {}, SEO_META.seo_description);
  await ensureField(collection, "h1", "string", { max_length: 255 }, SEO_META.h1);
  await ensureField(collection, "seo_keywords", "string", { max_length: 255 }, SEO_META.seo_keywords);
}

await ensureField("site_pages_translations", "seo_title", "string", { max_length: 255 }, SEO_META.seo_title);
await ensureField("site_pages_translations", "seo_description", "text", {}, SEO_META.seo_description);
await ensureField("site_pages_translations", "h1", "string", { max_length: 255 }, SEO_META.h1);
await ensureField(
  "site_pages_translations",
  "seo_keywords",
  "string",
  { max_length: 255 },
  SEO_META.seo_keywords
);

await api("PATCH", "/fields/site_pages/slug", {
  meta: {
    interface: "select-dropdown",
    required: true,
    options: {
      choices: [
        { text: "首页（/）", value: "home" },
        { text: "新闻列表（/news）", value: "news" },
        { text: "行业解决方案（/solutions）", value: "solutions" },
        { text: "服务（/services）", value: "services" },
        { text: "关于我们（/about）", value: "about" },
      ],
    },
    note: "对应前台路径。首页和新闻列表只配 SEO/H1，正文仍用各自模块。",
    translations: [{ language: "zh-CN", translation: "对应前台页面" }],
  },
});

const LIST_PAGES = [
  {
    slug: "home",
    sort: 0,
    list_title: "首页 SEO",
    en: {
      title: "DEGSON",
      h1: "Connect with confidence",
      seo_title: "DEGSON | Industrial Connectivity",
      seo_description:
        "DEGSON industrial connection solutions — terminal blocks and connectors.",
      seo_keywords: "DEGSON,terminal blocks,connectors",
    },
    zh: {
      title: "高松 DEGSON",
      h1: "以可靠连接赢得信赖",
      seo_title: "高松 DEGSON | 工业连接",
      seo_description: "高松工业连接解决方案，包括接线端子、连接器和工业组件。",
      seo_keywords: "高松,DEGSON,接线端子,连接器",
    },
  },
  {
    slug: "news",
    sort: 4,
    list_title: "新闻列表 SEO",
    en: {
      title: "News",
      h1: "News",
      seo_title: "News | DEGSON",
      seo_description: "Latest updates and product news from DEGSON.",
      seo_keywords: "DEGSON,news",
    },
    zh: {
      title: "新闻动态",
      h1: "新闻动态",
      seo_title: "新闻动态 | 高松 DEGSON",
      seo_description: "高松最新动态与产品资讯。",
      seo_keywords: "高松,新闻",
    },
  },
];

for (const page of LIST_PAGES) {
  const found = await api(
    "GET",
    `/items/site_pages?filter[slug][_eq]=${page.slug}&fields=id,translations.id,translations.language&limit=1`
  );
  let id = found.json?.data?.[0]?.id;
  if (!id) {
    const created = await api("POST", "/items/site_pages", {
      slug: page.slug,
      status: "published",
      sort: page.sort,
    });
    id = created.json?.data?.id;
    if (!id) throw new Error(`create site_pages ${page.slug} failed`);
    console.log(`+ site_pages ${page.slug}`);
  }
  const existing = found.json?.data?.[0]?.translations ?? [];
  for (const language of ["en", "zh"]) {
    const row = page[language];
    const payload = {
      language,
      site_pages_id: id,
      title: row.title,
      h1: row.h1,
      seo_title: row.seo_title,
      seo_description: row.seo_description,
      seo_keywords: row.seo_keywords,
    };
    const tid = existing.find((item) => item.language === language)?.id;
    if (tid) {
      await api("PATCH", `/items/site_pages_translations/${tid}`, payload);
    } else {
      await api("POST", "/items/site_pages_translations", payload);
    }
  }
}

console.log("UPDATED seo fields");
