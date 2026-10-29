import assert from "node:assert/strict";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const CMS = process.env.DIRECTUS_URL ?? "http://localhost:8055";
const WEB = process.env.WEB_PREVIEW_ORIGIN ?? "http://localhost:3000";
const TOKEN =
  process.env.DIRECTUS_ADMIN_TOKEN ??
  readFileSync(process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? "D:/degson-pilot/.admin_token", "utf8").trim();
const headers = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
const statusFile = "D:/degson-pilot/cms/.revalidate-last.json";
const MARK = "接线端子·缓存验收";

async function api(method, path, body) {
  const response = await fetch(CMS + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  assert.equal(response.status, 200, `${method} ${path}: ${response.status}`);
  return result.data;
}

function h1(html) {
  const start = html.indexOf("<h1");
  if (start < 0) return "";
  const open = html.indexOf(">", start);
  const close = html.indexOf("</h1>", open);
  return html.slice(open + 1, close).replace(/<[^>]+>/g, "").trim();
}

async function page(path) {
  const response = await fetch(WEB + path, { cache: "no-store" });
  assert.equal(response.status, 200, `${path} ${response.status}`);
  return h1(await response.text());
}

const found = await api(
  "GET",
  "/items/category_translations?filter[slug][_eq]=jie-xian-duan-zi&fields=id,name,h1,slug&limit=1",
);
const row = found[0];
assert.ok(row, "missing zh terminal-blocks translation");

const beforeZh = await page("/zh/product/category/jie-xian-duan-zi");
console.log(`before zh-slug="${beforeZh}"`);

if (existsSync(statusFile)) unlinkSync(statusFile);

try {
  await api("PATCH", `/items/category_translations/${row.id}`, { name: MARK, h1: MARK });
  let status;
  for (let i = 0; i < 25; i++) {
    await sleep(200);
    if (!existsSync(statusFile)) continue;
    status = JSON.parse(readFileSync(statusFile, "utf8"));
    if (status.collection === "category_translations") break;
  }
  assert.ok(status, "hook did not write status");
  console.log(`hook ${JSON.stringify(status)}`);
  const afterZh = await page("/zh/product/category/jie-xian-duan-zi");
  const alias = await fetch(`${WEB}/zh/product/category/terminal-blocks`, {
    redirect: "manual",
    cache: "no-store",
  });
  const aliasHtml = alias.status === 200 ? await alias.text() : "";
  const location =
    alias.headers.get("location") ??
    aliasHtml.match(/http-equiv="refresh"[^>]*url=([^"]+)/i)?.[1] ??
    "";
  console.log(`after zh-slug="${afterZh}"`);
  console.log(`en-slug-status=${alias.status} location=${location}`);
  console.log(`zh-slug-updated=${afterZh.includes("缓存验收")}`);
  if (!afterZh.includes("缓存验收")) process.exitCode = 2;
  if (!location.includes("jie-xian-duan-zi")) process.exitCode = 2;
} finally {
  await api("PATCH", `/items/category_translations/${row.id}`, { name: row.name, h1: row.h1 });
  console.log("restored", row.name);
}
