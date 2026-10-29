import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const catalog = readFileSync("web/src/lib/catalogData.ts", "utf8");
assert.match(catalog, /availableLangs\.includes\(lang\)/, "catalog groups must skip languages without a translation");

const BASE = process.env.DIRECTUS_URL ?? "http://localhost:8055";
const TOKEN =
  process.env.DIRECTUS_ADMIN_TOKEN ??
  readFileSync(process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? "D:/degson-pilot/.admin_token", "utf8").trim();
const headers = { Authorization: `Bearer ${TOKEN}` };

const expected = [
  { en: "terminal-blocks", zh: "jie-xian-duan-zi", name: "接线端子" },
  { en: "pluggable-terminal-blocks", zh: "cha-ba-shi-jie-xian-duan-zi", name: "插拔式接线端子" },
  { en: "pcb-plug", zh: "pcb-cha-tou", name: "PCB 插头" },
  { en: "pcb-socket", zh: "pcb-cha-zuo", name: "PCB 插座" },
  { en: "din-rail-panel-mounting-connector", zh: "dao-gui-mian-ban-an-zhuang-lian-jie-qi", name: "导轨 / 面板安装连接器" },
];

for (const item of expected) {
  const response = await fetch(
    `${BASE}/items/category?filter[translations][slug][_eq]=${encodeURIComponent(item.en)}&fields=id,translations.language,translations.name,translations.slug&limit=1`,
    { headers },
  );
  assert.equal(response.status, 200, `${item.en} ${response.status}`);
  const category = (await response.json()).data?.[0];
  assert.ok(category, `missing category ${item.en}`);
  const zh = (category.translations ?? []).find((row) => row.language === "zh");
  assert.ok(zh, `${item.en} missing zh translation`);
  assert.equal(zh.slug, item.zh);
  assert.equal(zh.name, item.name);
}

console.log("PASS zh terminal subcategories");
