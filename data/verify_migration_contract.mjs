import assert from "node:assert/strict";
import {
  LEGACY_FIELD_MAP,
  mapLegacyBatch,
  normalizeIdentity,
  validateMigrationBatch,
} from "./migration/legacyContract.mjs";

assert.equal(normalizeIdentity("  DG271V-2-102  "), "DG271V-2-102");
assert.equal(LEGACY_FIELD_MAP.product.order_no, "text");

const mapped = mapLegacyBatch({
  language: "en",
  categories: [
    { catid: 231582, parent_id: 231580, classify: " PCB Plug ", thumb: "pcb.jpg" },
  ],
  series: [
    { id: 10, catid: 231582, matecode: " 10030005326 ", classify: "PCB Plug Series", thumb: "series.jpg" },
  ],
  products: [
    { id: 20, catid: 552, matecode: "10030005326", text: " DG271V-2-102 ", title: "DG271V", text1: "3.5", text2: "2" },
  ],
});

assert.deepEqual(mapped.series[0], {
  legacy_id: 10,
  category_legacy_id: 231582,
  matecode: "10030005326",
  name: "PCB Plug Series",
  image: "series.jpg",
  language: "en",
});
assert.equal(mapped.products[0].order_no, "DG271V-2-102");
assert.equal(mapped.products[0].pitch, 3.5);
assert.equal(mapped.products[0].poles, 2);

const report = validateMigrationBatch(mapped);
assert.deepEqual(report, { errors: [], warnings: [] });

const duplicateReport = validateMigrationBatch({
  ...mapped,
  products: [...mapped.products, { ...mapped.products[0], legacy_id: 21 }],
});
assert.match(duplicateReport.errors.join("\n"), /duplicate product.order_no/);

console.log("PASS migration contract");
