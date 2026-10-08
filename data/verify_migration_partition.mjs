import assert from "node:assert/strict";
import { mapLegacyBatch } from "./migration/legacyContract.mjs";
import { partitionLegacyBatch } from "./migration/partitionLegacyBatch.mjs";

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

console.log("PASS migration partition");
