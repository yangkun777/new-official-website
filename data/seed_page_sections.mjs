/**
 * 服务板块树（对齐旧宏瑞后台：左边板块、右边字段）
 *   node data/seed_page_sections.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BASE = process.env.DIRECTUS_URL || "http://localhost:8055";
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || "admin@degson.dev";
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || "degson1234";

const LANG_CHOICES = [
  { text: "英文 en", value: "en" },
  { text: "中文 zh", value: "zh" },
];

const PAGE_CHOICES = [
  { text: "服务", value: "services" },
  { text: "行业解决方案", value: "solutions" },
  { text: "关于我们", value: "about" },
];

const IMAGE_META = {
  interface: "product-media-editor",
  display: "image",
  note: "各语言共用图。某语言要单独换图，填翻译行里的「本语言图片」。",
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

async function ensureAlias(token, collection, field, meta) {
  const exists = await api("GET", `/fields/${collection}/${field}`, token);
  if (exists.status === 200) {
    await api("PATCH", `/fields/${collection}/${field}`, token, { meta });
    return;
  }
  const r = await api("POST", `/fields/${collection}`, token, {
    field,
    type: "alias",
    meta,
  });
  if (r.status >= 200 && r.status < 300) console.log(`  + alias ${collection}.${field}`);
  else throw new Error(`alias ${collection}.${field} ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
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
    return;
  }
  const msg = JSON.stringify(r.json);
  if (/already/i.test(msg)) {
    console.log(`  = 关系 ${payload.collection}.${payload.field}`);
    return;
  }
  throw new Error(`关系 ${payload.collection}.${payload.field} ${r.status}: ${msg.slice(0, 400)}`);
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

async function upsertByCode(token, payload) {
  const list = await api(
    "GET",
    `/items/page_sections?filter[code][_eq]=${encodeURIComponent(payload.code)}&fields=id&limit=1`,
    token,
  );
  const id = list.json?.data?.[0]?.id;
  if (id) {
    await api("PATCH", `/items/page_sections/${id}`, token, payload);
    return id;
  }
  const r = await api("POST", "/items/page_sections", token, payload);
  if (r.status < 200 || r.status >= 300) {
    throw new Error(`写入 page_sections ${payload.code}: ${JSON.stringify(r.json).slice(0, 400)}`);
  }
  return r.json.data.id;
}

async function upsertTranslation(token, sectionId, lang, fields) {
  const list = await api(
    "GET",
    `/items/page_sections_translations?filter[page_sections_id][_eq]=${sectionId}&filter[language][_eq]=${lang}&fields=id&limit=1`,
    token,
  );
  const payload = { page_sections_id: sectionId, language: lang, ...fields };
  const tid = list.json?.data?.[0]?.id;
  if (tid) await api("PATCH", `/items/page_sections_translations/${tid}`, token, payload);
  else {
    const r = await api("POST", "/items/page_sections_translations", token, payload);
    if (r.status < 200 || r.status >= 300) {
      throw new Error(`翻译 ${sectionId}/${lang}: ${JSON.stringify(r.json).slice(0, 400)}`);
    }
  }
}

const SECTIONS = [
  {
    code: "svc-rd",
    page_slug: "services",
    parent: null,
    sort: 10,
    list_title: "研发技术能力",
    image: null,
    zh: {
      title: "研发技术能力",
      intro:
        "高松（DEGSON）以工业连接器研发为核心，把仿真、试验、工艺与现场支持放在同一条技术链路上，让选型结论能落到可制造、可认证的产品上。",
    },
    en: {
      title: "R&D capability",
      intro:
        "DEGSON keeps connector R&D, simulation, testing and field support on one engineering chain — so selection decisions land on products that can be built and certified.",
    },
  },
  {
    code: "svc-rd-strength",
    page_slug: "services",
    parent: "svc-rd",
    sort: 20,
    list_title: "强大的研发能力",
    image: "/images/marketing/hero-services.jpg",
    zh: {
      title: "强大的研发能力",
      intro:
        "高松（DEGSON）是工业连接器整体解决方案供应商，同时拥有美国 UL 和德国 VDE 认可专业实验室的企业，公司通过了 ISO9001、ISO14001、ISO80079-34、ISO/TS22163 和 IATF16949 管理体系认证，是国家高新技术企业。30 余年的技术积淀。高松拥有 500 余名产品研发、工程技术人才，致力于工业连接器的研发创新，为社会发展科技进步做出贡献。",
      stat1: "500",
      stat1_label: "产品研发、工程技术人才",
      stat2: "30",
      stat2_label: "年连接器开发经验",
      intro1:
        "产品研发 200 多名\n模具设计 50 多名\n自动化设计 60 多名\n工程技术 200 多名",
      intro2:
        "集工业连接器研发、生产、营销为一体，为全球客户提供优质、高效的一站式解决方案。",
    },
    en: {
      title: "Engineering depth",
      intro:
        "DEGSON supplies industrial connector solutions and operates UL- and VDE-recognized laboratories. Management systems include ISO9001, ISO14001, ISO80079-34, ISO/TS22163 and IATF16949. More than 500 product and process engineers support connector development.",
      stat1: "500",
      stat1_label: "product and process engineers",
      stat2: "30",
      stat2_label: "years of connector development",
      intro1:
        "200+ product engineers\n50+ mould designers\n60+ automation designers\n200+ process engineers",
      intro2:
        "R&D, manufacturing and commercial teams work as one stack to deliver a complete connector program.",
    },
  },
  {
    code: "svc-rd-simulation",
    page_slug: "services",
    parent: "svc-rd",
    sort: 30,
    list_title: "专业的模拟仿真",
    image: "/images/marketing/feature-automation.jpg",
    zh: {
      title: "专业的模拟仿真",
      intro:
        "在开模前用电气、热与结构仿真收敛节距、载流和接触方案，减少样件轮次，让设计评审建立在可复核的数据上。",
      stat1: "CAE",
      stat1_label: "电气 / 热 / 结构仿真",
      stat2: "DFM",
      stat2_label: "可制造性前置评审",
      intro1: "针对接触电阻、温升、振动与插拔寿命建立计算模型，并与试验数据交叉验证。",
      intro2: "把仿真结论写进选型包，方便客户工程与认证同步评审。",
    },
    en: {
      title: "Simulation before tooling",
      intro:
        "Electrical, thermal and structural simulation tightens pitch, current and contact choices before tooling, so sample loops stay short.",
      stat1: "CAE",
      stat1_label: "electrical / thermal / structural",
      stat2: "DFM",
      stat2_label: "manufacturing review up front",
      intro1: "Models for contact resistance, temperature rise, vibration and mating cycles are checked against lab data.",
      intro2: "Simulation notes travel with the selection package for customer engineering and certification review.",
    },
  },
  {
    code: "svc-rd-support",
    page_slug: "services",
    parent: "svc-rd",
    sort: 40,
    list_title: "积极的技术支持",
    image: "/images/marketing/news-cover.jpg",
    zh: {
      title: "积极的技术支持",
      intro:
        "从节距、极数、对插界面到目标市场认证范围，应用工程师协助把目录选型收敛成可下单配置，并跟进样品与图纸。",
      stat1: "选型",
      stat1_label: "按工况缩小系列范围",
      stat2: "样件",
      stat2_label: "实验室与小批协同",
      intro1: "设计定稿前确认接线方式、载流与认证范围，避免量产前临时换连接器。",
      intro2: "爬坡阶段对齐包装、标识与交期窗口，让工程与采购使用同一套配置。",
    },
    en: {
      title: "Application support",
      intro:
        "Application engineers help freeze pitch, poles, mating interfaces and certification scope — then follow samples and drawings through to an orderable configuration.",
      stat1: "Select",
      stat1_label: "shortlist series by duty",
      stat2: "Sample",
      stat2_label: "lab and pilot coordination",
      intro1: "Validate wiring method, current and certification before design freeze.",
      intro2: "Align packing, labels and lead-time windows so engineering and purchasing share one configuration.",
    },
  },
  {
    code: "svc-rd-patents",
    page_slug: "services",
    parent: "svc-rd",
    sort: 50,
    list_title: "持续的发明专利",
    image: "/images/marketing/feature-energy.jpg",
    zh: {
      title: "持续的发明专利",
      intro:
        "围绕接触结构、锁紧与工艺改进持续积累专利，让常用系列在振动、温变和重复插拔工况下更可预期。",
      stat1: "专利",
      stat1_label: "结构与工艺改进",
      stat2: "系列",
      stat2_label: "可沿用量产平台",
      intro1: "优先把经过验证的结构用在标准系列，而不是每个项目重做接口。",
      intro2: "变更受控：平台升级时提供交叉参考与替代路径。",
    },
    en: {
      title: "Patents and platform reuse",
      intro:
        "Contact geometry, locking and process patents feed standard series so vibration, temperature and mating duty stay predictable.",
      stat1: "IP",
      stat1_label: "structure and process",
      stat2: "Series",
      stat2_label: "reusable production platforms",
      intro1: "Proven structures go into catalog series instead of one-off interfaces.",
      intro2: "Change control includes cross-references when platforms evolve.",
    },
  },
  {
    code: "svc-lab",
    page_slug: "services",
    parent: null,
    sort: 60,
    list_title: "认证实验室",
    image: "/images/marketing/feature-rail.jpg",
    zh: {
      title: "认证实验室",
      intro:
        "实验室能力覆盖电气、机械与部分环境试验，支撑 UL、VDE 等认证送检，以及客户项目的例行复测。",
      stat1: "UL",
      stat1_label: "认可实验室能力",
      stat2: "VDE",
      stat2_label: "认可实验室能力",
      intro1: "可提供与订货号对应的认证线索和试验摘要，避免把整本证书丢给现场。",
      intro2: "新平台导入时，先对齐目标市场的认证范围再冻结结构。",
    },
    en: {
      title: "Certified laboratories",
      intro:
        "In-house electrical, mechanical and selected environmental tests support UL/VDE filings and routine project retests.",
      stat1: "UL",
      stat1_label: "recognized lab capability",
      stat2: "VDE",
      stat2_label: "recognized lab capability",
      intro1: "Certification pointers stay tied to the order number you actually buy.",
      intro2: "New platforms freeze structure only after target-market certification scope is clear.",
    },
  },
  {
    code: "svc-download",
    page_slug: "services",
    parent: null,
    sort: 70,
    list_title: "下载中心",
    image: "/images/marketing/home-feature-energy.jpg",
    zh: {
      title: "下载中心",
      intro:
        "图纸、规格书与认证摘要按订货号归档。本试点站点持续把可下载资料迁入后台，避免多套网页各存一份。",
      intro1: "优先下载与当前订货号一致的图纸和规格，而不是系列封面图。",
      intro2: "如需完整技术资料包，可通过询盘说明应用工况与认证市场。",
    },
    en: {
      title: "Downloads",
      intro:
        "Drawings, datasheets and certification notes are filed by order number. This pilot site is moving packages into one CMS instead of duplicated HTML.",
      intro1: "Download the drawing that matches the order number, not a series hero image.",
      intro2: "For a full technical pack, include duty cycle and target markets in the enquiry.",
    },
  },
  {
    code: "svc-faq",
    page_slug: "services",
    parent: null,
    sort: 80,
    list_title: "FAQ",
    image: null,
    zh: {
      title: "常见问题",
      intro: "选型与供货中最常被问到的几件事。",
      intro1: "如何确认认证范围？\n以订货号对应的认证摘要为准，不要只看系列宣传页。",
      intro2: "样品周期如何安排？\n说明节距、极数、对插界面和目标市场，应用团队会协调实验室或小批样件。",
    },
    en: {
      title: "FAQ",
      intro: "The questions that come up most during selection and supply.",
      intro1: "How do we confirm certification scope?\nUse the notes tied to the order number, not the series brochure.",
      intro2: "How are samples scheduled?\nShare pitch, poles, mating interface and target markets so application engineering can align lab or pilot parts.",
    },
  },
];

async function main() {
  console.log("=== seed_page_sections ===");
  const token = await getToken();

  await ensureCollection(token, "page_sections", {
    icon: "account_tree",
    group: "content_management",
    hidden: false,
    sort: 5,
    display_template: "{{list_title}}",
    archive_field: "status",
    archive_value: "draft",
    unarchive_value: "published",
    sort_field: "sort",
    note: "服务、方案、关于页的板块。先选所属页面和上级，再在「多语言内容」里填正文、图片和数据。",
    translations: [{ language: "zh-CN", translation: "页面板块" }],
  });

  await ensureField(token, "page_sections", "code", "string", { max_length: 64, is_unique: true }, {
    hidden: true,
    readonly: true,
    note: "内部标识，种子数据用，运营不用填",
    translations: [{ language: "zh-CN", translation: "内部标识" }],
  });
  await ensureField(token, "page_sections", "page_slug", "string", { max_length: 32, is_nullable: false, default_value: "services" }, {
    required: true,
    interface: "select-dropdown",
    options: { choices: PAGE_CHOICES },
    note: "选择板块所属页面；服务、方案、关于的已发布板块会在前台展示。",
    width: "half",
    translations: [{ language: "zh-CN", translation: "所属页面" }],
  });
  await ensureField(token, "page_sections", "parent_id", "integer", {}, {
    interface: "select-dropdown-m2o",
    display: "related-values",
    display_options: { template: "{{list_title}}" },
    special: ["m2o"],
    note: "上级板块；顶级板块留空。例如「强大的研发能力」的上级是「研发技术能力」。",
    width: "half",
    translations: [{ language: "zh-CN", translation: "上级板块" }],
  });
  await ensureField(token, "page_sections", "list_title", "string", { max_length: 128, is_nullable: false }, {
    required: true,
    interface: "input",
    note: "后台列表和左边层级显示用，不直接当 H1。",
    translations: [{ language: "zh-CN", translation: "后台显示名" }],
  });
  await ensureField(token, "page_sections", "sort", "integer", { default_value: 0 }, {
    interface: "input",
    width: "half",
    note: "数字越小越靠前",
    translations: [{ language: "zh-CN", translation: "显示顺序" }],
  });
  await ensureField(token, "page_sections", "status", "string", { max_length: 16, default_value: "draft" }, {
    interface: "select-dropdown",
    options: { choices: [{ text: "已发布", value: "published" }, { text: "草稿", value: "draft" }] },
    width: "half",
    note: "仅发布状态会出现在官网",
    translations: [{ language: "zh-CN", translation: "状态" }],
  });
  await ensureField(token, "page_sections", "image", "string", { max_length: 512 }, {
    ...IMAGE_META,
    translations: [{ language: "zh-CN", translation: "图片" }],
  });

  await ensureCollection(token, "page_sections_translations", {
    hidden: true,
    group: "content_management",
    sort: 4,
    icon: "translate",
    display_template: "{{title}}",
    translations: [{ language: "zh-CN", translation: "页面板块翻译" }],
  });
  await ensureField(token, "page_sections_translations", "page_sections_id", "integer", {}, {
    hidden: true,
    translations: [{ language: "zh-CN", translation: "所属板块" }],
  });
  await ensureField(token, "page_sections_translations", "language", "string", { max_length: 8, is_nullable: false }, {
    required: true,
    interface: "select-dropdown",
    options: { choices: LANG_CHOICES },
    width: "half",
    note: "语言码固定使用 en / zh",
    translations: [{ language: "zh-CN", translation: "语言" }],
  });
  await ensureField(token, "page_sections_translations", "title", "string", { max_length: 255 }, {
    interface: "input",
    translations: [{ language: "zh-CN", translation: "标题" }],
  });
  await ensureField(token, "page_sections_translations", "intro", "text", {}, {
    interface: "input-multiline",
    note: "板块开篇说明，对应旧后台「简介」",
    translations: [{ language: "zh-CN", translation: "简介" }],
  });
  await ensureField(token, "page_sections_translations", "stat1", "string", { max_length: 32 }, {
    interface: "input",
    width: "half",
    note: "数字或短标签，例如 500",
    translations: [{ language: "zh-CN", translation: "数据 1" }],
  });
  await ensureField(token, "page_sections_translations", "stat1_label", "string", { max_length: 255 }, {
    interface: "input",
    width: "half",
    translations: [{ language: "zh-CN", translation: "数据 1 介绍" }],
  });
  await ensureField(token, "page_sections_translations", "stat2", "string", { max_length: 32 }, {
    interface: "input",
    width: "half",
    translations: [{ language: "zh-CN", translation: "数据 2" }],
  });
  await ensureField(token, "page_sections_translations", "stat2_label", "string", { max_length: 255 }, {
    interface: "input",
    width: "half",
    translations: [{ language: "zh-CN", translation: "数据 2 介绍" }],
  });
  await ensureField(token, "page_sections_translations", "intro1", "text", {}, {
    interface: "input-rich-text-html",
    note: "板块正文。可用标题、列表、链接和图片。",
    translations: [{ language: "zh-CN", translation: "介绍 1" }],
  });
  await ensureField(token, "page_sections_translations", "intro2", "text", {}, {
    interface: "input-rich-text-html",
    note: "补充正文，可留空。",
    translations: [{ language: "zh-CN", translation: "介绍 2" }],
  });
  await ensureField(token, "page_sections_translations", "image", "string", { max_length: 512 }, {
    ...IMAGE_META,
    note: "本语言板块图。留空则用板块上的共用图。",
    translations: [{ language: "zh-CN", translation: "本语言图片" }],
  });
  await ensureField(token, "page_sections_translations", "cta", "string", { max_length: 64 }, {
    interface: "input",
    width: "half",
    note: "按钮文字，例如「查看服务」。没有按钮的板块可留空。",
    translations: [{ language: "zh-CN", translation: "按钮文字" }],
  });

  await ensureAlias(token, "page_sections", "translations", {
    interface: "list-o2m",
    special: ["o2m"],
    options: {
      enableCreate: true,
      enableSelect: false,
      template: "{{language}} · {{title}}",
    },
    note: "按语言填写简介、正文和图片。一般保留中文 zh、英文 en 各一条。",
    translations: [{ language: "zh-CN", translation: "多语言内容" }],
  });
  await ensureAlias(token, "page_sections", "children", {
    interface: "list-o2m",
    special: ["o2m"],
    options: {
      enableCreate: true,
      enableSelect: true,
      template: "{{list_title}}",
    },
    note: "本板块下的二级内容。也可以在列表里把「上级板块」指过来。",
    translations: [{ language: "zh-CN", translation: "子板块" }],
  });

  await ensureRelation(token, {
    collection: "page_sections",
    field: "parent_id",
    related_collection: "page_sections",
    meta: {
      many_collection: "page_sections",
      many_field: "parent_id",
      one_collection: "page_sections",
      one_field: "children",
      one_deselect_action: "nullify",
    },
    schema: { on_delete: "SET NULL" },
  });
  await ensureRelation(token, {
    collection: "page_sections_translations",
    field: "page_sections_id",
    related_collection: "page_sections",
    meta: {
      many_collection: "page_sections_translations",
      many_field: "page_sections_id",
      one_collection: "page_sections",
      one_field: "translations",
      one_deselect_action: "nullify",
    },
    schema: { on_delete: "CASCADE" },
  });

  const ids = {};
  for (const section of SECTIONS) {
    const parentId = section.parent ? ids[section.parent] : null;
    const id = await upsertByCode(token, {
      code: section.code,
      page_slug: section.page_slug,
      parent_id: parentId,
      list_title: section.list_title,
      sort: section.sort,
      status: "published",
      image: section.image,
    });
    ids[section.code] = id;
    await upsertTranslation(token, id, "zh", section.zh);
    await upsertTranslation(token, id, "en", section.en);
    console.log(`= 板块 ${section.list_title} (#${id})`);
  }

  const policies = await api("GET", "/policies?limit=-1", token);
  const webPolicy = (policies.json?.data || []).find(
    (p) => p.name === "web-read" || p.name === "Web Read",
  );
  if (webPolicy?.id) {
    await ensurePermission(token, webPolicy.id, "page_sections");
    await ensurePermission(token, webPolicy.id, "page_sections_translations");
  }

  console.log("=== done ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
