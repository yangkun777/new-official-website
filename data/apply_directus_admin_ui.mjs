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
    note: "分类图片：支持大图预览、上传、从媒体库选择、放大查看、替换和清除；兼容历史图片地址",
    width: "full",
  },
  "product_media.file_id": {
    interface: "product-media-editor",
    note: "图片：支持大图预览、上传、从媒体库选择、放大查看、替换和清除",
    width: "full",
  },
  "page_sections.image": {
    interface: "product-media-editor",
    note: "各语言共用图。某语言要单独换图，填翻译行里的「本语言图片」。",
    width: "full",
  },
  "page_sections_translations.image": {
    interface: "product-media-editor",
    note: "本语言板块图。留空则用板块上的共用图。",
    width: "full",
  },
  "site_pages.cover_image": {
    interface: "product-media-editor",
    note: "各语言共用页头图。某语言要换图，填翻译行里的「本语言封面图」。",
    width: "full",
  },
  "site_pages_translations.cover_image": {
    interface: "product-media-editor",
    note: "本语言页头图。留空则用页面上的共用封面。",
    width: "full",
  },
  "site_pages_translations.panel_1_image": {
    interface: "product-media-editor",
    note: "本语言图文卡图片。留空则用页面上对应的共用图。",
    width: "full",
  },
  "site_pages_translations.panel_2_image": {
    interface: "product-media-editor",
    note: "本语言图文卡图片。留空则用页面上对应的共用图。",
    width: "full",
  },
  "site_pages_translations.panel_3_image": {
    interface: "product-media-editor",
    note: "本语言图文卡图片。留空则用页面上对应的共用图。",
    width: "full",
  },
  "site_pages.panel_image_1": {
    interface: "product-media-editor",
    note: "图文板块共用图。某语言要换图，填翻译行对应图片。",
    width: "full",
  },
  "site_pages.panel_image_2": {
    interface: "product-media-editor",
    note: "图文板块共用图。某语言要换图，填翻译行对应图片。",
    width: "full",
  },
  "site_pages.panel_image_3": {
    interface: "product-media-editor",
    note: "图文板块共用图。某语言要换图，填翻译行对应图片。",
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
    note: "按语言填写简介、正文和图片。一般保留中文 zh、英文 en 各一条。",
  },
  "site_pages.translations": {
    interface: "list-o2m",
    special: ["o2m"],
    options: {
      enableCreate: true,
      enableSelect: false,
      template: "{{language}} · {{title}}",
    },
    note: "点开「中文 zh」或「英文 en」改标题、正文和本语言图片。不要用 Directus 原生翻译页签。",
  },
  "home_blocks.translations": {
    interface: "list-o2m",
    special: ["o2m"],
    options: {
      enableCreate: true,
      enableSelect: false,
      template: "{{language}} · {{title}}",
    },
    note: "点开「中文 zh」或「英文 en」改标题和说明。",
  },
  "home_banner.image": {
    interface: "product-media-editor",
    note: "各语言共用图。某语言要单独换图，填翻译行里的「本语言图片」。还没有图片时这里为空。",
    width: "full",
  },
  "home_banner_translations.image": {
    interface: "product-media-editor",
    note: "本语言图片。留空则用 Banner 上的共用图。",
    width: "full",
  },
  "home_blocks.image": {
    interface: "product-media-editor",
    note: "首页内容块图片：支持大图预览、上传、从媒体库选择、放大查看、替换和清除",
    width: "full",
  },
  "site_settings.hero_image": {
    interface: "product-media-editor",
    note: "站点 Hero 图片：支持大图预览、上传、从媒体库选择、放大查看、替换和清除",
    width: "full",
  },
  "home_banner.translations": {
    interface: "list-o2m",
    special: ["o2m"],
    options: {
      enableCreate: true,
      enableSelect: false,
      template: "{{language}} · {{title}}",
    },
    note: "点开「中文 zh」或「英文 en」改标题、简介和按钮。不要用 Directus 原生翻译页签。",
  },
  "home_banner.status": {
    interface: "select-dropdown",
    options: {
      choices: [
        { text: "已发布", value: "published" },
        { text: "草稿", value: "draft" },
      ],
    },
    display: "labels",
    display_options: {
      format: false,
      choices: [
        { text: "已发布", value: "published" },
        { text: "草稿", value: "draft" },
      ],
    },
    note: "整体发布状态。某一语言不想展示，把该语言翻译设为草稿。",
    width: "half",
  },
  "home_banner.link_path": {
    interface: "select-dropdown",
    options: {
      choices: [
        { text: "圆形连接器分类", value: "/product/category/circular-connectors" },
        { text: "接线端子分类", value: "/product/category/terminal-blocks" },
        { text: "产品中心", value: "/products" },
        { text: "行业解决方案", value: "/solutions" },
        { text: "服务与支持", value: "/services" },
        { text: "关于我们", value: "/about" },
        { text: "新闻", value: "/news" },
        { text: "外部链接（填下方网址）", value: "external" },
      ],
    },
    display: "labels",
    display_options: {
      format: false,
      choices: [
        { text: "圆形连接器分类", value: "/product/category/circular-connectors" },
        { text: "接线端子分类", value: "/product/category/terminal-blocks" },
        { text: "产品中心", value: "/products" },
        { text: "行业解决方案", value: "/solutions" },
        { text: "服务与支持", value: "/services" },
        { text: "关于我们", value: "/about" },
        { text: "新闻", value: "/news" },
        { text: "外部链接（填下方网址）", value: "external" },
      ],
    },
    required: true,
    width: "half",
    note: "优先选站内页面。不要手填旧站网址；外部地址选「外部链接」再填网址。",
  },
  "home_banner_translations.language": {
    interface: "select-dropdown",
    options: { choices: [
      { text: "英文 en", value: "en" },
      { text: "中文 zh", value: "zh" },
    ] },
    required: true,
    width: "half",
    note: "语言码固定使用 en / zh，不要填「中文」两个字",
  },
  "home_banner_translations.status": {
    interface: "select-dropdown",
    options: {
      choices: [
        { text: "已发布", value: "published" },
        { text: "草稿", value: "draft" },
      ],
    },
    width: "half",
    note: "该语言未完成或不要展示时选草稿。不要用另一语言文案顶上。",
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
  "news.cover_image": {
    interface: "product-media-editor",
    note: "新闻封面：支持大图预览、上传、从媒体库选择、放大查看、替换和清除",
    width: "full",
  },
  "news.status": {
    interface: "select-dropdown",
    options: {
      choices: [
        { text: "已发布", value: "published" },
        { text: "草稿", value: "draft" },
      ],
    },
    note: "仅发布状态会出现在官网",
    width: "half",
  },
  "news.sort": { width: "half" },
  "news.publish_date": {
    interface: "datetime",
    options: { includeSeconds: false },
    note: "用于新闻排序和页面展示",
    width: "half",
  },
  "news.translations": {
    interface: "list-o2m",
    special: ["o2m"],
    options: {
      enableCreate: true,
      enableSelect: false,
      template: "{{language}} · {{name}}",
    },
    display: "related-values",
    display_options: { template: "{{language}} · {{name}}" },
    note: "还没有内容时请点「新建」，中文、英文各一条。每一行会标明这条是「中文 zh」还是「英文 en」。语言和 URL 标识都要填，否则列表点不进详情。",
  },
  "category.translations": {
    interface: "list-o2m",
    special: ["o2m"],
    options: {
      enableCreate: true,
      enableSelect: false,
      template: "{{language}} · {{name}}",
    },
    display: "related-values",
    display_options: { template: "{{language}} · {{name}}" },
    note: "还没有内容时请点「新建」，中文、英文各一条。每一行会标明这条是「中文 zh」还是「英文 en」。不要把一种语言的文案填进另一种。",
  },
  "series.translations": {
    interface: "list-o2m",
    special: ["o2m"],
    options: {
      enableCreate: true,
      enableSelect: false,
      template: "{{language}} · {{name}}",
    },
    display: "related-values",
    display_options: { template: "{{language}} · {{name}}" },
    note: "还没有内容时请点「新建」，中文、英文各一条。每一行会标明这条是「中文 zh」还是「英文 en」。不要把一种语言的文案填进另一种。",
  },
  "product.translations": {
    interface: "list-o2m",
    special: ["o2m"],
    options: {
      enableCreate: true,
      enableSelect: false,
      template: "{{language}} · {{name}}",
    },
    display: "related-values",
    display_options: { template: "{{language}} · {{name}}" },
    note: "还没有内容时请点「新建」，中文、英文各一条。每一行会标明这条是「中文 zh」还是「英文 en」。不要把一种语言的文案填进另一种。",
  },
  "news_translations.slug": {
    interface: "input",
    options: { trim: true },
    required: true,
    width: "half",
    note: "详情页网址后缀，必填。例如 test-111。不填卡片会点回列表且没有报错。",
  },
  "news_translations.language": {
    interface: "select-dropdown",
    options: { choices: [
      { text: "英文 en", value: "en" },
      { text: "中文 zh", value: "zh" },
    ] },
    display: "labels",
    display_options: { format: false, choices: [
      { text: "英文 en", value: "en" },
      { text: "中文 zh", value: "zh" },
    ] },
    required: true,
    width: "half",
    note: "这一条是中文还是英文：只选「中文 zh」或「英文 en」，不要填「中文」两个字",
  },
  "category.status": {
    interface: "select-dropdown",
    options: { choices: [
      { text: "已发布", value: "published" },
      { text: "草稿", value: "draft" },
    ] },
    note: "仅发布状态会出现在官网",
    width: "half",
  },
  "series.status": {
    interface: "select-dropdown",
    options: { choices: [
      { text: "已发布", value: "published" },
      { text: "草稿", value: "draft" },
    ] },
    note: "仅发布状态会出现在官网",
    width: "half",
  },
  "product.status": {
    interface: "select-dropdown",
    options: { choices: [
      { text: "已发布", value: "published" },
      { text: "草稿", value: "draft" },
    ] },
    note: "仅发布状态会出现在官网",
    width: "half",
  },
  "media.status": {
    interface: "select-dropdown",
    options: { choices: [
      { text: "已发布", value: "published" },
      { text: "草稿", value: "draft" },
    ] },
    note: "仅发布状态会出现在官网",
    width: "half",
  },
  "category.level": {
    interface: "select-dropdown",
    options: { choices: [
      { text: "一级", value: 1 },
      { text: "二级", value: 2 },
      { text: "三级", value: 3 },
    ] },
    note: "层级：1 一级、2 二级、3 三级",
    width: "half",
  },
  "category.parent_id": {
    interface: "select-dropdown-m2o",
    display: "related-values",
    display_options: { template: "{{translations.name}}" },
    special: ["m2o"],
    note: "上级分类；一级分类留空",
  },
  "series.category_id": {
    interface: "select-dropdown-m2o",
    display: "related-values",
    display_options: { template: "{{translations.name}}" },
    special: ["m2o"],
    note: "所属三级分类",
  },
  "series.image": {
    interface: "product-media-editor",
    note: "系列图片：支持大图预览、上传、从媒体库选择、放大查看、替换和清除",
    width: "full",
  },
  "product.series_id": {
    interface: "select-dropdown-m2o",
    display: "related-values",
    display_options: { template: "{{matecode}}" },
    special: ["m2o"],
    note: "所属产品系列",
  },
  "product_media.product_id": {
    interface: "select-dropdown-m2o",
    display: "related-values",
    display_options: { template: "{{order_no}}" },
    special: ["m2o"],
  },
  "page_sections.parent_id": {
    interface: "select-dropdown-m2o",
    display: "related-values",
    display_options: { template: "{{list_title}}" },
    special: ["m2o"],
    note: "上级板块；顶级板块留空。例如「强大的研发能力」的上级是「研发技术能力」。",
  },
  "media.kind": {
    interface: "select-dropdown",
    options: { choices: [
      { text: "产品主图", value: "product_main" },
      { text: "产品详情图", value: "product_detail" },
      { text: "系列封面", value: "series_cover" },
      { text: "分类封面", value: "category_cover" },
      { text: "新闻封面", value: "news_cover" },
    ] },
    note: "媒体用途，不要手填内部码",
  },
  "media.language": {
    interface: "select-dropdown",
    options: { choices: [
      { text: "英文 en", value: "en" },
      { text: "中文 zh", value: "zh" },
    ] },
    note: "可留空表示语言无关；需要时只选 en / zh",
    width: "half",
  },
  "category_translations.language": {
    interface: "select-dropdown",
    options: { choices: [
      { text: "英文 en", value: "en" },
      { text: "中文 zh", value: "zh" },
    ] },
    display: "labels",
    display_options: { format: false, choices: [
      { text: "英文 en", value: "en" },
      { text: "中文 zh", value: "zh" },
    ] },
    required: true,
    width: "half",
    note: "这一条是中文还是英文：只选「中文 zh」或「英文 en」，不要填「中文」两个字",
  },
  "series_translations.language": {
    interface: "select-dropdown",
    options: { choices: [
      { text: "英文 en", value: "en" },
      { text: "中文 zh", value: "zh" },
    ] },
    display: "labels",
    display_options: { format: false, choices: [
      { text: "英文 en", value: "en" },
      { text: "中文 zh", value: "zh" },
    ] },
    required: true,
    width: "half",
    note: "这一条是中文还是英文：只选「中文 zh」或「英文 en」，不要填「中文」两个字",
  },
  "product_translations.language": {
    interface: "select-dropdown",
    options: { choices: [
      { text: "英文 en", value: "en" },
      { text: "中文 zh", value: "zh" },
    ] },
    display: "labels",
    display_options: { format: false, choices: [
      { text: "英文 en", value: "en" },
      { text: "中文 zh", value: "zh" },
    ] },
    required: true,
    width: "half",
    note: "这一条是中文还是英文：只选「中文 zh」或「英文 en」，不要填「中文」两个字",
  },
  "page_sections_translations.language": {
    interface: "select-dropdown",
    options: { choices: [
      { text: "英文 en", value: "en" },
      { text: "中文 zh", value: "zh" },
    ] },
    required: true,
    width: "half",
    note: "语言码固定使用 en / zh，不要填「中文」两个字",
  },
  "languages.direction": {
    interface: "select-dropdown",
    options: { choices: [
      { text: "从左到右", value: "ltr" },
      { text: "从右到左", value: "rtl" },
    ] },
    width: "half",
  },
  "languages.enabled": {
    interface: "boolean",
    width: "half",
  },
};

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
  "series.image": "系列图片：支持大图预览、上传、从媒体库选择、放大查看、替换和清除",
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
  "news_translations.language": "这一条是中文还是英文：只选「中文 zh」或「英文 en」，不要填「中文」两个字",
  "category.translations": "还没有内容时请点「新建」，中文、英文各一条。每一行会标明这条是「中文 zh」还是「英文 en」。不要把一种语言的文案填进另一种。",
  "series.translations": "还没有内容时请点「新建」，中文、英文各一条。每一行会标明这条是「中文 zh」还是「英文 en」。不要把一种语言的文案填进另一种。",
  "product.translations": "还没有内容时请点「新建」，中文、英文各一条。每一行会标明这条是「中文 zh」还是「英文 en」。不要把一种语言的文案填进另一种。",
  "news_translations.slug": "详情页网址后缀，必填。例如 test-111。不填卡片会点回列表且没有报错。",
  "page_sections.page_slug": "选择板块所属页面；服务、方案、关于的已发布板块会在前台展示。",
  "page_sections.parent_id": "上级板块；顶级板块留空。例如「强大的研发能力」的上级是「研发技术能力」。",
  "page_sections.list_title": "后台列表和左边层级显示用，不直接当 H1。",
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
  "news.cover_image": "封面图",
  "media.file_id": "媒体文件",
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
  product_spec: "产品技术参数",
  product_spec_translations: "参数翻译",
  product_certification: "产品认证",
  product_certification_row: "认证参数行",
  product_document: "产品下载文件",
  product_relation: "产品关系",
  site_pages: "页面管理（方案 / 服务 / 关于）",
  site_pages_translations: "页面翻译",
  social_links: "社交外链",
  home_blocks: "首页内容块",
  home_blocks_translations: "首页内容块翻译",
  site_settings: "站点设置",
  home_banner: "首页 Banner",
  home_banner_translations: "首页 Banner 翻译",
  page_sections: "页面板块",
  page_sections_translations: "页面板块翻译",
};

