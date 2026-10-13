import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const snapshot = await readFile(new URL("../cms/snapshot.yaml", import.meta.url), "utf8");
const constraintSql = await readFile(new URL("./04_constraints.sql", import.meta.url), "utf8").catch(() => "");

function fieldBlock(collection, field) {
  const escapedCollection = collection.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `- collection: ${escapedCollection}\\s+field: ${escapedField}\\b[\\s\\S]*?\\n  - collection:`,
  );
  return snapshot.match(pattern)?.[0] ?? "";
}

function assertSnapshotUnique(collection, field) {
  const block = fieldBlock(collection, field);
  assert.match(block, /is_unique: true/, `${collection}.${field} must be unique in snapshot`);
  assert.match(block, /is_indexed: true/, `${collection}.${field} must be indexed in snapshot`);
}

assertSnapshotUnique("product", "order_no");
assertSnapshotUnique("series", "matecode");

assert.match(constraintSql, /uq_category_translations_parent_language/);
assert.match(constraintSql, /uq_series_translations_parent_language/);
assert.match(constraintSql, /uq_product_translations_parent_language/);
assert.match(constraintSql, /uq_news_translations_parent_language/);
assert.match(constraintSql, /uq_category_translations_language_slug/);
assert.match(constraintSql, /uq_series_translations_language_slug/);
assert.match(constraintSql, /uq_product_translations_language_slug/);
assert.match(constraintSql, /uq_news_translations_language_slug/);

console.log("PASS content identity constraints");
