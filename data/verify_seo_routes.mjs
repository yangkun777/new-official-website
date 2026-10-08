import assert from "node:assert/strict";
import fs from "node:fs";

const files = {
  robots: fs.readFileSync("web/src/app/robots.ts", "utf8"),
  sitemap: fs.readFileSync("web/src/app/sitemap.ts", "utf8"),
  llms: fs.readFileSync("web/src/app/llms.txt/route.ts", "utf8"),
  seo: fs.readFileSync("web/src/lib/seo.ts", "utf8"),
  news: fs.readFileSync("web/src/app/[lang]/news/[slug]/page.tsx", "utf8"),
  series: fs.readFileSync("web/src/app/[lang]/product/series/[matecode]/page.tsx", "utf8"),
  category: fs.readFileSync("web/src/app/[lang]/product/category/[slug]/page.tsx", "utf8"),
  repo: fs.readFileSync("web/src/lib/repo.ts", "utf8"),
  layout: fs.readFileSync("web/src/app/[lang]/layout.tsx", "utf8"),
  middleware: fs.readFileSync("web/src/middleware.ts", "utf8"),
  home: fs.readFileSync("web/src/app/[lang]/page.tsx", "utf8"),
  newsList: fs.readFileSync("web/src/app/[lang]/news/page.tsx", "utf8"),
};

assert.match(files.robots, /MetadataRoute\.Robots/);
assert.match(files.robots, /sitemap/);
assert.match(files.robots, /Disallow|disallow/);
assert.match(files.robots, /SITE_MODE/);
assert.match(files.sitemap, /MetadataRoute\.Sitemap/);
assert.match(files.sitemap, /getNewsForSitemap/);
assert.match(files.sitemap, /newsPages/);
assert.match(files.sitemap, /getCategoriesForSitemap/);
assert.match(files.sitemap, /Math\.ceil\(first\.total \/ limit\)/);
assert.match(files.sitemap, /getSeriesForSitemap/);
assert.match(files.sitemap, /siteUrl/);
assert.match(files.llms, /text\/plain/);
assert.match(files.llms, /siteUrl/);
assert.match(files.llms, /Response/);
assert.match(files.seo, /serializeJsonLd/);
assert.match(files.seo, /\\\\u003c/);
assert.match(files.news, /NewsArticle/);
assert.match(files.news, /serializeJsonLd/);
assert.doesNotMatch(files.series, /JSON\.stringify\(jsonLd\)/);
assert.doesNotMatch(files.category, /JSON\.stringify\(jsonLd\)/);
assert.match(files.repo, /export async function getSeriesForSitemap/);
assert.match(files.repo, /export async function getCategoriesForSitemap/);
assert.match(files.repo, /export async function getNewsForSitemap/);
assert.match(files.layout, /Organization/);
assert.match(files.layout, /WebSite/);
assert.match(files.layout, /serializeJsonLd/);
assert.match(files.layout, /openGraph/);
assert.match(files.layout, /twitter/);
assert.match(files.layout, /index:\s*false/);
assert.match(files.layout, /follow:\s*false/);
assert.match(files.middleware, /NextResponse\.rewrite/);
assert.match(files.middleware, /DEFAULT_LANG\}\$\{pathname === ["']\/["']/);
assert.match(files.middleware, /req\.headers\.get\("host"\)/);
assert.match(files.middleware, /hostLang = isCnHost \? "zh" : DEFAULT_LANG/);
assert.match(files.middleware, /X-Robots-Tag/);
for (const page of [files.home, files.newsList, files.news, files.series, files.category]) {
  assert.match(page, /socialMetadata/);
}

console.log("PASS SEO routes contract");
