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
  "category.image": "分类图片：支持大图预览、上传、从媒体库选择、放大查看、替换和清除；兼容历史图片地址",
  "category.sort": "数字越小越靠前",
  "category.status": "仅发布状态会出现在官网",
  "series.matecode": "系列码，发布后不要修改",
  "series.category_id": "所属三级分类",
  "product.order_no": "订货号，全库唯一；发布后不要修改",
  "product.series_id": "所属产品系列",
  "series.image": "系列图片：支持大图预览、上传、从媒体库选择、放大查看、替换和清除",
  "product.status": "仅发布状态会出现在官网",
  "product.title": "型号",
  "product.poles": "极数",
  "product.pitch": "节距",
  "product.combined_title": "组合标题",
  "product.translations": "还没有内容时请点「新建」，中文、英文各一条。每一行会标明这条是「中文 zh」还是「英文 en」。不要把一种语言的文案填进另一种。",
  "product.media_links": "产品图片",
  "media.file_id": "媒体文件",
  "media.kind": "媒体用途，不要手填内部码",
  "media.language": "可留空表示语言无关；需要时只选 en / zh",
  "media.alt": "替代文本",
  "media.caption": "图片说明",
  "media.sort": "显示顺序",
  "media.status": "仅发布状态会出现在官网",
  "product_media.file_id": "图片：支持大图预览、上传、从媒体库选择、放大查看、替换和清除",
  "product_media.product_id": "关联产品",
  "product_media.media_id": "高级：复用媒体库中的已有媒体；普通上传请使用图片字段",
  "product_media.kind": "图片用途",
  "product_media.sort": "显示顺序",
  "product_media.is_primary": "设为主图",
  "news.publish_date": "用于新闻排序和页面展示",
  "news.status": "仅发布状态会出现在官网",
  "news.cover_image": "新闻封面：支持大图预览、上传、从媒体库选择、放大查看、替换和清除",
  "news.translations": "还没有内容时请点「新建」，中文、英文各一条。每一行会标明这条是「中文 zh」还是「英文 en」。语言和 URL 标识都要填，否则列表点不进详情。",
  "category.translations": "还没有内容时请点「新建」，中文、英文各一条。每一行会标明这条是「中文 zh」还是「英文 en」。不要把一种语言的文案填进另一种。",
  "series.translations": "还没有内容时请点「新建」，中文、英文各一条。每一行会标明这条是「中文 zh」还是「英文 en」。不要把一种语言的文案填进另一种。",
  "news_translations.language": "这一条是中文还是英文：只选「中文 zh」或「英文 en」，不要填「中文」两个字",
  "news_translations.slug": "详情页网址后缀，必填。例如 test-111。不填卡片会点回列表且没有报错。",
  "page_sections.page_slug": "选择板块所属页面；服务、方案、关于的已发布板块会在前台展示。",
  "page_sections.parent_id": "上级板块；顶级板块留空。例如「强大的研发能力」的上级是「研发技术能力」。",
  "page_sections.list_title": "用于查找和排序；前台标题请在“中英文内容”中分别填写。",
  "page_sections.sort": "数字越小越靠前",
  "page_sections.status": "仅发布状态会出现在官网",
  "page_sections.image": "各语言共用图。某语言要单独换图，填翻译行里的「本语言图片」。",
  "page_sections.translations": "按语言填写简介、正文和图片。一般保留中文 zh、英文 en 各一条。",
  "site_pages.translations": "同一页面维护中文和英文两条内容；标题、正文、H1 与 SEO 信息都在对应语言记录中。",
  "home_blocks.translations": "点开「中文 zh」或「英文 en」改标题和说明。",
  "home_banner.translations": "点开「中文 zh」或「英文 en」改标题、简介和按钮。不要用 Directus 原生翻译页签。",
  "home_banner.status": "整体发布状态。某一语言不想展示，把该语言翻译设为草稿。",
  "home_banner.link_path": "优先选站内页面。不要手填旧站网址；外部地址选「外部链接」再填网址。",
  "home_banner.image": "各语言共用图。某语言要单独换图，填翻译行里的「本语言图片」。还没有图片时这里为空。",
  "home_banner_translations.language": "语言码固定使用 en / zh，不要填「中文」两个字",
  "home_banner_translations.status": "该语言未完成或不要展示时选草稿。不要用另一语言文案顶上。",
  "home_banner_translations.image": "本语言图片。留空则用 Banner 上的共用图。",
  "page_sections_translations.image": "本语言板块图。留空则用板块上的共用图。",
  "page_sections_translations.intro1": "板块正文。可用标题、列表、链接和图片。",
  "page_sections_translations.intro2": "补充正文，可留空。",
  "page_sections_translations.cta": "按钮文字，例如「查看服务」。没有按钮的板块可留空。",
  "site_pages.cover_image": "各语言共用页头图。某语言要换图，填翻译行里的「本语言封面图」。",
  "site_pages_translations.cover_image": "本语言页头图。留空则用页面上的共用封面。",
  "site_pages_translations.body": "页面正文，前台按富文本展示。可用标题、列表、链接和图片。",
  "page_sections_translations.language": "语言码固定使用 en / zh，不要填「中文」两个字",
  "page_sections_translations.intro": "板块开篇说明，对应旧后台「简介」",
  "page_sections_translations.stat1": "数字或短标签，例如 500",
  "category_translations.language": "这一条是中文还是英文：只选「中文 zh」或「英文 en」，不要填「中文」两个字",
  "category_translations.slug": "URL slug；同一语言下必须唯一",
  "series_translations.language": "这一条是中文还是英文：只选「中文 zh」或「英文 en」，不要填「中文」两个字",
  "series_translations.slug": "URL slug；同一语言下必须唯一",
  "product_translations.language": "这一条是中文还是英文：只选「中文 zh」或「英文 en」，不要填「中文」两个字",
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
  "home_banner.key",
  "home_blocks.key",
  "site_settings.created_at", "site_settings.updated_at",
  "media.created_at", "media.updated_at",
];

