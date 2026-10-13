import assert from "node:assert/strict";
import { mapLegacyBatch } from "./migration/legacyContract.mjs";
import { partitionLegacyBatch, summarizeCategoryGaps } from "./migration/partitionLegacyBatch.mjs";

const batch = mapLegacyBatch({
  language: "en",
  categories: [{ catid: 1, en_catname: "Connectors" }],
  series: [
    { id: 10, classify: 1, matecode: "S-READY", title: "Ready series" },
    { id: 11, classify: 1, matecode: "S-DUP", title: "Duplicate A" },
    { id: 12, classify: 1, matecode: "S-DUP", title: "Duplicate B" },
  ],
  products: [
    { id: 20, matecode: "S-READY", text: "P-READY", title: "Ready product" },
    { id: 21, matecode: "S-MISSING", text: "P-ORPHAN", title: "Orphan product" },
    { id: 22, matecode: "S-READY", text: "P-DUP", title: "Duplicate product A" },
    { id: 23, matecode: "S-READY", text: "P-DUP", title: "Duplicate product B" },
  ],
});

const result = partitionLegacyBatch(batch);
assert.deepEqual(result.counts, {
  ready: { categories: 1, series: 1, products: 1 },
  review: 5,
  reject: 0,
});
assert.equal(result.ready.products[0].order_no, "P-READY");
assert.equal(result.review.filter((row) => row.reason_code === "DUPLICATE_MATECODE").length, 2);
assert.equal(result.review.filter((row) => row.reason_code === "DUPLICATE_ORDER_NO").length, 2);
assert.equal(result.review.filter((row) => row.reason_code === "ORPHAN_SERIES").length, 1);

const categoryGaps = summarizeCategoryGaps(batch);
assert.deepEqual(categoryGaps, [
  {
    category_legacy_id: "1",
    source_category_exists: true,
    external_map_exists: false,
    series_count: 3,
    product_count: 3,
    sample_series: [
      { legacy_id: "10", matecode: "S-READY", name: "Ready series" },
      { legacy_id: "11", matecode: "S-DUP", name: "Duplicate A" },
      { legacy_id: "12", matecode: "S-DUP", name: "Duplicate B" },
    ],
  },
]);

const invalidCategoryBatch = mapLegacyBatch({
  language: "en",
  categories: [{ catid: 2, en_catname: "" }],
  series: [{ id: 30, classify: 2, matecode: "S-BLOCKED", title: "Blocked series" }],
  products: [],
});
const invalidCategoryResult = partitionLegacyBatch(invalidCategoryBatch);
assert.equal(invalidCategoryResult.ready.series.length, 0);
assert.equal(invalidCategoryResult.review[0].reason_code, "UNKNOWN_CATEGORY");

const mappedCategoryBatch = mapLegacyBatch({
  language: "en",
  categories: [],
  series: [{ id: 40, classify: 99, matecode: "S-MAPPED", title: "Mapped series" }],
  products: [{ id: 41, matecode: "S-MAPPED", text: "P-MAPPED", title: "Mapped product" }],
});
const mappedCategoryResult = partitionLegacyBatch(mappedCategoryBatch, {
  categoryMap: { "99": { target_id: "new-category-99" } },
});
assert.equal(mappedCategoryResult.ready.series.length, 1);
assert.equal(mappedCategoryResult.ready.products.length, 1);
assert.equal(mappedCategoryResult.review.length, 0);
assert.deepEqual(summarizeCategoryGaps(mappedCategoryBatch, {
  categoryMap: { "99": { target_id: "new-category-99" } },
}), [{
  category_legacy_id: "99",
  source_category_exists: false,
  external_map_exists: true,
  series_count: 1,
  product_count: 1,
  sample_series: [{ legacy_id: "40", matecode: "S-MAPPED", name: "Mapped series" }],
}]);

console.log("PASS migration partition");
