import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const checks = [
  ["site URL policy", ["--experimental-strip-types", "data/verify_site_urls.mjs"]],
  ["content constraints", ["data/verify_constraints.mjs"]],
  ["content safety and media", ["--experimental-strip-types", "data/verify_content_safety.mjs"]],
  ["cache tag contract", ["--experimental-strip-types", "data/verify_cache_contract.mjs"]],
  ["legacy migration contract", ["data/verify_migration_contract.mjs"]],
  ["variant pagination", ["data/verify_variant_pagination.mjs"]],
  ["category pagination", ["data/verify_category_pagination.mjs"]],
  ["pagination limits", ["data/verify_pagination_limits.mjs"]],
  ["model builder syntax", ["--check", "data/build_model.mjs"]],
];

for (const [label, args] of checks) {
  const result = spawnSync(process.execPath, args, { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(`FAIL ${label}\n${result.stdout}${result.stderr}`);
    process.exit(result.status ?? 1);
  }
  process.stdout.write(`PASS ${label}\n`);
}

assert.equal(checks.length, 9);
console.log("PASS base hardening verifier");
