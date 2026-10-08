import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function normalizedRows(categoryGaps) {
  return [...(categoryGaps ?? [])]
    .filter((row) => String(row.category_legacy_id ?? row.legacy_category_id ?? "").trim() !== "")
    .sort((left, right) => String(left.category_legacy_id ?? left.legacy_category_id).localeCompare(String(right.category_legacy_id ?? right.legacy_category_id), undefined, { numeric: true }))
    .map((row) => ({
      legacy_category_id: String(row.category_legacy_id ?? row.legacy_category_id),
      target_id: row.target_id ?? "",
      status: row.status ?? "PENDING",
      reviewer: row.reviewer ?? "",
      reason: row.reason ?? "",
      series_count: row.series_count ?? 0,
      product_count: row.product_count ?? 0,
    }));
}

export function renderCategoryMapCsv(categoryGaps) {
  const headers = ["legacy_category_id", "target_id", "status", "reviewer", "reason", "series_count", "product_count"];
  const rows = normalizedRows(categoryGaps);
  return `${[headers, ...rows.map((row) => headers.map((key) => csvCell(row[key])))].map((row) => row.join(",")).join("\n")}\n`;
}

export function renderCategoryMapMarkdown(categoryGaps, generatedAt = new Date().toISOString()) {
  const rows = normalizedRows(categoryGaps);
  const lines = [
    "# 旧分类映射待裁决",
    "",
    `生成时间：${generatedAt}`,
    `待裁决分类：${rows.length} 个`,
    "",
    "> 这是人工审核模板，不能直接作为导入映射，也不能直接传给 `--category-map`。只有业务确认目标分类、审核人和理由后，才能转换成正式映射。",
    "",
    "| legacy_category_id | target_id | status | reviewer | reason | series_count | product_count |",
    "|---:|---|---|---|---|---:|---:|",
    ...rows.map((row) => `| ${row.legacy_category_id} |  | ${row.status} |  |  | ${row.series_count} | ${row.product_count} |`),
    "",
    "## 审核要求",
    "",
    "- `target_id` 必须是新库中已存在且业务确认的 category ID。",
    "- `status` 只有在确认后才能从 `PENDING` 改为已批准状态。",
    "- 必须填写 reviewer 和 reason；不能通过猜测名称或数字相近关系自动映射。",
    "- 审核完成后仍需重新执行 migration dry-run，确认 READY 数量和关联完整性。",
    "",
  ];
  return lines.join("\n");
}

export function buildCategoryMapTemplate(inputPath, outputDir = path.dirname(inputPath)) {
  const report = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const categoryGaps = report?.partition?.category_gaps;
  if (!Array.isArray(categoryGaps)) throw new Error("dry-run report must contain partition.category_gaps");
  const rows = normalizedRows(categoryGaps);
  const stamp = new Date().toISOString().slice(0, 10);
  fs.mkdirSync(outputDir, { recursive: true });
  const csvPath = path.join(outputDir, `legacy-category-map-template-${stamp}.csv`);
  const markdownPath = path.join(outputDir, `legacy-category-map-template-${stamp}.md`);
  fs.writeFileSync(csvPath, renderCategoryMapCsv(rows), "utf8");
  fs.writeFileSync(markdownPath, renderCategoryMapMarkdown(rows), "utf8");
  return { csvPath, markdownPath, rows: rows.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const inputPath = process.argv.find((arg) => arg.startsWith("--input="))?.slice("--input=".length)
    ?? path.resolve("data/migration/reports/legacy-dry-run.json");
  const outputDir = process.argv.find((arg) => arg.startsWith("--output-dir="))?.slice("--output-dir=".length)
    ?? path.dirname(inputPath);
  console.log(JSON.stringify(buildCategoryMapTemplate(inputPath, outputDir), null, 2));
}
