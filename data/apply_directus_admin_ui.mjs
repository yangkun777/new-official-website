import { readFileSync } from "node:fs";

const BASE = process.env.DIRECTUS_URL ?? "http://localhost:8055";
const tokenPath = process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? "D:/degson-pilot/.admin_token";
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN ?? readFileSync(tokenPath, "utf8").trim();
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

async function patchField(collection, field, meta) {
  const response = await fetch(`${BASE}/fields/${collection}/${field}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ meta }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PATCH ${collection}.${field} failed: ${response.status} ${body}`);
  }
}

async function patchCollection(collection, meta) {
  const response = await fetch(`${BASE}/collections/${collection}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ meta }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PATCH collection ${collection} failed: ${response.status} ${body}`);
  }
}

async function ensureCollectionGroup(collection, translation, sort) {
  const response = await fetch(`${BASE}/collections/${collection}`, { headers });
  if (response.ok) return;
  if (response.status !== 403 && response.status !== 404) {
    const body = await response.text();
    throw new Error(`GET collection ${collection} failed: ${response.status} ${body}`);
  }

  const createResponse = await fetch(`${BASE}/collections`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      collection,
      meta: {
        icon: "folder",
        hidden: false,
        sort,
        translations: [{ language: "zh-CN", translation }],
      },
      schema: null,
    }),
  });
  if (!createResponse.ok) {
    const body = await createResponse.text();
    throw new Error(`POST collection group ${collection} failed: ${createResponse.status} ${body}`);
  }
}

const mediaEditorMeta = {
  "category.image": {
    interface: "product-media-editor",
    note: "分类图片：支持大图预览、上传、替换和清除；兼容历史图片地址",
    width: "full",
  },
  "product_media.file_id": {
    interface: "product-media-editor",
    note: "图片：支持大图预览、上传、替换和清除",
    width: "full",
  },
  "page_sections.image": {
    interface: "product-media-editor",
    note: "建议约 498×280。可上传或粘贴地址；空则前台不显示该图",
    width: "full",
  },
  "page_sections.translations": {
    interface: "list-o2m",
    special: ["o2m"],
    options: {
      enableCreate: true,
      enableSelect: false,
      template: "{{language}} · {{title}}",
    },
    note: "按语言填写简介、数据和介绍。一般保留中文 zh、英文 en 各一条。",
  },
  "product_media.media_id": {
    hidden: true,
    note: "高级：复用媒体库中的已有媒体；普通上传请使用图片字段",
  },
  "product_media.kind": {
    interface: "select-dropdown",
    options: {
      choices: [
        { text: "主图", value: "product_main" },
        { text: "详情图", value: "product_detail" },
        { text: "工程图", value: "product_diagram" },
      ],
    },
  },
  "product_media.sort": { width: "half" },
  "product_media.is_primary": { interface: "boolean", width: "half" },
};

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

const menuGroups = {
  product_management: { translation: "产品管理", sort: 1 },
  content_management: { translation: "内容管理", sort: 2 },
  site_configuration: { translation: "站点配置", sort: 3 },
};

const collectionMenuMeta = {
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
  site_pages: { group: "content_management", hidden: false, sort: 3, icon: "web" },
  site_pages_translations: { group: "content_management", hidden: true, sort: 4 },
  page_sections: { group: "content_management", hidden: false, sort: 5, icon: "account_tree" },
  page_sections_translations: { group: "content_management", hidden: true, sort: 6 },
  home_blocks: { group: "content_management", hidden: false, sort: 7, icon: "dashboard" },
  home_blocks_translations: { group: "content_management", hidden: true, sort: 8 },
  site_settings: { group: "site_configuration", hidden: false, sort: 1 },
  languages: { group: "site_configuration", hidden: false, sort: 2 },
  social_links: { group: "site_configuration", hidden: false, sort: 3, icon: "share" },
};

for (const [collection, { translation, sort }] of Object.entries(menuGroups)) {
  await ensureCollectionGroup(collection, translation, sort);
  await patchCollection(collection, {
    group: null,
    hidden: false,
    sort,
    icon: "folder",
    translations: [{ language: "zh-CN", translation }],
  });
}
for (const [collection, meta] of Object.entries(collectionMenuMeta)) {
  await patchCollection(collection, meta);
}

for (const [key, note] of Object.entries(expectedNotes)) {
  const [collection, field] = key.split(".");
  await patchField(collection, field, { note });
}
for (const key of hiddenFields) {
  const [collection, field] = key.split(".");
  await patchField(collection, field, { hidden: true });
}
for (const [key, translation] of Object.entries(expectedTranslations)) {
  const [collection, field] = key.split(".");
  await patchField(collection, field, { translations: [{ language: "zh-CN", translation }] });
}
for (const [key, meta] of Object.entries(mediaEditorMeta)) {
  const [collection, field] = key.split(".");
  await patchField(collection, field, meta);
}
for (const [collection, translation] of Object.entries(expectedCollectionTranslations)) {
  await patchCollection(collection, { translations: [{ language: "zh-CN", translation }] });
}

console.log(`UPDATED ${Object.keys(expectedNotes).length + hiddenFields.length + Object.keys(expectedTranslations).length + Object.keys(expectedCollectionTranslations).length + Object.keys(mediaEditorMeta).length + Object.keys(menuGroups).length + Object.keys(collectionMenuMeta).length}`);
