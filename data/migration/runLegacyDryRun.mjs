import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractLegacyBatch } from "./extractLegacyBatch.mjs";
import { partitionLegacyBatch, summarizeCategoryGaps } from "./partitionLegacyBatch.mjs";

function option(name, fallback) {
  const value = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return value ? Number(value.slice(name.length + 3)) : fallback;
}

export function runLegacyDryRun({ productLimit = 20000, outputPath } = {}) {
  const extracted = extractLegacyBatch({ productLimit });
  const partition = partitionLegacyBatch(extracted.mapped);
  const output = {
    generated_at: new Date().toISOString(),
    source: extracted.source,
    extraction_counts: extracted.counts,
    validation: extracted.validation,
    partition: {
      counts: partition.counts,
      category_gaps: summarizeCategoryGaps(extracted.mapped),
      review_reason_counts: partition.review.reduce((counts, row) => {
        counts[row.reason_code] = (counts[row.reason_code] ?? 0) + 1;
        return counts;
      }, {}),
      reject_reason_counts: partition.reject.reduce((counts, row) => {
        counts[row.reason_code] = (counts[row.reason_code] ?? 0) + 1;
        return counts;
      }, {}),
    },
  };
  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  }
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const productLimit = option("product-limit", 20000);
  const outputPath = process.argv.find((arg) => arg.startsWith("--output="))?.slice("--output=".length)
    ?? path.resolve("data/migration/reports/legacy-dry-run.json");
  const output = runLegacyDryRun({ productLimit, outputPath });
  console.log(`WROTE ${outputPath}`);
  console.log(JSON.stringify({
    extraction_counts: output.extraction_counts,
    partition: output.partition,
  }, null, 2));
}