const expectedTranslations = {
  "category.level": "层级",
  "category.parent_id": "上级分类",
  "category.image": "分类图片",
  "category.status": "发布状态",
  "category.sort": "显示顺序",
  "category.translations": "多语言内容",
  "series.matecode": "系列码",
  "series.category_id": "所属分类",
  "series.image": "系列图片",
  "series.sort": "显示顺序",
  "series.status": "发布状态",
  "series.translations": "多语言内容",
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
  "media.sort": "显示顺序",
  "media.status": "发布状态",
  "product_media.file_id": "图片",
  "product_media.product_id": "关联产品",
  "product_media.media_id": "媒体",
  "product_media.kind": "图片用途",
  "product_media.sort": "显示顺序",
  "product_media.is_primary": "设为主图",
  "news.cover_image": "封面图",
  "news.publish_date": "发布时间",
  "news.status": "发布状态",
  "news.translations": "多语言内容",
  "news.sort": "显示顺序",
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
  "news_translations.seo_title": "SEO 标题",
  "news_translations.seo_description": "SEO 描述",
  "news_translations.h1": "页面 H1",
  "news_translations.short_description": "摘要",
  "news_translations.description": "正文",
  "page_sections.page_slug": "所属页面",
  "page_sections.parent_id": "上级板块",
  "page_sections.list_title": "后台板块名称",
  "page_sections.sort": "显示顺序",
  "page_sections.status": "状态",
  "page_sections.image": "图片",
  "page_sections.translations": "多语言内容",
  "site_pages.translations": "中英文页面内容与 SEO",
  "site_pages.sections": "服务页板块",
  "home_blocks.translations": "多语言内容",
  "home_banner.translations": "中英文内容",
  "home_banner.status": "状态",
  "home_banner.link_path": "跳转目标",
  "home_banner.image": "共用图片",
  "home_banner.label": "后台备注名",
  "home_banner.sort": "显示顺序",
  "home_banner_translations.language": "语言",
  "home_banner_translations.status": "本语言状态",
  "home_banner_translations.tag": "短标签",
  "home_banner_translations.title": "标题",
  "home_banner_translations.text": "简介",
  "home_banner_translations.cta": "按钮文字",
  "home_banner_translations.image": "本语言图片",
  "page_sections.children": "子板块",
  "page_sections_translations.language": "语言",
  "page_sections_translations.title": "标题",
  "page_sections_translations.intro": "简介",
  "page_sections_translations.stat1": "展示数据 1",
  "page_sections_translations.stat1_label": "数据 1 说明",
  "page_sections_translations.stat2": "展示数据 2",
  "page_sections_translations.stat2_label": "数据 2 说明",
  "page_sections_translations.intro1": "主要正文",
  "page_sections_translations.intro2": "补充正文",
  "page_sections_translations.image": "本语言图片",
  "page_sections_translations.cta": "按钮文字",
  "site_pages_translations.cover_image": "本语言封面图",
  "site_pages_translations.panel_1_image": "本语言图文 1 图片",
  "site_pages_translations.panel_2_image": "本语言图文 2 图片",
  "site_pages_translations.panel_3_image": "本语言图文 3 图片",
  "site_pages_translations.body": "正文",
  "home_blocks.label": "后台备注名",
  "home_blocks.kind": "内容类型",
  "home_blocks.image": "图片",
  "home_blocks.link_path": "跳转目标",
  "home_blocks.sort": "显示顺序",
  "home_blocks.status": "发布状态",
  "social_links.platform": "平台",
  "social_links.label": "显示名称",
  "social_links.url": "链接地址",
  "social_links.sort": "显示顺序",
  "social_links.status": "发布状态",
  "site_settings.site_name": "站点名称",
  "site_settings.site_description": "英文站点描述",
  "site_settings.site_description_zh": "中文站点描述",
  "site_settings.hero_title": "英文 Hero 标题",
  "site_settings.hero_subtitle": "英文 Hero 副标题",
  "site_settings.hero_title_zh": "中文 Hero 标题",
  "site_settings.hero_subtitle_zh": "中文 Hero 副标题",
  "site_settings.footer_text": "英文页脚文字",
  "site_settings.footer_text_zh": "中文页脚文字",
  "site_settings.contact_email": "联系邮箱",
  "site_settings.hero_image": "Hero 图片",
  "site_settings.hero_kicker": "英文 Hero 短标签",
  "site_settings.hero_kicker_zh": "中文 Hero 短标签",
  "site_settings.cta_title": "英文行动标题",
  "site_settings.cta_title_zh": "中文行动标题",
  "site_settings.cta_text": "英文行动说明",
  "site_settings.cta_text_zh": "中文行动说明",
  "site_settings.cta_link": "行动按钮目标",
  "languages.code": "语言码",
  "languages.name": "语言名称",
  "languages.direction": "文字方向",
  "languages.enabled": "启用",
  "languages.sort": "显示顺序",
  "media.product_links": "关联产品",
  "site_pages.slug": "页面类型",
  "site_pages.status": "发布状态",
  "site_pages.sort": "显示顺序",
  "site_pages.cover_image": "共用页头图",
  "site_pages.list_title": "后台页面名称",
  "site_pages.panel_image_1": "共用图文 1 图片",
  "site_pages.panel_image_2": "共用图文 2 图片",
  "site_pages.panel_image_3": "共用图文 3 图片",
  "site_pages.preview_links": "前台预览",
};

