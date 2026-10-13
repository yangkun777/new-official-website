import assert from "node:assert/strict";
import { parseMysqlRows, renderMarkdown } from "./migration/buildAdjudicationReport.mjs";

const rows = parseMysqlRows([
  "duplicate_order_no\tDG-001\t10\tProduct A\t231582\t10030000001\tDG-001\t3.5\t24P\tProduct A - 24P\t1700000000\t/content/10.html",
  "orphan_product_series\tMISSING\t11\tProduct B\t231582\tMISSING\tDG-002\t4C\t1A\tProduct B\t1700000001\t/content/11.html",
].join("\n"));

assert.equal(rows.length, 2);
assert.equal(rows[0].order_no, "DG-001");
assert.equal(rows[1].kind, "orphan_product_series");

const markdown = renderMarkdown(rows, "2026-10-08T00:00:00.000Z");
assert.match(markdown, /重复订货号：1 组/);
assert.match(markdown, /孤儿系列引用：1 组/);
assert.match(markdown, /DG-001/);

console.log("PASS adjudication report parser");
