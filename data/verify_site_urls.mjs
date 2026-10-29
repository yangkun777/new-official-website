import assert from "node:assert/strict";
import { createSitePolicy } from "../web/src/lib/siteConfig.ts";

const production = createSitePolicy({
  mode: "production",
  siteOrigin: "https://www.degson.com",
  cnSiteOrigin: "https://www.degson.com.cn",
});

assert.equal(production.siteUrl("en", "/news"), "https://www.degson.com/news");
assert.equal(production.siteUrl("de", "/news"), "https://www.degson.com/de/news");
assert.equal(production.siteUrl("zh", "/news"), "https://www.degson.com.cn/news");
assert.equal(production.siteHref("zh", "/news"), "https://www.degson.com.cn/news");

const demo = createSitePolicy({
  mode: "demo-path",
  siteOrigin: "http://localhost:3000",
  cnSiteOrigin: "http://localhost:3000",
});

assert.equal(demo.localePath("en", "/news"), "/en/news");
assert.equal(demo.localePath("zh", "/news"), "/zh/news");
assert.equal(demo.siteUrl("en", "/news"), "http://localhost:3000/en/news");
assert.equal(demo.siteHref("en", "/news"), "/en/news");
assert.equal(demo.siteHref("zh", "/#products"), "/zh/#products");
assert.equal(demo.siteHref("en", "http://localhost:3000/zh/news"), "/en/news");
assert.equal(demo.siteHref("zh", "/en/about"), "/zh/about");
assert.equal(demo.siteHref("en", "http://127.0.0.1:3000/en#products"), "/en/#products");

console.log("PASS site URL policy");
