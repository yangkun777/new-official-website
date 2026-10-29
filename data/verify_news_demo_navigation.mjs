const BASE = process.env.WEB_URL ?? "http://localhost:3000";
const cases = [
  {
    slug: "push-snap-关注更高效的现场接线",
    enSlug: "push-snap-wiring-efficiency",
    title: "PUSH-SNAP：关注更高效的现场接线",
    enTitle: "PUSH-SNAP and more efficient wiring",
    body: "导线规格、安装空间和后续维护方式",
    relatedPath: "/zh/product/category/terminal-blocks",
    enRelatedPath: "/en/product/category/terminal-blocks",
  },
  {
    slug: "圆形连接器面向设备端的信号与电力",
    enSlug: "circular-connectors-device-interfaces",
    title: "圆形连接器：面向设备端的信号与电力",
    enTitle: "Circular connectors for device interfaces",
    body: "接口规格、编码方式、芯数、出线方向",
    relatedPath: "/zh/product/category/circular-connectors",
    enRelatedPath: "/en/product/category/circular-connectors",
  },
  {
    slug: "连接产品如何走进新能源现场",
    enSlug: "connectivity-across-new-energy-applications",
    title: "连接产品如何走进新能源现场",
    enTitle: "Connectivity across new energy applications",
    body: "发电、储能与充电场景中的连接需求也各有特点",
    relatedPath: "/zh/solutions",
    enRelatedPath: "/en/solutions",
  },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const list = await fetch(`${BASE}/zh/news`, { cache: "no-store" });
const listHtml = await list.text();
assert(list.ok, `news list status ${list.status}`);

for (const item of cases) {
  const anchors = [...listHtml.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  const card = anchors.find(([, href, content]) =>
    decodeURIComponent(href).includes(`/zh/news/${item.slug}`) &&
    content.includes(item.title)
  );
  assert(card, `news card must link to its own detail: ${item.title}`);

  const detail = await fetch(`${BASE}/zh/news/${encodeURIComponent(item.slug)}`, {
    cache: "no-store",
  });
  const detailHtml = await detail.text();
  assert(detail.status === 200, `detail status for ${item.slug}: ${detail.status}`);
  assert(detailHtml.includes(item.title), `detail title missing for ${item.slug}`);
  assert(detailHtml.includes(item.body), `detail body missing for ${item.slug}`);
  assert(detailHtml.includes("返回新闻列表"), `detail has no list return link: ${item.slug}`);
  assert(detailHtml.includes(`href="${item.relatedPath}"`), `related destination missing for ${item.slug}`);

  const english = await fetch(`${BASE}/en/news/${encodeURIComponent(item.enSlug)}`, {
    cache: "no-store",
  });
  const englishHtml = await english.text();
  assert(english.status === 200, `English detail status for ${item.enSlug}: ${english.status}`);
  assert(englishHtml.includes(item.enTitle), `English detail title missing for ${item.enSlug}`);
  assert(englishHtml.includes(`href="${item.enRelatedPath}"`), `English related destination missing for ${item.enSlug}`);
}

console.log("PASS news demo list-to-detail navigation");