const expectedCollectionTranslations = {
  languages: "站点语言",
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
  site_pages: "页面管理（方案 / 服务 / 关于）",
  site_pages_translations: "页面翻译",
  social_links: "社交外链",
  home_blocks: "首页内容块",
  home_blocks_translations: "首页内容块翻译",
  home_banner: "首页 Banner",
  home_banner_translations: "首页 Banner 翻译",
  site_settings: "站点设置",
  page_sections: "页面板块",
  page_sections_translations: "页面板块翻译",
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
  home_banner: { group: "content_management", hidden: false, sort: 6 },
  home_banner_translations: { group: "content_management", hidden: true, sort: 7 },
  home_blocks: { group: "content_management", hidden: false, sort: 8 },
  home_blocks_translations: { group: "content_management", hidden: true, sort: 9 },
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
  "series.image": "product-media-editor",
  "product_media.file_id": "product-media-editor",
  "page_sections.image": "product-media-editor",
  "site_pages.translations": "list-o2m",
  "site_pages.sections": "list-o2m",
  "site_pages.preview_links": "presentation-links",
  "home_blocks.translations": "list-o2m",
  "home_banner.translations": "list-o2m",
  "home_banner.status": "select-dropdown",
  "home_banner.link_path": "select-dropdown",
  "home_banner.image": "product-media-editor",
  "home_banner_translations.language": "select-dropdown",
  "home_banner_translations.status": "select-dropdown",
  "home_banner_translations.image": "product-media-editor",
  "news.translations": "list-o2m",
  "category.translations": "list-o2m",
  "series.translations": "list-o2m",
  "product.translations": "list-o2m",
  "page_sections.translations": "list-o2m",
  "page_sections_translations.image": "product-media-editor",
  "page_sections_translations.intro1": "input-rich-text-html",
  "page_sections_translations.intro2": "input-rich-text-html",
  "site_pages.cover_image": "product-media-editor",
  "site_pages_translations.cover_image": "product-media-editor",
  "site_pages_translations.body": "input-rich-text-html",
  "site_pages_translations.panel_1_image": "product-media-editor",
  "news.cover_image": "product-media-editor",
  "news_translations.language": "select-dropdown",
  "news_translations.slug": "input",
  "news.status": "select-dropdown",
  "category.status": "select-dropdown",
  "series.status": "select-dropdown",
  "product.status": "select-dropdown",
  "media.status": "select-dropdown",
  "category.level": "select-dropdown",
  "media.kind": "select-dropdown",
  "media.language": "select-dropdown",
  "category_translations.language": "select-dropdown",
  "series_translations.language": "select-dropdown",
  "product_translations.language": "select-dropdown",
  "page_sections_translations.language": "select-dropdown",
  "product_media.kind": "select-dropdown",
  "languages.direction": "select-dropdown",
  "languages.enabled": "boolean",
  "category.parent_id": "select-dropdown-m2o",
  "series.category_id": "select-dropdown-m2o",
  "product.series_id": "select-dropdown-m2o",
  "product_media.product_id": "select-dropdown-m2o",
  "product.product_technical_group": "group-accordion",
  "product.product_certification_group": "group-accordion",
  "product.product_document_group": "group-accordion",
  "product.product_relation_group": "group-accordion",
  "product_spec.kind": "select-dropdown",
  "product_spec.status": "select-dropdown",
  "product_spec_translations.language": "select-dropdown",
  "product_certification.status": "select-dropdown",
  "product_certification_row.language": "select-dropdown",
  "product_document.kind": "select-dropdown",
  "product_document.status": "select-dropdown",
  "product_document.language": "select-dropdown",
  "product_relation.kind": "select-dropdown",
  "product_relation.status": "select-dropdown",
  "product_relation.target_product_id": "select-dropdown-m2o",
  "product_relation.target_series_id": "select-dropdown-m2o",
  "product_document.file_id": "file",
  "product_certification.logo_file_id": "product-media-editor",
  "page_sections.parent_id": "select-dropdown-m2o",
  "page_sections.site_page_id": "select-dropdown-m2o",
})) {
  const [collection, field] = key.split(".");
  const payload = await get(`/fields/${collection}/${field}`);
  if (payload.data?.meta?.interface !== interfaceName) failures.push(`${key}.interface`);
}
for (const key of ["category.translations", "series.translations", "product.translations", "news.translations"]) {
  const [collection, field] = key.split(".");
  const payload = await get(`/fields/${collection}/${field}`);
  const options = payload.data?.meta?.options ?? {};
  if (!String(options.template || "").includes("{{language}}")) failures.push(`${key}.template`);
  if (options.enableSelect !== false) failures.push(`${key}.enableSelect`);
}
for (const key of ['site_pages.slug', 'site_pages.status', 'page_sections.page_slug', 'page_sections.status']) {
  const [collection, field] = key.split('.');
  const payload = await get(`/fields/${collection}/${field}`);
  if (payload.data?.meta?.display !== 'labels') failures.push(`${key}.display`);
  if (payload.data?.meta?.display_options?.format !== false ||
      !payload.data?.meta?.display_options?.choices?.some((choice) => /[\u4e00-\u9fff]/.test(choice.text))) {
    failures.push(`${key}.display_options`);
  }
}
if ((await get("/fields/product_media/media_id")).data?.meta?.hidden !== true) {
  failures.push("product_media.media_id.hidden");
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

const thumbnailFields = [
  "category.image",
  "series.image",
  "product_media.file_id",
  "news.cover_image",
  "page_sections.image",
  "page_sections_translations.image",
  "site_pages.cover_image",
  "site_pages.panel_image_1",
  "site_pages.panel_image_2",
  "site_pages.panel_image_3",
  "site_pages_translations.cover_image",
  "site_pages_translations.panel_1_image",
  "site_pages_translations.panel_2_image",
  "site_pages_translations.panel_3_image",
  "home_banner.image",
  "home_banner_translations.image",
  "home_blocks.image",
  "site_settings.hero_image",
  "media.file_id",
  "product_certification.logo_file_id",
];
for (const key of thumbnailFields) {
  const [collection, field] = key.split(".");
  const payload = await get(`/fields/${collection}/${field}`);
  if (payload.data?.meta?.display !== "product-media-thumbnail") failures.push(`${key}.display`);
}

const visibleCollections = [
  "category", "series", "news", "site_settings", "social_links",
  "home_blocks", "home_banner", "languages", "site_pages", "page_sections", "media", "product",
];
for (const collection of visibleCollections) {
  const payload = await get(`/fields/${collection}`);
  for (const field of payload.data ?? []) {
    if (field.meta?.hidden) continue;
    if (["id", "user_created", "user_updated", "date_created", "date_updated"].includes(field.field)) continue;
    const translations = field.meta?.translations ?? [];
    if (!translations.some((item) => item.language === "zh-CN" && /[\u4e00-\u9fff]/.test(item.translation || ""))) {
      failures.push(`${collection}.${field.field}.zh`);
    }
  }
}

if (failures.length) {
  console.error(`FAIL ${failures.length}: ${failures.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`PASS ${expectedChecks}`);
}
