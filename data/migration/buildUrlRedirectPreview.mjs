import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const MYSQL_BIN = process.env.MYSQL_BIN ?? "D:\\degson-pilot\\mysql\\bin\\mysql.exe";
const MYSQL_HOST = process.env.LEGACY_MYSQL_HOST ?? "127.0.0.1";
const MYSQL_PORT = process.env.LEGACY_MYSQL_PORT ?? "3307";
const MYSQL_USER = process.env.LEGACY_MYSQL_USER ?? "root";
const MYSQL_DATABASE = process.env.LEGACY_MYSQL_DATABASE ?? "degson_legacy";
const TARGET_ORIGIN = process.env.MIGRATION_TARGET_ORIGIN ?? "https://www.degson.com";

const SQL = `
SELECT id, catid, url, title, text, matecode, classify
FROM hr_article
WHERE language = 'en' AND status = '1' AND TRIM(url) <> ''
  AND catid IN (547, 548, 549, 550, 552)
ORDER BY catid, id;
`;

export function unescapeMysql(value) {
  return value.replaceAll("\\t", "\t").replaceAll("\\n", "\n").replaceAll("\\r", "\r").replaceAll("\\\\", "\\");
}

export function parseRows(stdout) {
  return stdout.split(/\r?\n/).filter(Boolean).map((line) => {
    const [id, catid, old_url, title, order_no, matecode, classify] = line.split("\t").map(unescapeMysql);
    return { id: Number(id), catid: Number(catid), old_url, title, order_no, matecode, classify };
  });
}

export function slugify(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function mapRedirects(rows, origin = TARGET_ORIGIN) {
  const seriesCounts = new Map();
  const productCounts = new Map();
  for (const row of rows) {
    if (row.catid === 550 && row.matecode) seriesCounts.set(row.matecode, (seriesCounts.get(row.matecode) ?? 0) + 1);
    if (row.catid === 552 && row.order_no) productCounts.set(row.order_no, (productCounts.get(row.order_no) ?? 0) + 1);
  }

  const mapped = rows.map((row) => {
    let target_path = "";
    let status = "REVIEW_UNCLASSIFIED";
    if ([547, 548, 549].includes(row.catid)) {
      const slug = slugify(row.title);
      target_path = slug ? `/product/category/${slug}` : "";
      status = target_path ? "OK" : "REVIEW_MISSING_SLUG";
    } else if (row.catid === 550) {
      target_path = row.matecode ? `/product/series/${encodeURIComponent(row.matecode)}` : "";
      status = !row.matecode ? "REVIEW_MISSING_MATECODE" : seriesCounts.get(row.matecode) > 1 ? "REVIEW_DUPLICATE_MATECODE" : "OK";
    } else if (row.catid === 552) {
      target_path = row.order_no ? `/product/${encodeURIComponent(row.order_no)}` : "";
      status = !row.order_no ? "REVIEW_MISSING_ORDER_NO" : productCounts.get(row.order_no) > 1 ? "REVIEW_DUPLICATE_ORDER_NO" : "OK";
    }
    return {
      old_id: row.id,
      old_url: row.old_url,
      catid: row.catid,
      title: row.title,
      identity: row.catid === 550 ? row.matecode : row.catid === 552 ? row.order_no : row.id,
      status,
      target_url: target_path ? `${origin.replace(/\/+$/, "")}${target_path}` : "",
    };
  });

  const sourceCounts = new Map();
  const targetCounts = new Map();
  for (const row of mapped) {
    if (row.old_url) sourceCounts.set(row.old_url, (sourceCounts.get(row.old_url) ?? 0) + 1);
    if (row.target_url) targetCounts.set(row.target_url, (targetCounts.get(row.target_url) ?? 0) + 1);
  }

  return mapped.map((row) => {
    if (row.old_url && sourceCounts.get(row.old_url) > 1) {
      return { ...row, status: "REVIEW_SOURCE_URL_COLLISION" };
    }
    if (row.status === "OK" && row.target_url && targetCounts.get(row.target_url) > 1) {
      return { ...row, status: "REVIEW_TARGET_COLLISION" };
    }
    return row;
  });
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildPreview(outputDir = path.resolve("data/migration/reports")) {
  const result = spawnSync(MYSQL_BIN, [
    `--host=${MYSQL_HOST}`, `--port=${MYSQL_PORT}`, `--user=${MYSQL_USER}`, `--database=${MYSQL_DATABASE}`,
    "--batch", "--skip-column-names",
  ], { input: SQL, encoding: "utf8", env: process.env, maxBuffer: 30 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`URL preview query failed (${result.status}): ${result.stderr || result.stdout}`);

  const rows = mapRedirects(parseRows(result.stdout));
  const headers = ["old_id", "old_url", "catid", "title", "identity", "status", "target_url"];
  const stamp = new Date().toISOString().slice(0, 10);
  fs.mkdirSync(outputDir, { recursive: true });
  const csvPath = path.join(outputDir, `legacy-url-redirect-preview-${stamp}.csv`);
  fs.writeFileSync(csvPath, [headers.join(","), ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(","))].join("\n") + "\n", "utf8");

  const counts = Object.fromEntries([...new Set(rows.map((row) => row.status))].map((status) => [status, rows.filter((row) => row.status === status).length]));
  const markdownPath = path.join(outputDir, `legacy-url-redirect-preview-${stamp}.md`);
  fs.writeFileSync(markdownPath, [
    "# 旧 URL → 新 URL 预览",
    "",
    `数据源：${MYSQL_DATABASE}（只读）`,
    `目标域名：${TARGET_ORIGIN}`,
    "",
    "> 这是迁移预览，不是可直接上线的 301 配置。只有 `OK` 行可以进入下一步人工复核；所有 `REVIEW_*` 行必须先裁决。",
    "",
    "## 状态统计",
    "",
    ...Object.entries(counts).map(([status, count]) => `- ${status}: ${count}`),
    "",
    "## URL 规则",
    "",
    "- 分类：`/product/category/{slug}`",
    "- 系列：`/product/series/{matecode}`",
    "- SKU：`/product/{order_no}`",
    "- 重复系列码或订货号不自动生成确定性目标。",
    "- 重复旧 URL 或重复新目标 URL 不自动生成确定性 301。",
    "",
    `完整明细见同目录 CSV：${path.basename(csvPath)}`,
    "",
  ].join("\n"), "utf8");
  return { rows, counts, csvPath, markdownPath };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const report = buildPreview();
  console.log(JSON.stringify({ rows: report.rows.length, counts: report.counts, csv: report.csvPath, markdown: report.markdownPath }, null, 2));
}
