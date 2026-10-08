import assert from "node:assert/strict";

const base = process.env.PROD_URL ?? "http://localhost:3100";
const cnBase = process.env.CN_PROD_URL ?? "http://127.0.0.1:3100";

async function get(path) {
  return fetch(`${base}${path}`, { redirect: "manual" });
}

const root = await get("/");
assert.equal(root.status, 200, `production root should render, got ${root.status}`);
assert.match(await root.text(), /<html[^>]+lang="en"/i);

const news = await get("/news");
assert.equal(news.status, 200, `production /news should render, got ${news.status}`);
assert.match(await news.text(), /<html[^>]+lang="en"/i);

const prefixedEn = await get("/en");
assert.equal(prefixedEn.status, 307, `production /en should redirect, got ${prefixedEn.status}`);
assert.equal(
  new URL(prefixedEn.headers.get("location"), base).href,
  process.env.MAIN_CANONICAL ?? "https://www.degson.com/",
);

const cnRoot = await fetch(cnBase, { redirect: "manual" });
assert.equal(cnRoot.status, 200, `production CN root should render, got ${cnRoot.status}`);
assert.match(await cnRoot.text(), /<html[^>]+lang="zh-Hans"/i);

console.log("PASS production route contract");
