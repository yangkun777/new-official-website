/**
 * 方案 / 服务 / 关于：翻译行正文用富文本，封面与板块图可按语言覆盖。
 * node data/apply_marketing_i18n.mjs
 */
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
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, json };
}

const IMAGE_META = {
  interface: "product-media-editor",
  display: "image",
  width: "full",
};

const RICH_META = {
  interface: "input-rich-text-html",
  options: {
    toolbar: [
      "bold", "italic", "underline", "removeformat",
      "bullist", "numlist", "blockquote",
      "h2", "h3", "link", "unlink", "image",
    ],
  },
};

async function ensureField(collection, field, type, schema, meta) {
  const exists = await api("GET", `/fields/${collection}/${field}`);
  if (exists.status === 200) {
    const patched = await api("PATCH", `/fields/${collection}/${field}`, { meta });
    if (patched.status < 200 || patched.status >= 300) {
      throw new Error(`PATCH ${collection}.${field} ${patched.status} ${JSON.stringify(patched.json).slice(0, 300)}`);
    }
    return;
  }
  const created = await api("POST", `/fields/${collection}`, {
    field,
    type,
    schema: { is_nullable: true, ...schema },
    meta,
  });
  if (created.status < 200 || created.status >= 300) {
    throw new Error(`POST ${collection}.${field} ${created.status} ${JSON.stringify(created.json).slice(0, 300)}`);
  }
  console.log(`+ ${collection}.${field}`);
}

await ensureField("site_pages_translations", "cover_image", "string", { max_length: 512 }, {
  ...IMAGE_META,
  note: "本语言页头图。留空则用页面上的共用封面。",
  translations: [{ language: "zh-CN", translation: "本语言封面图" }],
});
for (const [field, label] of [
  ["panel_1_image", "本语言图文 1 图片"],
  ["panel_2_image", "本语言图文 2 图片"],
  ["panel_3_image", "本语言图文 3 图片"],
]) {
  await ensureField("site_pages_translations", field, "string", { max_length: 512 }, {
    ...IMAGE_META,
    note: "本语言图文卡图片。留空则用页面上对应的共用图。",
    translations: [{ language: "zh-CN", translation: label }],
  });
}
await ensureField("site_pages_translations", "body", "text", {}, {
  ...RICH_META,
  note: "页面正文，前台按富文本展示。可用标题、列表、链接和图片。",
  translations: [{ language: "zh-CN", translation: "正文" }],
});

await ensureField("page_sections_translations", "image", "string", { max_length: 512 }, {
  ...IMAGE_META,
  note: "本语言板块图。留空则用板块上的共用图。",
  translations: [{ language: "zh-CN", translation: "本语言图片" }],
});
await ensureField("page_sections_translations", "cta", "string", { max_length: 64 }, {
  interface: "input",
  width: "half",
  note: "按钮文字，例如「查看服务」。没有按钮的板块可留空。",
  translations: [{ language: "zh-CN", translation: "按钮文字" }],
});
await ensureField("page_sections_translations", "intro1", "text", {}, {
  ...RICH_META,
  note: "板块正文。可用标题、列表、链接和图片。",
  translations: [{ language: "zh-CN", translation: "介绍 1" }],
});
await ensureField("page_sections_translations", "intro2", "text", {}, {
  ...RICH_META,
  note: "补充正文，可留空。",
  translations: [{ language: "zh-CN", translation: "介绍 2" }],
});

const support = await api(
  "GET",
  "/items/page_sections?filter[code][_eq]=sol-support&fields=id&limit=1",
);
const supportId = support.json?.data?.[0]?.id;
if (supportId) {
  const rows = await api(
    "GET",
    `/items/page_sections_translations?filter[page_sections_id][_eq]=${supportId}&fields=id,language,cta&limit=-1`,
  );
  const labels = { zh: "查看服务", en: "Explore services" };
  for (const row of rows.json?.data ?? []) {
    if (row.cta) continue;
    const cta = labels[row.language];
    if (!cta) continue;
    await api("PATCH", `/items/page_sections_translations/${row.id}`, { cta });
    console.log(`sol-support ${row.language} cta`);
  }
}

console.log("marketing i18n fields ready");
