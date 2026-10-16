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

const failures = [];
const collection = await get("/collections/page_sections");
if (collection.data?.meta?.translations?.some((t) => t.translation === "服务板块") !== true) {
  failures.push("collection.translation");
}
const image = await get("/fields/page_sections/image");
if (image.data?.meta?.interface !== "product-media-editor") failures.push("image.interface");
const pageSlug = await get("/fields/page_sections/page_slug");
if (pageSlug.data?.meta?.interface !== "select-dropdown") failures.push("page_slug.interface");
const items = await get("/items/page_sections?filter[page_slug][_eq]=services&fields=id,code,parent_id,list_title,status,translations.language,translations.title,translations.stat1&limit=-1");
const rows = items.data || [];
if (!rows.find((r) => r.code === "svc-rd-strength")) failures.push("missing.svc-rd-strength");
const strength = rows.find((r) => r.code === "svc-rd-strength");
const zh = (strength?.translations || []).find((t) => t.language === "zh" || t.title?.includes("研发"));
if (strength && !String(JSON.stringify(strength.translations)).includes("500")) {
  failures.push("strength.stat1");
}
if (zh && JSON.stringify(zh).includes("德昌")) failures.push("brand.德昌");
if (!rows.find((r) => r.code === "svc-rd" && (r.parent_id == null))) failures.push("rd.root");
const child = rows.find((r) => r.code === "svc-rd-strength");
const parent = rows.find((r) => r.code === "svc-rd");
if (child && parent && child.parent_id !== parent.id && child.parent_id?.id !== parent.id) {
  failures.push("strength.parent");
}

if (failures.length) {
  console.error(`FAIL ${failures.length}: ${failures.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`PASS page_sections ${rows.length} rows`);
}
