import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const BASE = process.env.DIRECTUS_URL ?? "http://localhost:8055";
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN ?? readFileSync(process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? "D:/degson-pilot/.admin_token", "utf8").trim();
const headers = { Authorization: `Bearer ${TOKEN}` };

const PRESETS = {
  category: "image",
  series: "image",
  news: "cover_image",
  home_banner: "image",
  home_blocks: "image",
  media: "file_id",
};

const res = await fetch(`${BASE}/presets?limit=-1`, { headers });
assert.equal(res.status, 200);
const presets = (await res.json()).data ?? [];

for (const [collection, imageField] of Object.entries(PRESETS)) {
  const personal = presets.filter((item) => item.collection === collection && (item.user != null || item.role != null));
  const system = presets.find((item) => item.collection === collection && item.user == null && item.role == null);
  assert.ok(system, `${collection} missing system preset`);
  assert.equal(system.layout, "tabular");
  const fields = system.layout_query?.tabular?.fields ?? [];
  assert.equal(fields[0], imageField, `${collection} first column should be ${imageField}`);
  for (const preset of personal) {
    if (preset.layout !== "tabular") continue;
    const personalFields = preset.layout_query?.tabular?.fields ?? [];
    assert.equal(personalFields[0], imageField, `${collection} personal preset ${preset.id} should show ${imageField} first`);
  }
}

console.log("PASS admin list presets");
