import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, "web", ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

const base = env.DIRECTUS_URL;
const token = fs.readFileSync(
  process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? "D:/degson-pilot/.admin_token",
  "utf8",
).trim();
assert.ok(base && token, "web/.env.local must provide Directus URL and token");

async function api(pathname, query = {}) {
  const url = new URL(pathname, base);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const body = await response.json().catch(() => ({}));
  assert.equal(response.ok, true, `${pathname} returned ${response.status}: ${JSON.stringify(body)}`);
  return body.data;
}

const collections = await api("/collections");
const collectionNames = new Set(collections.map((item) => item.collection));
for (const name of ["media", "product_media"]) {
  assert.equal(collectionNames.has(name), true, `missing collection ${name}`);
}

const fields = async (collection) => {
  const list = await api(`/fields/${collection}`);
  return new Set(list.map((field) => field.field));
};

for (const field of ["file_id", "kind", "language", "alt", "caption", "sort", "status"]) {
  assert.equal((await fields("media")).has(field), true, `missing media.${field}`);
}
for (const field of ["product_id", "media_id", "kind", "sort", "is_primary"]) {
  assert.equal((await fields("product_media")).has(field), true, `missing product_media.${field}`);
}
for (const field of ["name", "slug", "h1", "seo_title", "seo_description", "short_description", "description"]) {
  assert.equal((await fields("product_translations")).has(field), true, `missing product_translations.${field}`);
}

const relations = await api("/relations");
const relationKey = (item) => `${item.collection}.${item.field}->${item.related_collection}`;
const relationKeys = new Set(relations.map(relationKey));
for (const expected of [
  "media.file_id->directus_files",
  "product_media.product_id->product",
  "product_media.media_id->media",
  "product_translations.product_id->product",
]) {
  assert.equal(relationKeys.has(expected), true, `missing relation ${expected}`);
}

const products = await api("/items/product", {
  "filter[status][_eq]": "published",
  fields: "id,order_no",
  limit: "1",
});
assert.ok(products.length, "expected one published product fixture");
console.log(`PASS product media schema (${products[0].order_no})`);
