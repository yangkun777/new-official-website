import { readFileSync } from "node:fs";

const BASE = process.env.DIRECTUS_URL ?? "http://localhost:8055";
const tokenPath = process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? "D:/degson-pilot/.admin_token";
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN ?? readFileSync(tokenPath, "utf8").trim();
const headers = { Authorization: `Bearer ${TOKEN}` };

async function get(path) {
  const response = await fetch(`${BASE}${path}`, { headers });
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`);
  return response.json();
}

async function getOptionalCollection(collection) {
  const response = await fetch(`${BASE}/collections/${collection}`, { headers });
  if (response.status === 403 || response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GET /collections/${collection} failed: ${response.status}`);
  }
  return response.json();
}

const expectedNotes = {
  "category.level": "层级：1 一级、2 二级、3 三级",
  "category.parent_id": "上级分类；一级分类留空",
  "category.image": "分类图片：支持大图预览、上传、替换和清除；兼容历史图片地址",
  "category.sort": "数字越小越靠前",
  "category.status": "仅发布状态会出现在官网",
  "series.matecode": "系列码，发布后不要修改",
  "series.category_id": "所属三级分类",
  "product.order_no": "订货号，全库唯一；发布后不要修改",
  "product.series_id": "所属产品系列",
  "product.status": "仅发布状态会出现在官网",
  "product.title": "型号",
  "product.poles": "极数",
  "product.pitch": "节距",
  "product.combined_title": "组合标题",
  "product.translations": "多语言内容",
  "product.media_links": "产品图片",
  "media.file_id": "媒体文件",
  "media.kind": "媒体用途",
  "media.language": "媒体语言",
  "media.alt": "替代文本",
  "media.caption": "图片说明",
  "media.sort": "排序",
  "media.status": "发布状态",
  "product_media.file_id": "图片：支持大图预览、上传、替换和清除",
  "product_media.product_id": "关联产品",
  "product_media.media_id": "高级：复用媒体库中的已有媒体；普通上传请使用图片字段",
  "product_media.kind": "图片用途",
  "product_media.sort": "显示顺序",
  "product_media.is_primary": "设为主图",
  "news.publish_date": "用于新闻排序和页面展示",
  "news.status": "仅发布状态会出现在官网",
  "page_sections.page_slug": "目前前台只渲染「服务」。方案/关于可先建板块，暂不展示。",
  "page_sections.parent_id": "上级板块；顶级板块留空。例如「强大的研发能力」的上级是「研发技术能力」。",
  "page_sections.list_title": "后台列表和左边层级显示用，不直接当 H1。",
  "page_sections.sort": "数字越小越靠前",
  "page_sections.status": "仅发布状态会出现在官网",
  "page_sections.image": "建议约 498×280。可上传或粘贴地址；空则前台不显示该图",
  "page_sections.translations": "按语言填写简介、数据和介绍。一般保留中文 zh、英文 en 各一条。",
  "page_sections_translations.language": "语言码固定使用 en / zh",
  "page_sections_translations.intro": "板块开篇说明，对应旧后台「简介」",
  "page_sections_translations.stat1": "数字或短标签，例如 500",
  "category_translations.language": "语言码固定使用 en / zh",
  "category_translations.slug": "URL slug；同一语言下必须唯一",
  "series_translations.language": "语言码固定使用 en / zh",
  "series_translations.slug": "URL slug；同一语言下必须唯一",
  "product_translations.language": "语言码固定使用 en / zh",
  "news_translations.language": "语言码固定使用 en / zh",
  "news_translations.slug": "URL slug；同一语言下必须唯一",
};

const hiddenFields = [
  "category.created_at", "category.updated_at",
  "category_translations.created_at", "category_translations.updated_at",
  "series.created_at", "series.updated_at",
  "series_translations.created_at", "series_translations.updated_at",
  "product.created_at", "product.updated_at",
  "product_translations.created_at", "product_translations.updated_at",
  "news.created_at", "news.updated_at",
  "news_translations.created_at", "news_translations.updated_at",
  "page_sections.code",
];

