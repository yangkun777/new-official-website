import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const templates = {
  category: "id,level,parent_id,image,sort,status",
  category_translations:
    "id,language,category_id,name,slug,seo_title,seo_description,h1,short_description,description",
  series: "id,matecode,category_id,image,sort,status",
  series_translations:
    "id,language,series_id,name,slug,seo_title,seo_description,h1,short_description,description",
  product: "id,order_no,title,series_id,poles,pitch,combined_title,status",
  product_translations:
    "id,language,product_id,name,slug,seo_title,seo_description,h1,short_description,description",
  news: "id,cover_image,publish_date,sort,status",
  news_translations:
    "id,language,news_id,name,slug,seo_title,seo_description,h1,short_description,description",
};

for (const [collection, expectedHeader] of Object.entries(templates)) {
  const content = readFileSync(
    join(ROOT, "docs", "import-templates", `${collection}.csv`),
    "utf8",
  ).replace(/^\uFEFF/, "");
  const lines = content.trimEnd().split(/\r?\n/);
  assert.equal(lines.length, 1, `${collection}.csv 必须只包含表头`);
  assert.equal(lines[0], expectedHeader, `${collection}.csv 表头不符合当前模型`);
}

const applySource = readFileSync(
  join(ROOT, "data", "apply_content_editor_access.mjs"),
  "utf8",
);
for (const value of [
  "Content Editor",
  "app_access: true",
  "admin_access: false",
  "directus_files",
  '"read", "create", "update"',
  "DESIRED_PERMISSION_KEYS",
  "BUSINESS_FIELD_ALLOWLISTS",
  "DIRECTUS_FILES_READ_FIELDS",
  "DIRECTUS_FILES_CREATE_FIELDS",
  '"translations"',
  '"media_links"',
  "duplicate",
  "REMOVE access",
  "REMOVE permission",
]) {
  assert.ok(applySource.includes(value), `权限脚本缺少静态契约：${value}`);
}
assert.ok(!applySource.includes('"/users"'), "apply 脚本不得创建永久用户");
assert.ok(!applySource.includes('fields: ["*"]'), "权限脚本不得使用字段通配符");

const integrationSource = readFileSync(
  join(ROOT, "data", "verify_native_import_export.mjs"),
  "utf8",
);
for (const endpoint of [
  "/utils/import/product",
  "/utils/export/product",
  "/files/",
  "/assets/",
]) {
  assert.ok(
    integrationSource.includes(endpoint),
    `真实 API 验证缺少端点：${endpoint}`,
  );
}
assert.ok(integrationSource.includes("finally"), "真实 API 验证必须使用 finally 清理");
for (const value of [
  "Promise.allSettled",
  "cleanupIdsKnownFirst",
  "cleanupExportFilesUntilQuiet",
  "finalExportCleanup",
  "deletePathWithRetry",
  "EXPORT_CLEANUP_TOTAL_MAX_MS",
  "parseCsv",
  "中文",
  "DIRECTUS_TOKEN",
  "expectedPermissionKeys",
]) {
  assert.ok(integrationSource.includes(value), `真实 API 验证缺少静态契约：${value}`);
}
assert.ok(
  !integrationSource.includes("matchAll("),
  "Web token 不得扫描任意 TOKEN 环境变量",
);

const cleanupVerifier = readFileSync(
  join(ROOT, "data", "verify_native_import_export_cleanup.mjs"),
  "utf8",
);
for (const scenario of [
  "query unavailable",
  "fetch failed",
  "late-file",
  "从未观察到文件时过早结束",
]) {
  assert.ok(cleanupVerifier.includes(scenario), `清理失败验证缺少场景：${scenario}`);
}

const guide = readFileSync(
  join(ROOT, "docs", "Directus原生导入导出操作手册.md"),
  "utf8",
);
for (const phrase of [
  "CSV UTF-8",
  "必须保留原 `id`",
  "Directus 内部 ID",
  "可能把数据库原值覆盖为空",
  "当前原生不支持",
  "真实 API 验收",
]) {
  assert.ok(guide.includes(phrase), `操作手册缺少说明：${phrase}`);
}

console.log("PASS native import/export static contract");
