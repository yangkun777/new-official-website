import assert from "node:assert/strict";
import fs from "node:fs";

const repo = fs.readFileSync("web/src/lib/repo.ts", "utf8");
const start = repo.indexOf("export async function getVariants");
const end = repo.indexOf("// 新闻", start);
assert.ok(start >= 0 && end > start, "getVariants source block should exist");
const source = repo.slice(start, end);

assert.match(source, /apiGetList<Variant>/);
assert.match(source, /page: String\(page\)/);
assert.match(source, /Math\.ceil\(first\.total \/ limit\)/);
assert.match(source, /for \(let page = 2; page <= pages; page\+\+\)/);
assert.match(source, /all\.push\(\.\.\.result\.items\)/);

console.log("PASS variant pagination contract");