const expectedTranslations = {
  "category.level": "层级",
  "category.parent_id": "上级分类",
  "category.image": "分类图片",
  "category.status": "发布状态",
  "series.matecode": "系列码",
  "series.category_id": "所属分类",
  "product.order_no": "订货号",
  "product.series_id": "所属系列",
  "product.status": "发布状态",
  "product.title": "型号",
  "product.poles": "极数",
  "product.pitch": "节距",
  "product.combined_title": "组合标题",
  "product.translations": "多语言内容",
  "product.media_links": "产品图片",
  "media.file_id": "媒体文件",
  "media.kind": "媒体用途",
  "media.language": "媒体语言",
  "media.alt": "替代文本",
  "media.caption": "图片说明",
  "media.sort": "排序",
  "media.status": "发布状态",
  "product_media.file_id": "图片",
  "product_media.product_id": "关联产品",
  "product_media.media_id": "媒体",
  "product_media.kind": "图片用途",
  "product_media.sort": "显示顺序",
  "product_media.is_primary": "设为主图",
  "news.publish_date": "发布时间",
  "news.status": "发布状态",
  "category_translations.language": "语言",
  "category_translations.name": "分类名称",
  "category_translations.slug": "URL 标识",
  "series_translations.language": "语言",
  "series_translations.name": "系列名称",
  "product_translations.language": "语言",
  "product_translations.name": "产品名称",
  "news_translations.language": "语言",
  "news_translations.name": "新闻标题",
  "news_translations.slug": "URL 标识",
  "page_sections.page_slug": "所属页面",
  "page_sections.parent_id": "上级板块",
  "page_sections.list_title": "后台显示名",
  "page_sections.sort": "显示顺序",
  "page_sections.status": "状态",
  "page_sections.image": "图片",
  "page_sections.translations": "多语言内容",
  "page_sections.children": "子板块",
  "page_sections_translations.language": "语言",
  "page_sections_translations.title": "标题",
  "page_sections_translations.intro": "简介",
  "page_sections_translations.stat1": "数据 1",
  "page_sections_translations.stat1_label": "数据 1 介绍",
  "page_sections_translations.stat2": "数据 2",
  "page_sections_translations.stat2_label": "数据 2 介绍",
  "page_sections_translations.intro1": "介绍 1",
  "page_sections_translations.intro2": "介绍 2",
};

const expectedCollectionTranslations = {
  category: "产品分类",
  category_translations: "分类翻译",
  series: "产品系列",
  series_translations: "系列翻译",
  product: "产品",
  product_translations: "产品翻译",
  news: "新闻",
  news_translations: "新闻翻译",
  media: "媒体",
  product_media: "产品媒体关联",
  site_pages: "方案 / 服务 / 关于",
  site_pages_translations: "方案页翻译",
  social_links: "社交外链",
  home_blocks: "首页内容块",
  home_blocks_translations: "首页内容块翻译",
  page_sections: "服务板块",
  page_sections_translations: "服务板块翻译",
};

const expectedMenuGroups = {
  product_management: { translation: "产品管理", sort: 1 },
  content_management: { translation: "内容管理", sort: 2 },
  site_configuration: { translation: "站点配置", sort: 3 },
};

const expectedCollectionMenu = {
  category: { group: "product_management", hidden: false, sort: 1 },
  series: { group: "product_management", hidden: false, sort: 2 },
  product: { group: "product_management", hidden: false, sort: 3 },
  media: { group: "product_management", hidden: false, sort: 4 },
  product_media: { group: "product_management", hidden: true, sort: 5 },
  category_translations: { group: "product_management", hidden: true, sort: 6 },
  series_translations: { group: "product_management", hidden: true, sort: 7 },
  product_translations: { group: "product_management", hidden: true, sort: 8 },
  news: { group: "content_management", hidden: false, sort: 1 },
  news_translations: { group: "content_management", hidden: true, sort: 2 },
  site_pages: { group: "content_management", hidden: false, sort: 3 },
  site_pages_translations: { group: "content_management", hidden: true, sort: 4 },
  page_sections: { group: "content_management", hidden: false, sort: 5 },
  page_sections_translations: { group: "content_management", hidden: true, sort: 6 },
  home_blocks: { group: "content_management", hidden: false, sort: 7 },
  home_blocks_translations: { group: "content_management", hidden: true, sort: 8 },
  site_settings: { group: "site_configuration", hidden: false, sort: 1 },
  languages: { group: "site_configuration", hidden: false, sort: 2 },
  social_links: { group: "site_configuration", hidden: false, sort: 3 },
};

