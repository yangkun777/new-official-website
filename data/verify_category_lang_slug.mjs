import assert from "node:assert/strict";

const WEB = process.env.WEB_PREVIEW_ORIGIN ?? "http://localhost:3000";

async function probe(path) {
  const response = await fetch(WEB + path, { redirect: "manual", cache: "no-store" });
  const html = response.status === 200 ? await response.text() : "";
  return {
    status: response.status,
    location: response.headers.get("location") ?? "",
    html,
  };
}

function isRedirect(result) {
  return [301, 302, 307, 308].includes(result.status) && Boolean(result.location);
}

function h1(html) {
  const start = html.indexOf("<h1");
  if (start < 0) return "";
  const open = html.indexOf(">", start);
  const close = html.indexOf("</h1>", open);
  return html.slice(open + 1, close).replace(/<[^>]+>/g, "").trim();
}

const zhTerminal = await probe("/zh/product/category/jie-xian-duan-zi");
assert.equal(zhTerminal.status, 200, `zh canonical ${zhTerminal.status}`);
assert.equal(h1(zhTerminal.html), "接线端子");
assert.match(zhTerminal.html, /浏览产品系列/);

const zhEnSlug = await probe("/zh/product/category/terminal-blocks");
assert.ok(isRedirect(zhEnSlug), `zh en-slug status ${zhEnSlug.status}`);
assert.match(zhEnSlug.location, /\/zh\/product\/category\/jie-xian-duan-zi/);

const zhCircular = await probe("/zh/product/category/circular-connectors");
assert.ok(isRedirect(zhCircular), `zh circular status ${zhCircular.status}`);
assert.match(zhCircular.location, /\/zh\/product\/category\/yuan-xing-lian-jie-qi/);

const enTerminal = await probe("/en/product/category/terminal-blocks");
assert.equal(enTerminal.status, 200, `en terminal ${enTerminal.status}`);
assert.equal(h1(enTerminal.html), "Terminal Blocks");

const enZhSlug = await probe("/en/product/category/jie-xian-duan-zi");
assert.ok(isRedirect(enZhSlug), `en zh-slug status ${enZhSlug.status}`);
assert.match(enZhSlug.location, /\/en\/product\/category\/terminal-blocks/);

console.log("PASS category language slug redirect");
