/**
 * 首页区块 + 营销页后台可配置（幂等）
 *   node data/seed_home_cms.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BASE = process.env.DIRECTUS_URL || "http://localhost:8055";
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || "admin@degson.dev";
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || "degson1234";

const KIND_CHOICES = [
  { text: "信任条", value: "highlight" },
  { text: "应用场景", value: "industry" },
  { text: "大图故事带", value: "feature" },
  { text: "产品展示图", value: "product_shot" },
  { text: "Hero 缩略图", value: "hero_thumb" },
];

const LINK_CHOICES = [
  { text: "产品分类锚点", value: "/#products" },
  { text: "行业解决方案", value: "/solutions" },
  { text: "服务", value: "/services" },
  { text: "关于我们", value: "/about" },
  { text: "新闻", value: "/news" },
];

const LANG_CHOICES = [
  { text: "英文 en", value: "en" },
  { text: "中文 zh", value: "zh" },
];

const IMAGE_META = {
  interface: "product-media-editor",
  display: "image",
  note: "可上传或粘贴图片地址；空则前台不显示该图",
  width: "full",
};

async function api(method, path, token, body) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

async function getToken() {
  const tokenFile = process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? join(ROOT, ".admin_token");
  if (existsSync(tokenFile)) {
    const t = readFileSync(tokenFile, "utf8").trim();
    if (t) {
      const probe = await api("GET", "/users/me", t);
      if (probe.status === 200) return t;
    }
  }
  const login = await api("POST", "/auth/login", null, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (login.status !== 200) {
    throw new Error(`登录失败 ${login.status}: ${JSON.stringify(login.json)}`);
  }
  return login.json.data.access_token;
}

async function ensureCollection(token, name, meta) {
  const all = await api("GET", "/collections", token);
  const exists = (all.json?.data || []).some((c) => c.collection === name);
  if (!exists) {
    const r = await api("POST", "/collections", token, { collection: name, meta, schema: {} });
    if (r.status < 200 || r.status >= 300) {
      throw new Error(`集合 ${name} ${r.status}: ${JSON.stringify(r.json).slice(0, 400)}`);
    }
    console.log(`+ 集合 ${name}`);
  } else {
    const r = await api("PATCH", `/collections/${name}`, token, { meta });
    if (r.status < 200 || r.status >= 300) {
      throw new Error(`更新集合 ${name} ${r.status}: ${JSON.stringify(r.json).slice(0, 400)}`);
    }
    console.log(`= 集合 ${name}`);
  }
}

async function ensureField(token, collection, field, type, schema = {}, meta = {}) {
  const exists = await api("GET", `/fields/${collection}/${field}`, token);
  if (exists.status === 200) {
    const r = await api("PATCH", `/fields/${collection}/${field}`, token, { meta });
    if (r.status < 200 || r.status >= 300) {
      console.warn(`  ~ 字段 meta ${collection}.${field} ${r.status}`);
    }
    return;
  }
  const r = await api("POST", `/fields/${collection}`, token, {
    field,
    type,
    schema: { is_nullable: true, ...schema },
    meta,
  });
  if (r.status < 200 || r.status >= 300) {
    throw new Error(`字段 ${collection}.${field} ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
  }
  console.log(`  + 字段 ${collection}.${field}`);
}

async function ensureRelation(token, payload) {
  const list = await api("GET", "/relations?limit=-1", token);
  const exists = (list.json?.data || []).some(
    (r) => r.collection === payload.collection && r.field === payload.field,
  );
  if (exists) {
    console.log(`  = 关系 ${payload.collection}.${payload.field}`);
    return;
  }
  const r = await api("POST", "/relations", token, payload);
  if (r.status >= 200 && r.status < 300) {
    console.log(`  + 关系 ${payload.collection}.${payload.field}`);
  } else {
    throw new Error(
      `关系 ${payload.collection}.${payload.field} ${r.status}: ${JSON.stringify(r.json).slice(0, 400)}`,
    );
  }
}

async function ensurePermission(token, policyId, collection) {
  const perms = await api(
    "GET",
    `/permissions?limit=-1&filter[policy][_eq]=${policyId}&filter[collection][_eq]=${collection}&filter[action][_eq]=read`,
    token,
  );
  if ((perms.json?.data || []).length) return;
  const r = await api("POST", "/permissions", token, {
    policy: policyId,
    collection,
    action: "read",
    fields: ["*"],
    permissions: {},
    validation: {},
    presets: {},
  });
  if (r.status >= 200 && r.status < 300) console.log(`  + 权限 read ${collection}`);
}

async function upsertByKey(token, collection, filterPath, payload) {
  const list = await api("GET", `/items/${collection}?${filterPath}&fields=id&limit=1`, token);
  const id = list.json?.data?.[0]?.id;
  if (id) {
    await api("PATCH", `/items/${collection}/${id}`, token, payload);
    return id;
  }
  const r = await api("POST", `/items/${collection}`, token, payload);
  if (r.status < 200 || r.status >= 300) {
    throw new Error(`写入 ${collection} 失败: ${JSON.stringify(r.json).slice(0, 400)}`);
  }
  return r.json.data.id;
}

const BLOCKS = [
  {
    key: "highlight-specs",
    kind: "highlight",
    sort: 10,
    label: "信任条 · 规格数",
    en: { title: "40,000+ models", text: "Broad industrial connector portfolio for design-in flexibility." },
    zh: { title: "40,000+ 规格", text: "覆盖工业场景的连接器组合，方便设计选型。" },
  },
  {
    key: "highlight-cert",
    kind: "highlight",
    sort: 20,
    label: "信任条 · 认证",
    en: { title: "Certified interfaces", text: "UL / VDE / CE oriented selections for global equipment markets." },
    zh: { title: "认证导向", text: "面向全球整机市场的 UL / VDE / CE 等认证选型线索。" },
  },
  {
    key: "highlight-cms",
    kind: "highlight",
    sort: 30,
    label: "信任条 · 多语言",
    en: { title: "One catalog, many languages", text: "Product and marketing content managed in a single CMS." },
    zh: { title: "一套内容，多语言站点", text: "产品与营销内容统一在后台管理，不再维护多套站点。" },
  },
  {
    key: "industry-auto",
    kind: "industry",
    sort: 110,
    label: "应用 · 工业自动化",
    image: "/images/marketing/home-app-1.jpg",
    link_path: "/solutions",
    en: { title: "Industrial automation", text: "PCB terminals and signal interfaces for control cabinets and machine builders." },
    zh: { title: "工业自动化", text: "面向控制柜与设备商的 PCB 接线端子与信号接口。" },
  },
  {
    key: "industry-energy",
    kind: "industry",
    sort: 120,
    label: "应用 · 能源储能",
    image: "/images/marketing/home-app-2.jpg",
    link_path: "/solutions",
    en: { title: "Energy & storage", text: "Power connectors for inverters, ESS and charging infrastructure." },
    zh: { title: "能源与储能", text: "逆变器、储能与充电设施中的功率连接方案。" },
  },
  {
    key: "industry-rail",
    kind: "industry",
    sort: 130,
    label: "应用 · 轨交",
    image: "/images/marketing/feature-rail.jpg",
    link_path: "/solutions",
    en: { title: "Rail & transportation", text: "Vibration-resistant connection for rolling stock and wayside equipment." },
    zh: { title: "轨交与交通", text: "适应振动与严苛工况的车载与沿线设备连接。" },
  },
  {
    key: "industry-oem",
    kind: "industry",
    sort: 140,
    label: "应用 · 设备 OEM",
    image: "/images/marketing/home-app-4.jpg",
    link_path: "/solutions",
    en: { title: "Equipment OEM", text: "Compact interfaces that simplify panel design and field wiring." },
    zh: { title: "设备 OEM", text: "紧凑接口，简化盘柜设计与现场接线。" },
  },
  {
    key: "feature-pushin",
    kind: "feature",
    sort: 210,
    label: "故事带 · Push-in",
    image: "/images/marketing/home-push.jpg",
    link_path: "/solutions",
    en: {
      title: "Push-in & PCB connectivity",
      text: "Faster wiring for dense I/O boards and control modules — less tooling, clearer feedback.",
      cta: "Explore solutions",
    },
    zh: {
      title: "Push-in 与 PCB 连接",
      text: "面向高密度 I/O 与控制模块的快速接线——少工具、反馈更清晰。",
      cta: "查看行业方案",
    },
  },
  {
    key: "feature-energy",
    kind: "feature",
    sort: 220,
    label: "故事带 · 能源充电",
    image: "/images/marketing/home-ev.jpg",
    link_path: "/#products",
    en: {
      title: "Energy & charging interfaces",
      text: "Power and signal connectors for energy storage and EV charging applications.",
      cta: "Browse products",
    },
    zh: {
      title: "能源与充电接口",
      text: "面向储能与电动汽车充电场景的功率与信号连接。",
      cta: "浏览产品分类",
    },
  },
  {
    key: "shot-terminal",
    kind: "product_shot",
    sort: 310,
    label: "产品图 · 接线端子",
    image: "/images/marketing/home-product-1.png",
    en: { title: "Terminal blocks" },
    zh: { title: "接线端子" },
  },
  {
    key: "shot-circular",
    kind: "product_shot",
    sort: 320,
    label: "产品图 · 圆形连接器",
    image: "https://enoss.degson.com/imgs/list/c03.jpg",
    en: { title: "Circular connectors" },
    zh: { title: "圆形连接器" },
  },
  {
    key: "shot-pushin",
    kind: "product_shot",
    sort: 330,
    label: "产品图 · Push-in",
    image: "/images/marketing/home-connector.png",
    en: { title: "Push-in series" },
    zh: { title: "Push-in 系列" },
  },
  {
    key: "shot-hdc",
    kind: "product_shot",
    sort: 340,
    label: "产品图 · 重载",
    image: "/images/marketing/home-product-3.jpg",
    en: { title: "Heavy-duty connectors" },
    zh: { title: "重载连接器" },
  },
  {
    key: "thumb-1",
    kind: "hero_thumb",
    sort: 410,
    label: "Hero 缩略图 1",
    image: "/images/marketing/home-thumb-1.png",
    en: { title: "Product 1" },
    zh: { title: "产品 1" },
  },
  {
    key: "thumb-2",
    kind: "hero_thumb",
    sort: 420,
    label: "Hero 缩略图 2",
    image: "/images/marketing/home-thumb-2.png",
    en: { title: "Product 2" },
    zh: { title: "产品 2" },
  },
  {
    key: "thumb-3",
    kind: "hero_thumb",
    sort: 430,
    label: "Hero 缩略图 3",
    image: "/images/marketing/home-thumb-3.png",
    en: { title: "Product 3" },
    zh: { title: "产品 3" },
  },
];

async function main() {
  const token = await getToken();
  console.log("=== seed_home_cms ===");

  await ensureCollection(token, "home_blocks", {
    icon: "dashboard",
    group: "site_configuration",
    hidden: false,
    sort: 6,
    display_template: "{{label}}",
    archive_field: "status",
    archive_value: "draft",
    unarchive_value: "published",
    note: "首页信任条、应用场景、大图故事带、产品展示图。改这里即可更新官网首页。",
    translations: [{ language: "zh-CN", translation: "首页内容块" }],
  });
  await ensureField(token, "home_blocks", "key", "string", { max_length: 64, is_unique: true }, {
    hidden: true,
    note: "系统内部键，勿改",
    translations: [{ language: "zh-CN", translation: "内部键" }],
  });
  await ensureField(token, "home_blocks", "label", "string", { max_length: 128 }, {
    required: true,
    interface: "input",
    width: "half",
    note: "只给后台列表辨认，不显示在前台",
    translations: [{ language: "zh-CN", translation: "后台备注名" }],
  });
  await ensureField(token, "home_blocks", "kind", "string", { max_length: 32, is_nullable: false }, {
    required: true,
    interface: "select-dropdown",
    display: "labels",
    options: { choices: KIND_CHOICES },
    width: "half",
    note: "决定这块出现在首页哪个区域",
    translations: [{ language: "zh-CN", translation: "区块类型" }],
  });
  await ensureField(token, "home_blocks", "image", "string", { max_length: 512 }, {
    ...IMAGE_META,
    translations: [{ language: "zh-CN", translation: "图片" }],
  });
  await ensureField(token, "home_blocks", "link_path", "string", { max_length: 128 }, {
    interface: "select-dropdown",
    options: { choices: LINK_CHOICES },
    width: "half",
    note: "点击后跳转的前台页面；信任条可不填",
    translations: [{ language: "zh-CN", translation: "跳转页面" }],
  });
  await ensureField(token, "home_blocks", "sort", "integer", { default_value: 0 }, {
    interface: "input",
    width: "half",
    note: "数字越小越靠前",
    translations: [{ language: "zh-CN", translation: "显示顺序" }],
  });
  await ensureField(token, "home_blocks", "status", "string", { max_length: 16, default_value: "published" }, {
    interface: "select-dropdown",
    options: { choices: [{ text: "已发布", value: "published" }, { text: "草稿（前台不显示）", value: "draft" }] },
    width: "half",
    translations: [{ language: "zh-CN", translation: "状态" }],
  });

  await ensureCollection(token, "home_blocks_translations", {
    icon: "translate",
    group: "site_configuration",
    hidden: true,
    sort: 7,
    translations: [{ language: "zh-CN", translation: "首页内容块翻译" }],
  });
  await ensureField(token, "home_blocks_translations", "home_blocks_id", "integer", {}, {
    interface: "select-dropdown-m2o",
    translations: [{ language: "zh-CN", translation: "所属内容块" }],
  });
  await ensureField(token, "home_blocks_translations", "language", "string", { max_length: 8, is_nullable: false }, {
    required: true,
    interface: "select-dropdown",
    options: { choices: LANG_CHOICES },
    width: "half",
    translations: [{ language: "zh-CN", translation: "语言" }],
  });
  await ensureField(token, "home_blocks_translations", "title", "string", { max_length: 255 }, {
    interface: "input",
    translations: [{ language: "zh-CN", translation: "标题" }],
  });
  await ensureField(token, "home_blocks_translations", "text", "text", {}, {
    interface: "input-multiline",
    translations: [{ language: "zh-CN", translation: "说明文字" }],
  });
  await ensureField(token, "home_blocks_translations", "cta", "string", { max_length: 64 }, {
    interface: "input",
    note: "大图故事带的按钮文字，其它类型可空",
    translations: [{ language: "zh-CN", translation: "按钮文字" }],
  });

  const alias = await api("GET", "/fields/home_blocks/translations", token);
  if (alias.status !== 200) {
    await api("POST", "/fields/home_blocks", token, {
      field: "translations",
      type: "alias",
      meta: {
        interface: "translations",
        special: ["translations"],
        translations: [{ language: "zh-CN", translation: "多语言内容" }],
      },
    });
  } else {
    await api("PATCH", "/fields/home_blocks/translations", token, {
      meta: {
        interface: "translations",
        special: ["translations"],
        translations: [{ language: "zh-CN", translation: "多语言内容" }],
      },
    });
  }
  await ensureRelation(token, {
    collection: "home_blocks_translations",
    field: "home_blocks_id",
    related_collection: "home_blocks",
    meta: {
      many_collection: "home_blocks_translations",
      many_field: "home_blocks_id",
      one_collection: "home_blocks",
      one_field: "translations",
      one_deselect_action: "nullify",
    },
    schema: { on_delete: "CASCADE" },
  });

  // site_settings：Hero 图与底部 CTA
  await ensureField(token, "site_settings", "hero_image", "string", { max_length: 512 }, {
    ...IMAGE_META,
    translations: [{ language: "zh-CN", translation: "首页大图" }],
  });
  await ensureField(token, "site_settings", "hero_kicker", "string", { max_length: 128 }, {
    interface: "input",
    translations: [{ language: "zh-CN", translation: "Hero 小标题（英文）" }],
  });
  await ensureField(token, "site_settings", "hero_kicker_zh", "string", { max_length: 128 }, {
    interface: "input",
    translations: [{ language: "zh-CN", translation: "Hero 小标题（中文）" }],
  });
  await ensureField(token, "site_settings", "cta_title", "string", { max_length: 255 }, {
    interface: "input",
    translations: [{ language: "zh-CN", translation: "底部号召标题（英文）" }],
  });
  await ensureField(token, "site_settings", "cta_title_zh", "string", { max_length: 255 }, {
    interface: "input",
    translations: [{ language: "zh-CN", translation: "底部号召标题（中文）" }],
  });
  await ensureField(token, "site_settings", "cta_text", "text", {}, {
    interface: "input-multiline",
    translations: [{ language: "zh-CN", translation: "底部号召说明（英文）" }],
  });
  await ensureField(token, "site_settings", "cta_text_zh", "text", {}, {
    interface: "input-multiline",
    translations: [{ language: "zh-CN", translation: "底部号召说明（中文）" }],
  });
  await ensureField(token, "site_settings", "cta_link", "string", { max_length: 128 }, {
    interface: "select-dropdown",
    options: { choices: LINK_CHOICES },
    translations: [{ language: "zh-CN", translation: "底部号召跳转" }],
  });
  await api("PATCH", "/items/site_settings/1", token, {
    hero_image: "/images/marketing/home-hero.jpg",
    hero_kicker: "Industrial Connectivity",
    hero_kicker_zh: "工业连接解决方案",
    cta_title: "Need selection support?",
    cta_title_zh: "需要选型支持？",
    cta_text: "Tell us your application and ratings — our application team can help shortlist series.",
    cta_text_zh: "告诉我们应用场景与额定参数，应用团队可协助缩小系列范围。",
    cta_link: "/services",
  });
  await api("PATCH", "/collections/site_settings", token, {
    meta: {
      icon: "settings",
      group: "site_configuration",
      hidden: false,
      sort: 1,
      translations: [{ language: "zh-CN", translation: "站点设置" }],
      note: "首页 Hero、页脚、底部号召等全站文案",
    },
  });

  // 营销页字段改成运营能看懂的中文 + 图片控件
  await ensureCollection(token, "site_pages", {
    icon: "web",
    group: "content_management",
    hidden: false,
    sort: 3,
    display_template: "{{list_title}}",
    note: "改这里就是前台「行业解决方案 / 服务 / 关于我们」。点进一条，在「多语言内容」里改中英文标题和正文。",
    translations: [{ language: "zh-CN", translation: "方案 / 服务 / 关于" }],
  });
  await ensureField(token, "site_pages", "slug", "string", { max_length: 64, is_nullable: false }, {
    required: true,
    interface: "select-dropdown",
    options: {
      choices: [
        { text: "行业解决方案（/solutions）", value: "solutions" },
        { text: "服务（/services）", value: "services" },
        { text: "关于我们（/about）", value: "about" },
      ],
    },
    note: "对应前台路径，一般不要改",
    translations: [{ language: "zh-CN", translation: "对应前台页面" }],
  });
  await ensureField(token, "site_pages", "cover_image", "string", { max_length: 512 }, {
    ...IMAGE_META,
    translations: [{ language: "zh-CN", translation: "页头封面图" }],
  });
  await ensureField(token, "site_pages", "panel_image_1", "string", { max_length: 512 }, {
    ...IMAGE_META,
    translations: [{ language: "zh-CN", translation: "图文板块 1 图片" }],
  });
  await ensureField(token, "site_pages", "panel_image_2", "string", { max_length: 512 }, {
    ...IMAGE_META,
    translations: [{ language: "zh-CN", translation: "图文板块 2 图片" }],
  });
  await ensureField(token, "site_pages", "panel_image_3", "string", { max_length: 512 }, {
    ...IMAGE_META,
    translations: [{ language: "zh-CN", translation: "图文板块 3 图片" }],
  });
  await ensureField(token, "site_pages", "sort", "integer", { default_value: 0 }, {
    interface: "input",
    translations: [{ language: "zh-CN", translation: "显示顺序" }],
  });
  await ensureField(token, "site_pages", "status", "string", { max_length: 32 }, {
    interface: "select-dropdown",
    options: { choices: [{ text: "已发布", value: "published" }, { text: "草稿", value: "draft" }] },
    translations: [{ language: "zh-CN", translation: "状态" }],
  });

  for (const [field, label, extra] of [
    ["language", "语言", { interface: "select-dropdown", options: { choices: LANG_CHOICES } }],
    ["title", "页面标题", { interface: "input" }],
    ["summary", "摘要（页头副标题）", { interface: "input-multiline" }],
    ["body", "正文", { interface: "input-rich-text-html", note: "前台会按段落展示；请用普通段落文字" }],
    ["seo_title", "SEO 标题", { interface: "input" }],
    ["seo_description", "SEO 描述", { interface: "input-multiline" }],
    ["panel_1_title", "图文板块 1 标题", { interface: "input" }],
    ["panel_1_text", "图文板块 1 说明", { interface: "input-multiline" }],
    ["panel_2_title", "图文板块 2 标题", { interface: "input" }],
    ["panel_2_text", "图文板块 2 说明", { interface: "input-multiline" }],
    ["panel_3_title", "图文板块 3 标题", { interface: "input" }],
    ["panel_3_text", "图文板块 3 说明", { interface: "input-multiline" }],
  ]) {
    await ensureField(token, "site_pages_translations", field, field.includes("text") || field === "body" || field === "summary" || field === "seo_description" ? "text" : "string", {}, {
      translations: [{ language: "zh-CN", translation: label }],
      ...extra,
    });
  }

  for (const block of BLOCKS) {
    const id = await upsertByKey(
      token,
      "home_blocks",
      `filter[key][_eq]=${encodeURIComponent(block.key)}`,
      {
        key: block.key,
        label: block.label,
        kind: block.kind,
        image: block.image ?? null,
        link_path: block.link_path ?? null,
        sort: block.sort,
        status: "published",
      },
    );
    for (const lang of ["en", "zh"]) {
      const src = block[lang];
      const list = await api(
        "GET",
        `/items/home_blocks_translations?filter[home_blocks_id][_eq]=${id}&filter[language][_eq]=${lang}&fields=id&limit=1`,
        token,
      );
      const payload = {
        home_blocks_id: id,
        language: lang,
        title: src.title ?? null,
        text: src.text ?? null,
        cta: src.cta ?? null,
      };
      const tid = list.json?.data?.[0]?.id;
      if (tid) await api("PATCH", `/items/home_blocks_translations/${tid}`, token, payload);
      else await api("POST", "/items/home_blocks_translations", token, payload);
    }
    console.log(`= 首页块 ${block.key}`);
  }

  const policies = await api("GET", "/policies?limit=-1", token);
  const webPolicy = (policies.json?.data || []).find(
    (p) => p.name === "web-read" || p.name === "Web Read",
  );
  if (webPolicy?.id) {
    await ensurePermission(token, webPolicy.id, "home_blocks");
    await ensurePermission(token, webPolicy.id, "home_blocks_translations");
  }

  console.log("=== done ===");
  console.log("后台：站点配置 → 首页内容块 / 站点页面 / 站点设置");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
