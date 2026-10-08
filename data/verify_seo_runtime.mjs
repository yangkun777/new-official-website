import assert from "node:assert/strict";

const base = process.env.WEB_URL ?? "http://localhost:3000";

async function get(path) {
  const response = await fetch(`${base}${path}`);
  const text = await response.text();
assert.equal(response.status, 200, `${path} should return 200`);
  return { response, text };
}

const robots = await get("/robots.txt");
assert.match(robots.response.headers.get("content-type") ?? "", /text\/plain/);
assert.match(robots.text, /Disallow:\s+\//);
assert.doesNotMatch(robots.text, /Sitemap:/);

const sitemap = await get("/sitemap.xml");
assert.match(sitemap.response.headers.get("content-type") ?? "", /application\/xml/);
const urls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.ok(urls.length >= 2, "sitemap should contain more than the base entries");
assert.equal(new Set(urls).size, urls.length, "sitemap must not contain duplicate URLs");
assert.ok(urls.some((url) => url.includes("/product/series/")), "sitemap should include a published series URL");

const llms = await get("/llms.txt");
assert.match(llms.response.headers.get("content-type") ?? "", /text\/plain/);
assert.match(llms.text, /# DEGSON/);
assert.match(llms.text, /\/news/);

const home = await get("/en");
assert.match(home.text, /name="robots"[^>]+content="noindex, ?nofollow"/i);

console.log(`PASS SEO runtime (${urls.length} sitemap URLs)`);
