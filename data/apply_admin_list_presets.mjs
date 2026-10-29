/** System tabular presets: image column first. Does not change product excel-tabular. */
import { readFileSync } from "node:fs";

const BASE = process.env.DIRECTUS_URL ?? "http://localhost:8055";
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN ?? readFileSync(process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? "D:/degson-pilot/.admin_token", "utf8").trim();
const headers = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

const PRESETS = {
  category: ["image", "level", "parent_id", "sort", "status"],
  series: ["image", "matecode", "category_id", "sort", "status"],
  news: ["cover_image", "publish_date", "sort", "status"],
  home_banner: ["image", "label", "link_path", "sort", "status"],
  home_blocks: ["image", "label", "kind", "sort", "status"],
  media: ["file_id", "kind", "language", "sort", "status"],
};

async function api(method, path, body) {
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const listed = await api("GET", "/presets?limit=-1");
const presets = listed.json?.data ?? [];
let upserted = 0;
for (const [collection, fields] of Object.entries(PRESETS)) {
  const existing = presets.find((item) => item.collection === collection && item.user == null && item.role == null);
  const payload = {
    collection,
    layout: "tabular",
    layout_query: {
      tabular: { fields, sort: ["sort"], page: 1, limit: 25 },
    },
    layout_options: {
      tabular: { widths: { [fields[0]]: 80 } },
    },
  };
  if (existing) {
    const r = await api("PATCH", `/presets/${existing.id}`, payload);
    if (r.status < 200 || r.status >= 300) throw new Error(`preset ${collection} ${r.status}`);
  } else {
    const r = await api("POST", "/presets", payload);
    if (r.status < 200 || r.status >= 300) throw new Error(`preset ${collection} ${JSON.stringify(r.json).slice(0, 300)}`);
  }
  upserted += 1;
}

console.log(`PASS list presets upserted=${upserted} personal_preserved=true`);