const expectedChecks = Object.keys(expectedNotes).length
  + hiddenFields.length
  + Object.keys(expectedTranslations).length
  + Object.keys(expectedCollectionTranslations).length
  + Object.keys(expectedMenuGroups).length
  + Object.keys(expectedCollectionMenu).length;

const failures = [];
for (const [key, note] of Object.entries(expectedNotes)) {
  const [collection, field] = key.split(".");
  const payload = await get(`/fields/${collection}/${field}`);
  if (payload.data?.meta?.note !== note) failures.push(`${key}.note`);
}
for (const key of hiddenFields) {
  const [collection, field] = key.split(".");
  const payload = await get(`/fields/${collection}/${field}`);
  if (payload.data?.meta?.hidden !== true) failures.push(`${key}.hidden`);
}
for (const [key, translation] of Object.entries(expectedTranslations)) {
  const [collection, field] = key.split(".");
  const payload = await get(`/fields/${collection}/${field}`);
  const translations = payload.data?.meta?.translations ?? [];
  if (!translations.some((item) => item.language === "zh-CN" && item.translation === translation)) {
    failures.push(`${key}.translation`);
  }
}

for (const [key, interfaceName] of Object.entries({
  "media.file_id": "file",
  "category.image": "product-media-editor",
  "product_media.file_id": "product-media-editor",
  "page_sections.image": "product-media-editor",
})) {
  const [collection, field] = key.split(".");
  const payload = await get(`/fields/${collection}/${field}`);
  if (payload.data?.meta?.interface !== interfaceName) failures.push(`${key}.interface`);
}
if ((await get("/fields/product_media/media_id")).data?.meta?.hidden !== true) {
  failures.push("product_media.media_id.hidden");
}
if ((await get("/fields/product_media/kind")).data?.meta?.interface !== "select-dropdown") {
  failures.push("product_media.kind.interface");
}
for (const [collection, translation] of Object.entries(expectedCollectionTranslations)) {
  const payload = await get(`/collections/${collection}`);
  const translations = payload.data?.meta?.translations ?? [];
  if (!translations.some((item) => item.language === "zh-CN" && item.translation === translation)) {
    failures.push(`${collection}.translation`);
  }
}

for (const [collection, expected] of Object.entries(expectedMenuGroups)) {
  const payload = await getOptionalCollection(collection);
  if (!payload) {
    failures.push(`${collection}.missing`);
    continue;
  }
  const meta = payload.data?.meta;
  const translations = meta?.translations ?? [];
  if (payload.data?.schema !== null) failures.push(`${collection}.schema`);
  if (meta?.group !== null) failures.push(`${collection}.group`);
  if (meta?.hidden !== false) failures.push(`${collection}.hidden`);
  if (meta?.sort !== expected.sort) failures.push(`${collection}.sort`);
  if (!translations.some((item) =>
    item.language === "zh-CN" && item.translation === expected.translation
  )) {
    failures.push(`${collection}.translation`);
  }
}

for (const [collection, expected] of Object.entries(expectedCollectionMenu)) {
  const payload = await get(`/collections/${collection}`);
  const meta = payload.data?.meta;
  if (meta?.group !== expected.group) failures.push(`${collection}.group`);
  if (meta?.hidden !== expected.hidden) failures.push(`${collection}.hidden`);
  if (meta?.sort !== expected.sort) failures.push(`${collection}.sort`);
}

if (failures.length) {
  console.error(`FAIL ${failures.length}: ${failures.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`PASS ${expectedChecks}`);
}