const menuGroups = {
  product_management: { translation: "产品管理", sort: 1 },
  content_management: { translation: "内容管理", sort: 2 },
  site_configuration: { translation: "站点配置", sort: 3 },
};

const collectionMenuMeta = {
  category: { group: "product_management", hidden: false, sort: 1 },
  series: { group: "product_management", hidden: false, sort: 2, display_template: "{{matecode}}" },
  product: { group: "product_management", hidden: false, sort: 3 },
  media: { group: "product_management", hidden: false, sort: 4 },
  product_media: { group: "product_management", hidden: true, sort: 5 },
  product_spec: { group: "product_management", hidden: true, sort: 9 },
  product_spec_translations: { group: "product_management", hidden: true, sort: 10 },
  product_certification: { group: "product_management", hidden: true, sort: 11 },
  product_certification_row: { group: "product_management", hidden: true, sort: 12 },
  product_document: { group: "product_management", hidden: true, sort: 13 },
  product_relation: { group: "product_management", hidden: true, sort: 14 },
  category_translations: { group: "product_management", hidden: true, sort: 6, display_template: "{{language}} · {{name}}" },
  series_translations: { group: "product_management", hidden: true, sort: 7, display_template: "{{language}} · {{name}}" },
  product_translations: { group: "product_management", hidden: true, sort: 8, display_template: "{{language}} · {{name}}" },
  news: {
    group: "content_management",
    hidden: false,
    sort: 1,
    icon: "newspaper",
    display_template: "{{translations.name}}",
    note: "一条新闻含中英两份翻译。先填封面/日期/状态，再在「多语言内容」里各建一条 zh 和 en。",
  },
  news_translations: {
    group: "content_management",
    hidden: true,
    sort: 2,
    display_template: "{{language}} · {{name}}",
  },
  site_pages: { group: "content_management", hidden: false, sort: 3, icon: "web" },
  site_pages_translations: { group: "content_management", hidden: true, sort: 4 },
  page_sections: { group: "content_management", hidden: false, sort: 5, icon: "account_tree" },
  page_sections_translations: { group: "content_management", hidden: true, sort: 6 },
  home_banner: {
    group: "content_management",
    hidden: false,
    sort: 6,
    icon: "view_carousel",
    display_template: "{{label}}",
    note: "同一条 Banner 维护中英文。当前演示首页仍用前端静态轮播，改这里不会立刻出现在官网上。",
  },
  home_banner_translations: { group: "content_management", hidden: true, sort: 7 },
  home_blocks: { group: "content_management", hidden: false, sort: 8, icon: "dashboard" },
  home_blocks_translations: { group: "content_management", hidden: true, sort: 9 },
  site_settings: { group: "site_configuration", hidden: false, sort: 1 },
  languages: { group: "site_configuration", hidden: false, sort: 2 },
  social_links: { group: "site_configuration", hidden: false, sort: 3, icon: "share" },
};

