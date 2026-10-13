import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const MYSQL_BIN = process.env.MYSQL_BIN ?? "D:\\degson-pilot\\mysql\\bin\\mysql.exe";
const MYSQL_HOST = process.env.LEGACY_MYSQL_HOST ?? "127.0.0.1";
const MYSQL_PORT = process.env.LEGACY_MYSQL_PORT ?? "3307";
const MYSQL_USER = process.env.LEGACY_MYSQL_USER ?? "root";
const MYSQL_DATABASE = process.env.LEGACY_MYSQL_DATABASE ?? "degson_legacy";

const SQL = `
SELECT 'duplicate_matecode' kind, TRIM(matecode) identity_key, id, title, classify, matecode, text, text1, text2, combined_title, updatetime, url
FROM hr_article
WHERE catid = 550 AND TRIM(matecode) <> '' AND matecode IN (
  SELECT matecode FROM hr_article WHERE catid = 550 AND TRIM(matecode) <> '' GROUP BY matecode HAVING COUNT(*) > 1
)
UNION ALL
SELECT 'duplicate_order_no', TRIM(text), id, title, classify, matecode, text, text1, text2, combined_title, updatetime, url
FROM hr_article
WHERE catid = 552 AND TRIM(text) <> '' AND text IN (
  SELECT text FROM hr_article WHERE catid = 552 AND TRIM(text) <> '' GROUP BY text HAVING COUNT(*) > 1
)
UNION ALL
SELECT 'orphan_product_series', TRIM(p.matecode), p.id, p.title, p.classify, p.matecode, p.text, p.text1, p.text2, p.combined_title, p.updatetime, p.url
FROM hr_article p
LEFT JOIN hr_article s ON s.catid = 550 AND TRIM(s.matecode) = TRIM(p.matecode)
WHERE p.catid = 552 AND TRIM(p.matecode) <> '' AND s.id IS NULL
ORDER BY kind, identity_key, id;
`;

export function unescapeMysql(value) {
  return value
    .replaceAll("\\t", "\t")
    .replaceAll("\\n", "\n")
    .replaceAll("\\r", "\r")
    .replaceAll("\\\\", "\\");
}

export function parseMysqlRows(stdout) {
  return stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const cells = line.split("\t").map(unescapeMysql);
      const [kind, identity_key, id, title, classify, matecode, order_no, pitch, poles, combined_title, updatetime, url] = cells;
      return { kind, identity_key, id: Number(id), title, classify, matecode, order_no, pitch, poles, combined_title, updatetime, url };
    });
}

function csvCell(value) {
  const string = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string;
}

function groupByIdentity(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.kind}\t${row.identity_key}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()].map(([key, records]) => {
    const [kind, identity_key] = key.split("\t");
    return { kind, identity_key, records };
  });
}

export function renderMarkdown(rows, generatedAt = new Date().toISOString()) {
  const groups = groupByIdentity(rows);
  const counts = Object.fromEntries(
    ["duplicate_matecode", "duplicate_order_no", "orphan_product_series"].map((kind) => [
      kind,
      groups.filter((group) => group.kind === kind).length,
    ])
  );
  const lines = [
    "# 旧库重复与孤儿数据裁决清单",
    "",
    `生成时间：${generatedAt}`,
    `数据源：${MYSQL_DATABASE}（只读）`,
    "",
    "> 本清单只用于业务裁决。默认规则：不自动合并、不覆盖源记录、不静默丢弃。裁决结果应补充到迁移台账后，才能进入新库导入。",
    "",
    "## 汇总",
    "",
    `- 重复系列码：${counts.duplicate_matecode} 组。`,
    `- 重复订货号：${counts.duplicate_order_no} 组。`,
    `- 孤儿系列引用：${counts.orphan_product_series} 组。`,
    "",
    "## 建议裁决字段",
    "",
    "每组至少确认：保留记录 ID、废弃记录 ID、是否合并参数、是否合并媒体、旧 URL 目标、最终 canonical、责任人和裁决理由。",
    "",
  ];

  for (const kind of ["duplicate_matecode", "duplicate_order_no", "orphan_product_series"]) {
    lines.push(`## ${kind}`); lines.push("");
    for (const group of groups.filter((item) => item.kind === kind)) {
      lines.push(`### ${group.identity_key}`); lines.push("");
      const columns = kind === "duplicate_matecode"
        ? [["id", "id"], ["title", "title"], ["classify", "classify"], ["matecode", "matecode"], ["updated", "updatetime"], ["url", "url"]]
        : [["id", "id"], ["title", "title"], ["matecode", "matecode"], ["order_no", "order_no"], ["pitch", "pitch"], ["poles", "poles"], ["updated", "updatetime"], ["url", "url"]];
      lines.push(`| ${columns.map(([label]) => label).join(" | ")} |`);
      lines.push(`| ${columns.map(([label]) => label === "id" || label === "updated" ? "---:" : "---").join(" | ")} |`);
      for (const row of group.records) {
        const cells = columns.map(([, key]) => row[key])
          .map((value) => String(value ?? "").replaceAll("|", "\\|"));
        lines.push(`| ${cells.join(" | ")} |`);
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

export function buildReport(outputDir = path.resolve("data/migration/reports")) {
  const result = spawnSync(MYSQL_BIN, [
    `--host=${MYSQL_HOST}`,
    `--port=${MYSQL_PORT}`,
    `--user=${MYSQL_USER}`,
    `--database=${MYSQL_DATABASE}`,
    "--batch",
    "--skip-column-names",
  ], { input: SQL, encoding: "utf8", env: process.env, maxBuffer: 30 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`Adjudication query failed (${result.status}): ${result.stderr || result.stdout}`);

  const rows = parseMysqlRows(result.stdout);
  fs.mkdirSync(outputDir, { recursive: true });
  const csvHeader = ["kind", "identity_key", "id", "title", "classify", "matecode", "order_no", "pitch", "poles", "combined_title", "updatetime", "url"];
  const csv = [csvHeader.join(","), ...rows.map((row) => csvHeader.map((key) => csvCell(row[key])).join(","))].join("\n") + "\n";
  const stamp = new Date().toISOString().slice(0, 10);
  const csvPath = path.join(outputDir, `legacy-adjudication-${stamp}.csv`);
  const mdPath = path.join(outputDir, `legacy-adjudication-${stamp}.md`);
  fs.writeFileSync(csvPath, csv, "utf8");
  fs.writeFileSync(mdPath, renderMarkdown(rows), "utf8");
  return { rows, csvPath, mdPath };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const report = buildReport();
  console.log(JSON.stringify({ rows: report.rows.length, csv: report.csvPath, markdown: report.mdPath }, null, 2));
}
