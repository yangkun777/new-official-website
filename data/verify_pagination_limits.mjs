import assert from "node:assert/strict";
import fs from "node:fs";

const repo = fs.readFileSync("web/src/lib/repo.ts", "utf8");
const sitemap = fs.readFileSync("web/src/app/sitemap.ts", "utf8");

assert.match(repo, /const PAGINATION_LIMIT = 100/);
assert.match(repo, /getCategoriesForSitemap[\s\S]*?limit = PAGINATION_LIMIT/);
assert.match(repo, /getSeriesForSitemap[\s\S]*?limit = PAGINATION_LIMIT/);
assert.match(repo, /getNewsForSitemap[\s\S]*?limit = PAGINATION_LIMIT/);
assert.match(repo, /getVariants[\s\S]*?const limit = PAGINATION_LIMIT/);
assert.doesNotMatch(repo, /getVariants[\s\S]*?const limit = 500/);
assert.match(sitemap, /const limit = 100/);
assert.doesNotMatch(sitemap, /const limit = 500/);

console.log("PASS pagination limit contract");