const pilotChoice = {
  status: [{ text: '已发布', value: 'published' }, { text: '草稿', value: 'draft' }],
  language: [{ text: '英文 en', value: 'en' }, { text: '中文 zh', value: 'zh' }],
};
const dropdown = (choices) => ({ interface: 'select-dropdown', options: { choices } });
const o2m = (template) => ({ interface: 'list-o2m', options: { template, enableCreate: true, enableSelect: false } });
const m2o = (template) => ({
  interface: 'select-dropdown-m2o',
  options: { template },
  display: 'related-values',
  display_options: { template },
});
const pilotFields = {
  'site_pages.translations': ['中英文页面内容与 SEO', { sort: 5, display: 'related-values', display_options: { template: '{{language}} · {{title}}' }, note: '同一页面维护中文和英文两条内容；标题、正文、H1 与 SEO 信息都在对应语言记录中。' }],
  'site_pages.sections': ['服务页板块', { sort: 30, interface: 'list-o2m', options: { template: '{{list_title}}', enableCreate: true, enableSelect: false }, note: '可在这里新建或编辑服务板块，新增板块默认草稿；填写中英文内容后再发布。' }],
  'site_pages.preview_links': ['前台预览', { sort: 11, interface: 'presentation-links' }],
  'site_pages.cover_image': ['共用页头图', { sort: 6 }],
  'site_pages.panel_image_1': ['共用图文 1 图片', { sort: 7 }],
  'site_pages.panel_image_2': ['共用图文 2 图片', { sort: 8 }],
  'site_pages.panel_image_3': ['共用图文 3 图片', { sort: 9 }],
  'site_pages.list_title': ['后台页面名称', { sort: 2, note: '仅供后台定位页面，不替代各语言的页面标题。' }],
  'site_pages.slug': ['页面类型', { sort: 3, display: 'labels', display_options: { format: false, choices: [
    { text: '首页', value: 'home' }, { text: '新闻列表', value: 'news' }, { text: '行业解决方案', value: 'solutions' }, { text: '服务', value: 'services' }, { text: '关于我们', value: 'about' },
  ] } }],
  'site_pages.status': ['发布状态', { sort: 4, display: 'labels', display_options: { format: false, choices: pilotChoice.status } }],
  'site_pages.sort': ['显示顺序', { sort: 10 }],
  'page_sections.site_page_id': ['所属页面', { hidden: true, interface: 'select-dropdown-m2o', options: { template: '{{slug}}' }, note: '从服务页进入会自动沿用页面归属。' }],
  'page_sections.page_slug': ['所属页面', { display: 'labels', display_options: { format: false, choices: [
    { text: '服务', value: 'services' }, { text: '行业解决方案', value: 'solutions' }, { text: '关于我们', value: 'about' },
  ] } }],
  'page_sections.status': ['状态', { display: 'labels', display_options: { format: false, choices: pilotChoice.status } }],
  'page_sections.list_title': ['后台板块名称', { note: '用于查找和排序；前台标题请在“中英文内容”中分别填写。' }],
  'page_sections_translations.stat1': ['展示数据 1', {}],
  'page_sections_translations.stat1_label': ['数据 1 说明', {}],
  'page_sections_translations.stat2': ['展示数据 2', {}],
  'page_sections_translations.stat2_label': ['数据 2 说明', {}],
  'page_sections_translations.intro1': ['主要正文', {}],
  'page_sections_translations.intro2': ['补充正文', {}],
  'product.product_media_group': ['产品图片', { special: ['alias', 'group', 'no-data'], interface: 'group-accordion', options: { accordionMode: true, start: 'closed' }, sort: 10 }],
  'product.product_technical_group': ['技术参数与附加信息', { special: ['alias', 'group', 'no-data'], interface: 'group-accordion', options: { accordionMode: true, start: 'closed' }, sort: 11 }],
  'product.product_certification_group': ['认证', { special: ['alias', 'group', 'no-data'], interface: 'group-accordion', options: { accordionMode: true, start: 'closed' }, sort: 12 }],
  'product.product_document_group': ['资料下载', { special: ['alias', 'group', 'no-data'], interface: 'group-accordion', options: { accordionMode: true, start: 'closed' }, sort: 13 }],
  'product.product_relation_group': ['配套与相关产品', { special: ['alias', 'group', 'no-data'], interface: 'group-accordion', options: { accordionMode: true, start: 'closed' }, sort: 14 }],
  'product.media_links': ['产品图片', { group: 'product_media_group', sort: 11 }],
  'product.specifications': ['技术参数与附加信息', { group: 'product_technical_group', sort: 12, ...o2m('{{translations.label}}') }],
  'product.certifications': ['认证', { group: 'product_certification_group', sort: 13, ...o2m('{{code}}') }],
  'product.documents': ['资料下载', { group: 'product_document_group', sort: 14, ...o2m('{{title}}') }],
  'product.related_products': ['配套与相关产品', { group: 'product_relation_group', sort: 15, ...o2m('{{target_series_id.matecode}} {{target_product_id.order_no}}') }],
  'product_spec.product_id': ['所属产品', { hidden: true }],
  'product_spec.kind': ['信息类型', dropdown([{ text: '技术参数', value: 'technical' }, { text: '产品附件', value: 'additional' }, { text: '订购信息', value: 'business' }])],
  'product_spec.group_key': ['参数分组标识', { hidden: true, note: '迁移定位用，普通编辑无需填写' }],
  'product_spec.sort': ['显示顺序', {}],
  'product_spec.status': ['发布状态', dropdown(pilotChoice.status)],
  'product_spec.legacy_id': ['旧库 ID', { hidden: true, readonly: true, note: '迁移对照用，运营无需填写' }],
  'product_spec.translations': ['中英文内容', o2m('{{language}} · {{label}}')],
  'product_spec_translations.product_spec_id': ['所属参数', { hidden: true }],
  'product_spec_translations.language': ['语言', dropdown(pilotChoice.language)],
  'product_spec_translations.group_title': ['参数分组标题', {}],
  'product_spec_translations.label': ['参数名称', {}],
  'product_spec_translations.value': ['参数值', {}],
  'product_spec_translations.unit': ['单位', {}],
  'product_certification.product_id': ['所属产品', { hidden: true }],
  'product_certification.code': ['认证名称', { note: '例如 UL 或 VDE；无认证事实时不要创建' }],
  'product_certification.logo_file_id': ['认证图片', { interface: 'product-media-editor', width: 'full', note: '可上传、预览、替换、清除认证图片' }],
  'product_certification.sort': ['显示顺序', {}],
  'product_certification.status': ['发布状态', dropdown(pilotChoice.status)],
  'product_certification.legacy_id': ['旧库 ID', { hidden: true, readonly: true, note: '迁移对照用，运营无需填写' }],
  'product_certification.rows': ['认证数据', o2m('{{language}} · {{label}}')],
  'product_certification_row.certification_id': ['所属认证', { hidden: true }],
  'product_certification_row.language': ['语言', dropdown(pilotChoice.language)],
  'product_certification_row.label': ['参数名称', {}],
  'product_certification_row.value_1': ['数值 1', {}],
  'product_certification_row.value_2': ['数值 2', {}],
  'product_certification_row.value_3': ['数值 3', {}],
  'product_certification_row.sort': ['显示顺序', {}],
  'product_certification_row.legacy_id': ['旧库 ID', { hidden: true, readonly: true, note: '迁移对照用，运营无需填写' }],
  'product_document.product_id': ['所属产品', { hidden: true }],
  'product_document.language': ['语言', dropdown(pilotChoice.language)],
  'product_document.kind': ['文件类型', dropdown([{ text: '数据表 PDF', value: 'datasheet' }, { text: 'CAD 图纸', value: 'cad' }, { text: '3D 模型', value: 'model_3d' }, { text: '其他', value: 'other' }])],
  'product_document.title': ['文件标题', {}],
  'product_document.file_id': ['文件', { interface: 'file', note: '上传或选择文件；发布前检查预览和下载' }],
  'product_document.sort': ['显示顺序', {}],
  'product_document.status': ['发布状态', dropdown(pilotChoice.status)],
  'product_document.legacy_id': ['旧库 ID', { hidden: true, readonly: true, note: '迁移对照用，运营无需填写' }],
  'product_relation.product_id': ['所属产品', { hidden: true }],
  'product_relation.target_product_id': ['目标 SKU', { ...m2o('{{order_no}}'), note: '与目标系列二选一；选择具体订货号' }],
  'product_relation.target_series_id': ['目标系列', { ...m2o('{{matecode}}'), note: '与目标 SKU 二选一；选择系列' }],
  'product_relation.kind': ['关系类型', dropdown([{ text: '配套产品', value: 'matching' }, { text: '关联产品', value: 'related' }, { text: '相近规格', value: 'similar' }])],
  'product_relation.sort': ['显示顺序', {}],
  'product_relation.status': ['发布状态', dropdown(pilotChoice.status)],
  'product_relation.legacy_id': ['旧库 ID', { hidden: true, readonly: true, note: '迁移对照用，运营无需填写' }],
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
for (const [key, [translation, meta]] of Object.entries(pilotFields)) {
  const [collection, field] = key.split('.');
  await patchField(collection, field, { ...meta, translations: [{ language: 'zh-CN', translation }] });
}
for (const [collection, translation] of Object.entries(expectedCollectionTranslations)) {
  await patchCollection(collection, { translations: [{ language: "zh-CN", translation }] });
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
  await patchField(collection, field, { display: "product-media-thumbnail" });
}

console.log(`UPDATED ${Object.keys(expectedNotes).length + hiddenFields.length + Object.keys(expectedTranslations).length + Object.keys(expectedCollectionTranslations).length + Object.keys(mediaEditorMeta).length + Object.keys(pilotFields).length + Object.keys(menuGroups).length + Object.keys(collectionMenuMeta).length + thumbnailFields.length}`);
