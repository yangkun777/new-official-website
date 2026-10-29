const BASE = process.env.WEB_URL ?? "http://localhost:3000";

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL ${msg}`);
    process.exitCode = 1;
  }
}

const list = await fetch(`${BASE}/zh/news`, { cache: "no-store" });
const listHtml = await list.text();
assert(list.ok, `list status ${list.status}`);
assert(listHtml.includes("测试111"), "list missing 测试111");
assert(!listHtml.includes('href="/zh/news/"'), "list still links to empty /zh/news/");
assert(
  listHtml.includes("/zh/news/test-111") || listHtml.includes("/zh/news/news-3"),
  "list missing detail href"
);

const detail = await fetch(`${BASE}/zh/news/test-111`, { cache: "no-store" });
const detailHtml = await detail.text();
assert(detail.status === 200, `detail status ${detail.status}`);
assert(detailHtml.includes("测试111"), "detail missing title");
assert(detailHtml.includes("测试111测试111测试111"), "detail missing body");

const fallback = await fetch(`${BASE}/zh/news/news-3`, { cache: "no-store" });
const fallbackHtml = await fallback.text();
assert(fallback.status === 200, `fallback status ${fallback.status}`);
assert(fallbackHtml.includes("测试111"), "fallback missing title");

if (!process.exitCode) console.log("PASS news empty slug");
