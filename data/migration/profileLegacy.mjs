import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const MYSQL_BIN = process.env.MYSQL_BIN ?? "D:\\degson-pilot\\mysql\\bin\\mysql.exe";
const MYSQL_HOST = process.env.LEGACY_MYSQL_HOST ?? "127.0.0.1";
const MYSQL_PORT = process.env.LEGACY_MYSQL_PORT ?? "3307";
const MYSQL_USER = process.env.LEGACY_MYSQL_USER ?? "root";
const MYSQL_DATABASE = process.env.LEGACY_MYSQL_DATABASE ?? "degson_legacy";

export const LEGACY_PROFILE_SQL = `
SELECT JSON_OBJECT(
  'source', JSON_OBJECT(
    'database', DATABASE(),
    'host', '${MYSQL_HOST}',
    'port', ${Number(MYSQL_PORT)},
    'generated_at', DATE_FORMAT(NOW(), '%Y-%m-%dT%H:%i:%s%z')
  ),
  'counts', JSON_OBJECT(
    'hr_category', (SELECT COUNT(*) FROM hr_category),
    'hr_article', (SELECT COUNT(*) FROM hr_article),
    'series_rows', (SELECT COUNT(*) FROM hr_article WHERE catid = 550),
    'product_rows', (SELECT COUNT(*) FROM hr_article WHERE catid = 552),
    'product_order_no_nonempty', (SELECT COUNT(*) FROM hr_article WHERE catid = 552 AND TRIM(text) <> ''),
    'series_matecode_nonempty', (SELECT COUNT(*) FROM hr_article WHERE catid = 550 AND TRIM(matecode) <> '')
  ),
  'catid_distribution', COALESCE((
    SELECT JSON_ARRAYAGG(JSON_OBJECT('catid', catid, 'rows', rows_count))
    FROM (SELECT catid, COUNT(*) AS rows_count FROM hr_article GROUP BY catid ORDER BY rows_count DESC) d
  ), JSON_ARRAY()),
  'languages', COALESCE((
    SELECT JSON_ARRAYAGG(JSON_OBJECT('language', language, 'langCode', langCode, 'rows', rows_count))
    FROM (SELECT language, langCode, COUNT(*) AS rows_count FROM hr_article GROUP BY language, langCode ORDER BY rows_count DESC) d
  ), JSON_ARRAY()),
  'duplicate_order_no', COALESCE((
    SELECT JSON_ARRAYAGG(JSON_OBJECT('order_no', value, 'rows', rows_count, 'ids', ids))
    FROM (
      SELECT TRIM(text) AS value, COUNT(*) AS rows_count, GROUP_CONCAT(id ORDER BY id) AS ids
      FROM hr_article WHERE catid = 552 AND TRIM(text) <> ''
      GROUP BY TRIM(text) HAVING COUNT(*) > 1 ORDER BY rows_count DESC, value LIMIT 50
    ) d
  ), JSON_ARRAY()),
  'duplicate_matecode', COALESCE((
    SELECT JSON_ARRAYAGG(JSON_OBJECT('matecode', value, 'rows', rows_count, 'ids', ids))
    FROM (
      SELECT TRIM(matecode) AS value, COUNT(*) AS rows_count, GROUP_CONCAT(id ORDER BY id) AS ids
      FROM hr_article WHERE catid = 550 AND TRIM(matecode) <> ''
      GROUP BY TRIM(matecode) HAVING COUNT(*) > 1 ORDER BY rows_count DESC, value LIMIT 50
    ) d
  ), JSON_ARRAY()),
  'orphan_product_series', COALESCE((
    SELECT JSON_ARRAYAGG(JSON_OBJECT('matecode', value, 'rows', rows_count))
    FROM (
      SELECT TRIM(p.matecode) AS value, COUNT(*) AS rows_count
      FROM hr_article p LEFT JOIN hr_article s ON s.catid = 550 AND TRIM(s.matecode) = TRIM(p.matecode)
      WHERE p.catid = 552 AND TRIM(p.matecode) <> '' AND s.id IS NULL
      GROUP BY TRIM(p.matecode) ORDER BY rows_count DESC, value LIMIT 50
    ) d
  ), JSON_ARRAY()),
  'quality', JSON_OBJECT(
    'blank_product_order_no', (SELECT COUNT(*) FROM hr_article WHERE catid = 552 AND TRIM(text) = ''),
    'blank_product_title', (SELECT COUNT(*) FROM hr_article WHERE catid = 552 AND TRIM(title) = ''),
    'blank_product_series_code', (SELECT COUNT(*) FROM hr_article WHERE catid = 552 AND TRIM(matecode) = ''),
    'blank_series_title', (SELECT COUNT(*) FROM hr_article WHERE catid = 550 AND TRIM(title) = ''),
    'duplicate_order_no_groups', (SELECT COUNT(*) FROM (SELECT TRIM(text) AS value FROM hr_article WHERE catid = 552 AND TRIM(text) <> '' GROUP BY TRIM(text) HAVING COUNT(*) > 1) d),
    'duplicate_matecode_groups', (SELECT COUNT(*) FROM (SELECT TRIM(matecode) AS value FROM hr_article WHERE catid = 550 AND TRIM(matecode) <> '' GROUP BY TRIM(matecode) HAVING COUNT(*) > 1) d),
    'orphan_product_series_groups', (SELECT COUNT(*) FROM (SELECT DISTINCT TRIM(p.matecode) AS value FROM hr_article p LEFT JOIN hr_article s ON s.catid = 550 AND TRIM(s.matecode) = TRIM(p.matecode) WHERE p.catid = 552 AND TRIM(p.matecode) <> '' AND s.id IS NULL) d),
    'product_without_media', (SELECT COUNT(*) FROM hr_article WHERE catid = 552 AND TRIM(thumb) = '' AND TRIM(thumb1) = '' AND TRIM(thumb2) = '' AND TRIM(thumb3) = '' AND TRIM(thumb4) = '' AND TRIM(thumb5) = '' AND TRIM(thumb6) = '' AND TRIM(thumb7) = '' AND TRIM(media) = '' AND TRIM(file) = '' AND TRIM(more_img) = ''),
    'product_without_legacy_url', (SELECT COUNT(*) FROM hr_article WHERE catid = 552 AND TRIM(url) = '')
  )
) AS report_json;
`;

export function parseProfileJson(stdout) {
  const line = stdout
    .split(/\r?\n/)
    .map((value) => value.trim())
    .find((value) => value.startsWith("{"));
  if (!line) throw new Error("MySQL did not return a JSON profile");
  return JSON.parse(line);
}

export function runLegacyProfile({ outputPath } = {}) {
  const result = spawnSync(MYSQL_BIN, [
    `--host=${MYSQL_HOST}`,
    `--port=${MYSQL_PORT}`,
    `--user=${MYSQL_USER}`,
    `--database=${MYSQL_DATABASE}`,
    "--batch",
    "--raw",
    "--skip-column-names",
  ], {
    input: LEGACY_PROFILE_SQL,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.status !== 0) {
    throw new Error(`MySQL profile failed (${result.status}): ${result.stderr || result.stdout}`);
  }

  const report = parseProfileJson(result.stdout);
  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const outputPath = process.argv[2] ?? path.resolve("data/migration/reports/legacy-profile.json");
  const report = runLegacyProfile({ outputPath });
  console.log(`WROTE ${outputPath}`);
  console.log(JSON.stringify({ source: report.source, counts: report.counts, quality: report.quality }, null, 2));
}
