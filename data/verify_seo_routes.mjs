import assert from "node:assert/strict";
import fs from "node:fs";

const files = {
  robots: fs.readFileSync("web/src/app/robots.ts", "utf8"),
  sitemap: fs.readFileSync("web/src/app/sitemap.ts", "utf8"),
  llms: fs.readFileSync("web/src/app/llms.txt/route.ts", "utf8"),
};

assert.match(files.robots, /MetadataRoute\.Robots/);
assert.match(files.robots, /sitemap/);
assert.match(files.robots, /Disallow|disallow/);
assert.match(files.sitemap, /MetadataRoute\.Sitemap/);
assert.match(files.sitemap, /getNewsList/);
assert.match(files.sitemap, /getCategoriesByLevel/);
assert.match(files.sitemap, /siteUrl/);
assert.match(files.llms, /text\/plain/);
assert.match(files.llms, /siteUrl/);
assert.match(files.llms, /Response/);

console.log("PASS SEO routes contract");
