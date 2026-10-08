import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mapLegacyBatch, validateMigrationBatch } from "./legacyContract.mjs";

const MYSQL_BIN = process.env.MYSQL_BIN ?? "D:\\degson-pilot\\mysql\\bin\\mysql.exe";
const MYSQL_HOST = process.env.LEGACY_MYSQL_HOST ?? "127.0.0.1";
const MYSQL_PORT = process.env.LEGACY_MYSQL_PORT ?? "3307";
const MYSQL_USER = process.env.LEGACY_MYSQL_USER ?? "root";
const MYSQL_DATABASE = process.env.LEGACY_MYSQL_DATABASE ?? "degson_legacy";

function option(name, fallback) {
  const value = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return value ? Number(value.slice(name.length + 3)) : fallback;
}

export function buildExtractionSql(productLimit = 500) {
  if (!Number.isInteger(productLimit) || productLimit < 1 || productLimit > 5000) {
    throw new Error("productLimit must be an integer from 1 to 5000");
  }

  return `
SET SESSION group_concat_max_len = 67108864;
SELECT JSON_OBJECT(
  'language', 'en',
  'categories', COALESCE((
    SELECT JSON_ARRAYAGG(JSON_OBJECT(
      'catid', catid,
      'parentid', parentid,
      'catname', catname,
      'engname', engname,
      'en_catname', en_catname,
      'image', image
    ))
    FROM hr_category
    WHERE isdel = 0
  ), JSON_ARRAY()),
  'series', COALESCE((
    SELECT JSON_ARRAYAGG(JSON_OBJECT(
      'id', id,
      'classify', classify,
      'matecode', matecode,
      'title', title,
      'thumb', thumb
    ))
    FROM hr_article
    WHERE catid = 550 AND language = 'en' AND status = '1'
  ), JSON_ARRAY()),
  'products', COALESCE((
    SELECT JSON_ARRAYAGG(JSON_OBJECT(
      'id', id,
      'matecode', matecode,
      'text', text,
      'title', title,
      'text1', text1,
      'text2', text2,
      'combined_title', combined_title
    ))
    FROM (
      SELECT id, matecode, text, title, text1, text2, combined_title, thumb, description, url
      FROM hr_article
      WHERE catid = 552 AND language = 'en' AND status = '1' AND TRIM(text) <> ''
      ORDER BY id
      LIMIT ${productLimit}
    ) sample
  ), JSON_ARRAY())
) AS extraction_json;
`;
}

function parseJson(stdout) {
  const line = stdout
    .split(/\r?\n/)
    .map((value) => value.trim())
    .find((value) => value.startsWith("{"));
  if (!line) throw new Error("MySQL did not return extraction JSON");
  return JSON.parse(line);
}

export function extractLegacyBatch({ productLimit = 500, outputPath } = {}) {
  const result = spawnSync(MYSQL_BIN, [
    `--host=${MYSQL_HOST}`,
    `--port=${MYSQL_PORT}`,
    `--user=${MYSQL_USER}`,
    `--database=${MYSQL_DATABASE}`,
    "--batch",
    "--raw",
    "--skip-column-names",
  ], {
    input: buildExtractionSql(productLimit),
    encoding: "utf8",
    env: process.env,
    maxBuffer: 100 * 1024 * 1024,
  });

  if (result.status !== 0) {
    throw new Error(`MySQL extraction failed (${result.status}): ${result.stderr || result.stdout}`);
  }

  const source = parseJson(result.stdout);
  const mapped = mapLegacyBatch(source);
  const validation = validateMigrationBatch(mapped);
  const output = {
    source: {
      database: MYSQL_DATABASE,
      host: MYSQL_HOST,
      port: Number(MYSQL_PORT),
      language: source.language,
      product_limit: productLimit,
    },
    counts: {
      categories: mapped.categories.length,
      series: mapped.series.length,
      products: mapped.products.length,
    },
    validation,
    mapped,
  };

  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  }
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const productLimit = option("product-limit", 500);
  const outputPath = process.argv.find((arg) => arg.startsWith("--output="))?.slice("--output=".length)
    ?? path.resolve("data/migration/reports/legacy-batch-preview.json");
  const output = extractLegacyBatch({ productLimit, outputPath });
  console.log(`WROTE ${outputPath}`);
  console.log(JSON.stringify({
    counts: output.counts,
    validation: {
      error_count: output.validation.errors.length,
      warning_count: output.validation.warnings.length,
      first_errors: output.validation.errors.slice(0, 10),
      warnings: output.validation.warnings,
    },
  }, null, 2));
}
