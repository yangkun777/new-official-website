const BASE = process.env.WEB_URL ?? "http://localhost:3000";
const sourcePath = "/en/news/degson-launches-new-terminal-blocks";
const targetPath = "/zh/news/degson-xin-yidai-jie-xian-duan-zi";

const source = await fetch(`${BASE}${sourcePath}`);
if (!source.ok) throw new Error(`source page failed: ${source.status}`);
const sourceHtml = await source.text();

const targetLink = [...sourceHtml.matchAll(/href="([^"]*\/zh\/news\/[^"?]+)"/g)]
  .map((match) => match[1])
  .find((href) => new URL(href, BASE).pathname === targetPath);

if (!targetLink) {
  console.error(`FAIL language switch target: expected ${targetPath}`);
  process.exitCode = 1;
} else {
  const target = await fetch(`${BASE}${targetPath}`, { redirect: "manual" });
  const targetHtml = await target.text();
  const hasChineseTitle = targetHtml.includes("高松发布新一代接线端子");
  if (target.status !== 200 || !hasChineseTitle) {
    console.error(`FAIL Chinese detail page: status=${target.status}, title=${hasChineseTitle}`);
    process.exitCode = 1;
  } else {
    console.log("PASS news language switch");
  }
}
