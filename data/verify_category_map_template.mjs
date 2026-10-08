import assert from "node:assert/strict";
import { renderCategoryMapCsv, renderCategoryMapMarkdown } from "./migration/buildCategoryMapTemplate.mjs";

const rows = [
  {
    category_legacy_id: "231582",
    source_category_exists: false,
    external_map_exists: false,
    series_count: 238,
    product_count: 2400,
    sample_series: [{ legacy_id: "10", matecode: "S-READY", name: "Ready series" }],
  },
  { category_legacy_id: "99", source_category_exists: true, external_map_exists: false, series_count: 1, product_count: 2 },
];

const csv = renderCategoryMapCsv(rows);
assert.match(csv, /^legacy_category_id,target_id,status,reviewer,reason,series_count,product_count/m);
assert.match(csv, /231582,,PENDING,,,238,2400/);
assert.match(csv, /S-READY/);
assert.doesNotMatch(csv, /new-category/);

const markdown = renderCategoryMapMarkdown(rows, "2026-10-08T00:00:00.000Z");
assert.match(markdown, /分类映射待裁决/);
assert.match(markdown, /231582/);
assert.match(markdown, /PENDING/);
assert.match(markdown, /不能直接作为导入映射/);
assert.match(markdown, /代表系列/);

const emptyRows = renderCategoryMapCsv([
  { category_legacy_id: "", series_count: 1, product_count: 0 },
  { category_legacy_id: null, series_count: 2, product_count: 0 },
  { category_legacy_id: "42", series_count: 3, product_count: 4 },
]);
assert.doesNotMatch(emptyRows, /PENDING.*1.*0/);
assert.match(emptyRows, /42,,PENDING,,,3,4/);

const normalizedCsv = renderCategoryMapCsv([
  { legacy_category_id: "42", target_id: "", status: "PENDING", reviewer: "", reason: "", series_count: 3, product_count: 4 },
]);
assert.match(normalizedCsv, /42,,PENDING,,,3,4/);

console.log("PASS category map template");
