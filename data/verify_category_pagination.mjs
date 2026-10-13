import assert from "node:assert/strict";
import fs from "node:fs";

const repo = fs.readFileSync("web/src/lib/repo.ts", "utf8");
assert.match(repo, /async function getCategoryPage/);
assert.match(repo, /export async function getCategoriesByLevel[\s\S]*?Math\.ceil\(first\.total \/ limit\)/);
assert.match(repo, /export async function getSubCategories[\s\S]*?Math\.ceil\(first\.total \/ limit\)/);
assert.doesNotMatch(repo, /getCategoriesByLevel[\s\S]*?limit: "100"/);
assert.doesNotMatch(repo, /getSubCategories[\s\S]*?limit: "100"/);

console.log("PASS category pagination contract");
