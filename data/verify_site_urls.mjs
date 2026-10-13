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

const demo = createSitePolicy({
  mode: "demo-path",
  siteOrigin: "http://localhost:3000",
  cnSiteOrigin: "http://localhost:3000",
});

assert.equal(demo.localePath("en", "/news"), "/en/news");
assert.equal(demo.localePath("zh", "/news"), "/zh/news");
assert.equal(demo.siteUrl("en", "/news"), "http://localhost:3000/en/news");

console.log("PASS site URL policy");
