/**
 * 演示用：站点营销页 + 四个社交外链
 * 幂等建集合/字段/种子；需 Directus 在 8055 且 .admin_token 有效
 *
 *   node data/seed_demo_marketing.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BASE = process.env.DIRECTUS_URL || "http://localhost:8055";
const TOKEN = readFileSync(
  process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? join(ROOT, ".admin_token"),
  "utf8",
).trim();

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
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

async function ensureCollection(name, meta = {}) {
  const all = await api("GET", "/collections");
  const exists = (all.json?.data || []).some((c) => c.collection === name);
  const fullMeta = {
    icon: meta.icon ?? "article",
    ...meta,
  };
  if (!exists) {
    const r = await api("POST", "/collections", {
      collection: name,
      meta: fullMeta,
      schema: {},
    });
    if (r.status < 200 || r.status >= 300) {
      throw new Error(`集合 ${name} 失败 ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
    }
    console.log(`+ 集合 ${name}`);
  } else {
    const r = await api("PATCH", `/collections/${name}`, { meta: fullMeta });
    if (r.status < 200 || r.status >= 300) {
      throw new Error(`更新集合 ${name} 失败 ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
    }
    console.log(`= 集合 ${name}（已更新中文名）`);
  }
}

async function ensureField(collection, field, type, schema = {}, meta = {}) {
  const r0 = await api("GET", `/fields/${collection}/${field}`);
  if (r0.status === 200) {
    return;
  }
  const r = await api("POST", `/fields/${collection}`, {
    field,
    type,
    schema: { is_nullable: true, ...schema },
    meta: { interface: type === "text" ? "input-multiline" : "input", ...meta },
  });
  if (r.status < 200 || r.status >= 300) {
    throw new Error(`字段 ${collection}.${field} 失败 ${r.status}`);
  }
  console.log(`  + 字段 ${collection}.${field}`);
}

async function ensureRelation(payload) {
  const list = await api(
    "GET",
    `/relations?filter[collection][_eq]=${payload.collection}&filter[field][_eq]=${payload.field}`,
  );
  if ((list.json?.data || []).length) return;
  const r = await api("POST", "/relations", payload);
  if (r.status < 200 || r.status >= 300) {
    console.warn(`  ~ 关系 ${payload.collection}.${payload.field} ${r.status}`);
  } else {
    console.log(`  + 关系 ${payload.collection}.${payload.field}`);
  }
}

async function ensurePermission(policyId, collection) {
  const perms = await api(
    "GET",
    `/permissions?limit=-1&filter[policy][_eq]=${policyId}&filter[collection][_eq]=${collection}&filter[action][_eq]=read`,
  );
  if ((perms.json?.data || []).length) return;
  const r = await api("POST", "/permissions", {
    policy: policyId,
    collection,
    action: "read",
    fields: ["*"],
    permissions: {},
    validation: {},
    presets: {},
  });
  if (r.status < 200 || r.status >= 300) {
    console.warn(`  ~ 权限 ${collection} ${r.status}`);
  } else {
    console.log(`  + 权限 read ${collection}`);
  }
}

const PAGES = [
  {
    slug: "solutions",
    sort: 1,
    en: {
      title: "Industry Solutions",
      summary:
        "DEGSON delivers reliable connectivity for industrial automation, energy, rail and equipment OEMs.",
      body: `From terminal blocks to high-current connectors, DEGSON helps engineers design safer, denser and easier-to-maintain electrical interfaces.

We work with OEMs and system integrators to map application requirements — pitch, poles, current rating and certification — to the right product families.

Whether you need a catalog series or a coordinated multi-SKU package, our application team supports selection, documentation and long-term supply.`,
      seo_title: "Industry Solutions | DEGSON",
      seo_description:
        "Industrial connectivity solutions for automation, energy and equipment OEMs.",
    },
    zh: {
      title: "行业解决方案",
      summary: "面向工业自动化、能源、轨交与设备 OEM 的可靠连接方案。",
      body: `从接线端子到大电流连接器，DEGSON 帮助工程师设计更安全、更紧凑、更易维护的电气接口。

我们与整机厂和系统集成商一起，把应用需求（节距、极数、载流、认证）映射到合适的产品系列。

无论是标准系列选型，还是多订货号协同配套，应用团队均可提供选型、资料与长期供货支持。`,
      seo_title: "行业解决方案 | DEGSON",
      seo_description: "工业自动化、能源与设备 OEM 的连接解决方案。",
    },
  },
  {
    slug: "services",
    sort: 2,
    en: {
      title: "Services",
      summary: "Selection support, documentation, samples and lifecycle care.",
      body: `Our service model covers the full product lifecycle: catalog guidance, sample coordination, drawing packages and after-sales follow-up.

Application engineers help you validate poles, pitch and mating interfaces before you freeze a design.

For volume programs we align lead times, packaging and change control so production stays predictable.`,
      seo_title: "Services | DEGSON",
      seo_description: "DEGSON engineering and commercial services for connectors.",
    },
    zh: {
      title: "服务",
      summary: "选型支持、技术资料、样品与全生命周期服务。",
      body: `服务覆盖产品全生命周期：目录选型、样品协调、工程图纸资料与售后跟进。

应用工程师可在设计定稿前，协助确认极数、节距与对插接口。

批量项目中，我们协同交期、包装与变更管控，让量产更可预期。`,
      seo_title: "服务 | DEGSON",
      seo_description: "DEGSON 连接器工程与商务服务。",
    },
  },
  {
    slug: "about",
    sort: 3,
    en: {
      title: "About DEGSON",
      summary: "An industrial connector manufacturer focused on reliability and global delivery.",
      body: `DEGSON designs and manufactures terminal blocks and connectors used across industrial equipment worldwide.

We combine manufacturing depth with structured product data so engineers can find the right order number quickly and trust the documentation behind it.

This new website is being rebuilt on a single multilingual content platform — one catalog, many languages — so customers and teams no longer maintain duplicated sites.`,
      seo_title: "About DEGSON",
      seo_description: "About DEGSON — industrial terminal blocks and connectors.",
    },
    zh: {
      title: "关于高松",
      summary: "专注可靠连接与全球交付的工业连接器制造商。",
      body: `DEGSON（高松）设计并制造广泛应用于工业设备的接线端子与连接器。

我们将制造能力与结构化产品数据结合，帮助工程师更快找到正确订货号，并信任背后的技术资料。

新官网正以「一套内容、多语言站点」重建，客户与团队不再维护多套重复站点。`,
      seo_title: "关于高松 | DEGSON",
      seo_description: "关于 DEGSON 高松 — 工业接线端子与连接器。",
    },
  },
];

const SOCIAL = [
  { platform: "twitter", label: "Twitter / X", url: "https://twitter.com/", sort: 1 },
  { platform: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/", sort: 2 },
  { platform: "youtube", label: "YouTube", url: "https://www.youtube.com/", sort: 3 },
  { platform: "facebook", label: "Facebook", url: "https://www.facebook.com/", sort: 4 },
];

async function main() {
  console.log("=== seed_demo_marketing ===");

  await ensureCollection("site_pages", {
    note: "改这里就是前台「行业解决方案 / 服务 / 关于我们」",
    display_template: "{{list_title}}",
    icon: "web",
    group: "content_management",
    hidden: false,
    sort: 3,
    translations: [{ language: "zh-CN", translation: "方案 / 服务 / 关于" }],
  });
  await ensureField("site_pages", "slug", "string", { max_length: 64, is_nullable: false, is_unique: true }, {
    required: true,
    interface: "input",
    translations: [{ language: "zh-CN", translation: "页面标识" }],
  });
  await ensureField("site_pages", "status", "string", { max_length: 32, default_value: "published" }, {
    interface: "select-dropdown",
    options: { choices: [{ text: "已发布", value: "published" }, { text: "草稿", value: "draft" }] },
    translations: [{ language: "zh-CN", translation: "状态" }],
  });
  await ensureField("site_pages", "sort", "integer", { default_value: 0 }, {
    interface: "input",
    translations: [{ language: "zh-CN", translation: "显示顺序" }],
  });

  await ensureCollection("site_pages_translations", {
    note: "站点页面翻译",
    icon: "translate",
    group: "site_configuration",
    hidden: true,
    sort: 5,
    translations: [{ language: "zh-CN", translation: "站点页面翻译" }],
  });
  await ensureField("site_pages_translations", "site_pages_id", "integer", {}, {
    interface: "select-dropdown-m2o",
  });
  await ensureField("site_pages_translations", "language", "string", { max_length: 8, is_nullable: false }, {
    required: true,
    interface: "input",
    translations: [{ language: "zh-CN", translation: "语言" }],
  });
  await ensureField("site_pages_translations", "title", "string", { max_length: 255 }, {
    translations: [{ language: "zh-CN", translation: "标题" }],
  });
  await ensureField("site_pages_translations", "summary", "text", {}, {
    interface: "input-multiline",
    translations: [{ language: "zh-CN", translation: "摘要" }],
  });
  await ensureField("site_pages_translations", "body", "text", {}, {
    interface: "input-multiline",
    translations: [{ language: "zh-CN", translation: "正文" }],
  });
  await ensureField("site_pages_translations", "seo_title", "string", { max_length: 255 }, {
    translations: [{ language: "zh-CN", translation: "SEO 标题" }],
  });
  await ensureField("site_pages_translations", "seo_description", "text", {}, {
    interface: "input-multiline",
    translations: [{ language: "zh-CN", translation: "SEO 描述" }],
  });

  // O2M alias on site_pages
  const alias = await api("GET", "/fields/site_pages/translations");
  if (alias.status !== 200) {
    const r = await api("POST", "/fields/site_pages", {
      field: "translations",
      type: "alias",
      meta: {
        interface: "translations",
        special: ["translations"],
        translations: [{ language: "zh-CN", translation: "多语言内容" }],
      },
    });
    if (r.status >= 200 && r.status < 300) console.log("  + alias site_pages.translations");
  }

  {
    const rel = await api("POST", "/relations", {
      collection: "site_pages_translations",
      field: "site_pages_id",
      related_collection: "site_pages",
      meta: {
        many_collection: "site_pages_translations",
        many_field: "site_pages_id",
        one_collection: "site_pages",
        one_field: "translations",
        one_deselect_action: "nullify",
      },
      schema: { on_delete: "CASCADE" },
    });
    if (rel.status >= 200 && rel.status < 300) {
      console.log("  + 关系 site_pages_translations → site_pages (O2M translations)");
    } else if (/already/i.test(JSON.stringify(rel.json))) {
      console.log("  = 关系已存在");
    } else {
      console.warn("  ~ 关系", rel.status, JSON.stringify(rel.json).slice(0, 200));
    }
  }

  await ensureCollection("social_links", {
    note: "社交外链（Twitter/LinkedIn/YouTube/Facebook）",
    display_template: "{{platform}}",
    icon: "share",
    group: "site_configuration",
    hidden: false,
    sort: 4,
    translations: [{ language: "zh-CN", translation: "社交外链" }],
  });
  await ensureField("social_links", "platform", "string", { max_length: 32, is_nullable: false, is_unique: true }, {
    required: true,
    interface: "select-dropdown",
    options: {
      choices: [
        { text: "Twitter / X", value: "twitter" },
        { text: "领英 LinkedIn", value: "linkedin" },
        { text: "YouTube", value: "youtube" },
        { text: "Facebook", value: "facebook" },
      ],
    },
    translations: [{ language: "zh-CN", translation: "平台" }],
  });
  await ensureField("social_links", "label", "string", { max_length: 64 }, {
    translations: [{ language: "zh-CN", translation: "显示名称" }],
  });
  await ensureField("social_links", "url", "string", { max_length: 512 }, {
    interface: "input",
    translations: [{ language: "zh-CN", translation: "跳转链接" }],
  });
  await ensureField("social_links", "sort", "integer", { default_value: 0 }, {
    translations: [{ language: "zh-CN", translation: "显示顺序" }],
  });
  await ensureField("social_links", "status", "string", { max_length: 32, default_value: "published" }, {
    interface: "select-dropdown",
    options: { choices: [{ text: "已发布", value: "published" }, { text: "停用", value: "draft" }] },
    translations: [{ language: "zh-CN", translation: "状态" }],
  });

  // seed pages：先主表，再分别写翻译行（避免 alias 嵌套写入踩坑）
  for (const page of PAGES) {
    const existing = await api(
      "GET",
      `/items/site_pages?filter[slug][_eq]=${page.slug}&fields=id,slug&limit=1`,
    );
    let id = existing.json?.data?.[0]?.id;
    if (!id) {
      const created = await api("POST", "/items/site_pages", {
        slug: page.slug,
        status: "published",
        sort: page.sort,
      });
      if (created.status < 200 || created.status >= 300) {
        console.error("创建页面失败", page.slug, created.status, created.json);
        continue;
      }
      id = created.json?.data?.id;
      console.log(`+ 页面 ${page.slug} id=${id}`);
    } else {
      console.log(`= 页面 ${page.slug} id=${id}`);
    }

    const trans = await api(
      "GET",
      `/items/site_pages_translations?filter[site_pages_id][_eq]=${id}&fields=id,language&limit=-1`,
    );
    const rows = trans.json?.data || [];
    for (const lang of ["en", "zh"]) {
      const payload = { site_pages_id: id, language: lang, ...page[lang] };
      const hit = rows.find((r) => r.language === lang);
      if (hit) {
        const r = await api("PATCH", `/items/site_pages_translations/${hit.id}`, payload);
        console.log(`  ${r.status >= 200 && r.status < 300 ? "=" : "✗"} 翻译 ${page.slug}/${lang}`);
      } else {
        const r = await api("POST", "/items/site_pages_translations", payload);
        console.log(`  ${r.status >= 200 && r.status < 300 ? "+" : "✗"} 翻译 ${page.slug}/${lang}`);
      }
    }
  }

  for (const s of SOCIAL) {
    const existing = await api(
      "GET",
      `/items/social_links?filter[platform][_eq]=${s.platform}&fields=id&limit=1`,
    );
    if (existing.json?.data?.[0]?.id) {
      console.log(`= 社交 ${s.platform}`);
      continue;
    }
    const r = await api("POST", "/items/social_links", {
      ...s,
      status: "published",
    });
    if (r.status >= 200 && r.status < 300) console.log(`+ 社交 ${s.platform}`);
    else console.error("社交失败", s.platform, r.status, r.json);
  }

  // web-read policy permissions
  const policies = await api("GET", "/policies?limit=-1");
  const webPolicy = (policies.json?.data || []).find(
    (p) => p.name === "web-read" || p.name === "Web Read",
  );
  if (webPolicy?.id) {
    for (const c of ["site_pages", "site_pages_translations", "social_links"]) {
      await ensurePermission(webPolicy.id, c);
    }
  } else {
    console.warn("未找到 web-read policy，请稍后重跑 make_web_token.mjs");
  }

  // site_settings 中英 Hero / 页脚（主表英文字段 + *_zh 中文字段）
  for (const [field, label] of [
    ["hero_title_zh", "Hero 标题（中文）"],
    ["hero_subtitle_zh", "Hero 副标题（中文）"],
    ["site_description_zh", "站点描述（中文）"],
    ["footer_text_zh", "页脚文案（中文）"],
  ]) {
    await ensureField("site_settings", field, "string", { max_length: 512 }, {
      interface: "input",
      translations: [{ language: "zh-CN", translation: label }],
    });
  }
  const settingsPatch = await api("PATCH", "/items/site_settings/1", {
    hero_title_zh: "以可靠连接赢得信赖",
    hero_subtitle_zh: "接线端子、连接器与工业组件",
    site_description_zh: "高松工业连接解决方案，包括接线端子、连接器和工业组件。",
    footer_text_zh: "© 高松 DEGSON 保留所有权利。",
  });
  console.log(
    settingsPatch.status >= 200 && settingsPatch.status < 300
      ? "= site_settings 中文 Hero/页脚"
      : "✗ site_settings 中文补丁失败",
  );

  console.log("=== done ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
