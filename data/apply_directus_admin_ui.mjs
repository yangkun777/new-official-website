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
};

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

console.log(`UPDATED ${Object.keys(expectedNotes).length + hiddenFields.length + Object.keys(expectedTranslations).length + Object.keys(expectedCollectionTranslations).length + Object.keys(mediaEditorMeta).length}`);
