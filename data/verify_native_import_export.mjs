import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import {
  cleanupIdsKnownFirst,
  cleanupUntilObservedAndQuiet,
  deletePathWithRetry,
} from "./native_import_export_cleanup.mjs";

const BASE = process.env.DIRECTUS_URL ?? "http://localhost:8055";
const ADMIN_TOKEN_FILE =
  process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? "D:/degson-pilot/.admin_token";
const ADMIN_TOKEN =
  process.env.DIRECTUS_ADMIN_TOKEN ?? readFileSync(ADMIN_TOKEN_FILE, "utf8").trim();
const ROOT = new URL("../", import.meta.url);
const POLICY_NAME = "Content Editor";
const ROLE_NAME = "Content Editor";
const BUSINESS_COLLECTIONS = [
  "category",
  "category_translations",
  "series",
  "series_translations",
  "product",
  "product_translations",
  "news",
  "news_translations",
];
const BUSINESS_ACTIONS = ["read", "create", "update"];
const prefix = `native_io_${Date.now()}_${randomBytes(4).toString("hex")}`;
const temporaryEmail = `native-io-${Date.now()}-${randomBytes(4).toString("hex")}@example.com`;
const orderNo = prefix;
const exportTitle = `${prefix}.csv`;
const createdTitle = `中文导入-${prefix}`;
const updatedTitle = `中文更新,完整往返-${prefix}`;
const EXPORT_CLEANUP_MAX_MS = 8_000;
const EXPORT_QUIET_PERIOD_MS = 1_500;
const EXPORT_CLEANUP_TOTAL_MAX_MS = 12_000;
const expectedPermissionKeys = [
  ...BUSINESS_COLLECTIONS.flatMap((collection) =>
    BUSINESS_ACTIONS.map((action) => `${collection}:${action}`),
  ),
  "directus_files:read",
  "directus_files:create",
].sort();
const BUSINESS_FIELD_ALLOWLISTS = {
  category: ["id", "level", "parent_id", "image", "sort", "status", "translations"],
  category_translations: [
    "id", "language", "category_id", "name", "slug", "seo_title",
    "seo_description", "h1", "short_description", "description",
  ],
  series: ["id", "matecode", "category_id", "image", "sort", "status", "translations"],
  series_translations: [
    "id", "language", "series_id", "name", "slug", "seo_title",
    "seo_description", "h1", "short_description", "description",
  ],
  product: [
    "id", "order_no", "title", "series_id", "poles", "pitch",
    "combined_title", "status", "translations", "media_links",
  ],
  product_translations: [
    "id", "language", "product_id", "name", "slug", "seo_title",
    "seo_description", "h1", "short_description", "description",
  ],
  news: ["id", "cover_image", "publish_date", "sort", "status", "translations"],
  news_translations: [
    "id", "language", "news_id", "name", "slug", "seo_title",
    "seo_description", "h1", "short_description", "description",
  ],
};
const DIRECTUS_FILES_READ_FIELDS = [
  "id", "storage", "filename_disk", "filename_download", "title", "type",
  "filesize", "folder", "uploaded_on", "modified_on",
];
const DIRECTUS_FILES_CREATE_FIELDS = [
  "storage", "filename_disk", "filename_download", "title", "type",
];
const expectedFieldsByPermission = new Map([
  ...Object.entries(BUSINESS_FIELD_ALLOWLISTS).flatMap(([collection, fields]) =>
    BUSINESS_ACTIONS.map((action) => [`${collection}:${action}`, fields]),
  ),
  ["directus_files:read", DIRECTUS_FILES_READ_FIELDS],
  ["directus_files:create", DIRECTUS_FILES_CREATE_FIELDS],
]);

let temporaryUserId;
let productId;
let exportFileId;
let primaryError;
const cleanupErrors = [];

async function request(method, path, { token = ADMIN_TOKEN, body, headers = {} } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { response, data };
}

async function jsonRequest(method, path, options = {}) {
  const body =
    options.body === undefined ? undefined : JSON.stringify(options.body);
  return request(method, path, {
    ...options,
    body,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

function expectOk(result, operation) {
  assert.ok(
    result.response.ok,
    `${operation} failed with HTTP ${result.response.status}: ${JSON.stringify(result.data)}`,
  );
  return result.data?.data;
}

async function importCsv(token, csv) {
  const form = new FormData();
  form.append("file", new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }), `${prefix}.csv`);
  return request("POST", "/utils/import/product", { token, body: form });
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const input = String(text).replace(/^\uFEFF/, "");
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  assert.equal(quoted, false, "导出 CSV 包含未闭合引号");
  return rows;
}

async function readWebToken() {
  const candidates = [];
  const tokenFile = "D:/degson-pilot/.web_token";
  if (existsSync(tokenFile)) {
    candidates.push(readFileSync(tokenFile, "utf8").trim());
  }

  const envFile = new URL("web/.env.local", ROOT);
  if (existsSync(envFile)) {
    const env = readFileSync(envFile, "utf8");
    const match = env.match(/^\s*DIRECTUS_TOKEN\s*=\s*(.+?)\s*$/m);
    if (match) candidates.push(match[1].replace(/^(['"])(.*)\1$/, "$2"));
  }
  if (!candidates.length) {
    throw new Error("未找到现有 Web 只读 token（.web_token 或 web/.env.local）");
  }

  for (const candidate of new Set(candidates.filter(Boolean))) {
    const probe = await jsonRequest("GET", "/users/me?fields=id", {
      token: candidate,
    });
    if (probe.response.ok) return candidate;
  }
  throw new Error("现有 Web 只读 token 均无效");
}

async function deletePath(path, label) {
  return deletePathWithRetry({
    requestDelete: async () => (await jsonRequest("DELETE", path)).response,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    label,
    maxAttempts: 3,
  });
}

async function waitForExportFile(token) {
  const path =
    `/files?filter[title][_eq]=${encodeURIComponent(exportTitle)}` +
    "&limit=2&fields=id,title,filename_download,type,filesize";
  for (let attempt = 0; attempt < 50; attempt++) {
    const files = expectOk(
      await jsonRequest("GET", path, { token }),
      "查询导出文件记录",
    );
    if (files.length && files.every((file) => Number(file.filesize) > 0)) return files;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return [];
}

async function cleanupExportFilesUntilQuiet() {
  return cleanupUntilObservedAndQuiet({
    listIds: async () => {
      const files = expectOk(
        await jsonRequest(
          "GET",
          `/files?filter[title][_eq]=${encodeURIComponent(exportTitle)}&limit=-1&fields=id`,
        ),
        "查找待清理导出文件",
      );
      return files.map((file) => file.id);
    },
    deleteId: (id) => deletePath(`/files/${id}`, `删除导出文件 ${id}`),
    now: Date.now,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    lateWindowMs: EXPORT_CLEANUP_MAX_MS,
    quietPeriodMs: EXPORT_QUIET_PERIOD_MS,
    pollMs: 100,
    maxTotalMs: EXPORT_CLEANUP_TOTAL_MAX_MS,
  });
}

async function cleanupProducts() {
  return cleanupIdsKnownFirst({
    knownIds: [productId],
    discoverIds: async () => {
      const products = expectOk(
        await jsonRequest(
          "GET",
          `/items/product?filter[order_no][_eq]=${encodeURIComponent(orderNo)}&limit=-1&fields=id`,
        ),
        "查找待清理测试产品",
      );
      return products.map((item) => item.id);
    },
    deleteId: (id) => deletePath(`/items/product/${id}`, `删除测试产品 ${id}`),
  });
}

async function cleanupUsers() {
  return cleanupIdsKnownFirst({
    knownIds: [temporaryUserId],
    discoverIds: async () => {
      const users = expectOk(
        await jsonRequest(
          "GET",
          `/users?filter[email][_eq]=${encodeURIComponent(temporaryEmail)}&limit=-1&fields=id`,
        ),
        "查找待清理临时用户",
      );
      return users.map((item) => item.id);
    },
    deleteId: (id) => deletePath(`/users/${id}`, `删除临时用户 ${id}`),
  });
}

try {
  const policies = expectOk(
    await jsonRequest("GET", "/policies?limit=-1&fields=id,name,app_access,admin_access"),
    "读取 policies",
  );
  const policy = policies.find((item) => item.name === POLICY_NAME);
  assert.ok(policy, `缺少 ${POLICY_NAME} policy`);
  assert.equal(policy.app_access, true, `${POLICY_NAME} policy 必须启用 app_access`);
  assert.equal(policy.admin_access, false, `${POLICY_NAME} policy 不应拥有 admin_access`);

  const roles = expectOk(
    await jsonRequest("GET", "/roles?limit=-1&fields=id,name"),
    "读取 roles",
  );
  const role = roles.find((item) => item.name === ROLE_NAME);
  assert.ok(role, `缺少 ${ROLE_NAME} role`);

  const accesses = expectOk(
    await jsonRequest("GET", "/access?limit=-1&fields=id,role,policy"),
    "读取 access",
  );
  const roleAccesses = accesses.filter((item) => item.role === role.id);
  assert.equal(
    roleAccesses.length,
    1,
    `${ROLE_NAME} role 必须且只能关联一个 policy`,
  );
  assert.equal(roleAccesses[0].policy, policy.id, `${ROLE_NAME} role 关联了错误 policy`);

  const permissions = expectOk(
    await jsonRequest(
      "GET",
      `/permissions?limit=-1&filter[policy][_eq]=${encodeURIComponent(policy.id)}&fields=id,collection,action,fields,permissions,validation,presets`,
    ),
    "读取 permissions",
  );
  const actualPermissionKeys = permissions
    .map((item) => `${item.collection}:${item.action}`)
    .sort();
  assert.deepEqual(
    actualPermissionKeys,
    expectedPermissionKeys,
    `${POLICY_NAME} policy 权限必须精确匹配计划且无重复项`,
  );
  for (const permission of permissions) {
    const key = `${permission.collection}:${permission.action}`;
    assert.deepEqual(
      [...permission.fields].sort(),
      [...expectedFieldsByPermission.get(key)].sort(),
      `${key} fields`,
    );
    assert.deepEqual(permission.permissions ?? {}, {}, `${permission.collection}:${permission.action} filter`);
    assert.deepEqual(permission.validation ?? {}, {}, `${permission.collection}:${permission.action} validation`);
    assert.deepEqual(permission.presets ?? {}, {}, `${permission.collection}:${permission.action} presets`);
  }
  console.log("PASS policy/role/access/permission matrix");

  const editorToken = `native_${randomBytes(24).toString("hex")}`;
  const user = expectOk(
    await jsonRequest("POST", "/users", {
      body: {
        email: temporaryEmail,
        password: randomBytes(24).toString("base64url"),
        role: role.id,
        token: editorToken,
        status: "active",
        first_name: "Native Import Export",
        last_name: "Verifier",
      },
    }),
    "创建临时 Content Editor 用户",
  );
  temporaryUserId = user.id;

  const createCsv = [
    "order_no,title,status,series_id",
    [orderNo, createdTitle, "draft", ""].map(csvCell).join(","),
    "",
  ].join("\n");
  expectOk(await importCsv(editorToken, createCsv), "CSV 创建导入");

  const query = expectOk(
    await jsonRequest(
      "GET",
      `/items/product?filter[order_no][_eq]=${encodeURIComponent(orderNo)}&limit=2&fields=id,order_no,title,status,series_id`,
      { token: editorToken },
    ),
    "查询导入产品",
  );
  assert.equal(query.length, 1, "CSV 创建导入应只生成一条测试产品");
  productId = query[0].id;
  assert.equal(query[0].status, "draft");
  assert.equal(query[0].title, createdTitle, "CSV 新增应保留 UTF-8 中文");

  const updateCsv = [
    "id,order_no,title,status,series_id",
    [productId, orderNo, updatedTitle, "draft", ""].map(csvCell).join(","),
    "",
  ].join("\n");
  expectOk(await importCsv(editorToken, updateCsv), "CSV upsert 导入");

  const updated = expectOk(
    await jsonRequest("GET", `/items/product/${productId}?fields=id,title,status`, {
      token: editorToken,
    }),
    "读取 upsert 结果",
  );
  assert.equal(updated.title, updatedTitle, "带 id 的 CSV 应更新并保留 UTF-8 中文");
  assert.equal(updated.status, "draft");
  console.log("PASS CSV create and id-based upsert");

  expectOk(
    await jsonRequest("POST", "/utils/export/product", {
      token: editorToken,
      body: {
        format: "csv",
        query: {
          filter: { id: { _eq: productId } },
          fields: ["id", "order_no", "title", "status", "series_id"],
          limit: 1,
        },
        file: {
          title: exportTitle,
          filename_download: exportTitle,
          type: "text/csv",
        },
      },
    }),
    "导出筛选产品",
  );

  const exportedFiles = await waitForExportFile(editorToken);
  assert.equal(exportedFiles.length, 1, "导出应生成一条 directus_files 记录");
  exportFileId = exportedFiles[0].id;

  const file = expectOk(
    await jsonRequest(
      "GET",
      `/files/${exportFileId}?fields=id,title,filename_download,type,filesize`,
      { token: editorToken },
    ),
    "读取导出文件记录",
  );
  assert.equal(file.id, exportFileId);
  const asset = await request("GET", `/assets/${exportFileId}`, { token: editorToken });
  assert.ok(asset.response.ok, `下载导出文件失败：HTTP ${asset.response.status}`);
  const rows = parseCsv(asset.data);
  assert.ok(rows.length >= 2, "导出 CSV 缺少数据行");
  const header = rows[0];
  const records = rows.slice(1).map((row) =>
    Object.fromEntries(header.map((field, index) => [field, row[index] ?? ""])),
  );
  const exportedProduct = records.find((record) => record.order_no === orderNo);
  assert.ok(exportedProduct, "导出 CSV 不包含测试记录");
  assert.equal(exportedProduct.title, updatedTitle, "导出 CSV 中文未完整往返");
  assert.equal(exportedProduct.status, "draft");
  assert.equal(
    records.filter((record) => record.order_no === orderNo).length,
    1,
    "筛选导出只能包含一条测试记录",
  );
  console.log("PASS filtered CSV export and UTF-8 Chinese round trip");

  const webToken = await readWebToken();
  assert.ok(webToken, "Web 只读 token 为空");
  const denied = await importCsv(webToken, createCsv);
  assert.equal(
    denied.response.status,
    403,
    `Web 只读 token 导入应返回 403，实际为 ${denied.response.status}`,
  );
  console.log("PASS Web read-only token import denied with 403");
} catch (error) {
  primaryError = error;
} finally {
  const primaryCleanup = await Promise.allSettled([
    cleanupExportFilesUntilQuiet(),
    cleanupProducts(),
  ]);
  for (const result of primaryCleanup) {
    if (result.status === "rejected") cleanupErrors.push(result.reason.message);
  }

  const userCleanup = await Promise.allSettled([cleanupUsers()]);
  for (const result of userCleanup) {
    if (result.status === "rejected") cleanupErrors.push(result.reason.message);
  }

  const finalExportCleanup = await Promise.allSettled([
    cleanupExportFilesUntilQuiet(),
  ]);
  for (const result of finalExportCleanup) {
    if (result.status === "rejected") cleanupErrors.push(result.reason.message);
  }

  const finalChecks = await Promise.allSettled([
    jsonRequest(
      "GET",
      `/items/product?filter[order_no][_eq]=${encodeURIComponent(orderNo)}&limit=1&fields=id`,
    ).then((result) => {
      const leftovers = expectOk(result, "检查测试产品清理");
      assert.equal(leftovers.length, 0, "测试产品仍然存在");
    }),
    jsonRequest(
      "GET",
      `/users?filter[email][_eq]=${encodeURIComponent(temporaryEmail)}&limit=1&fields=id`,
    ).then((result) => {
      const leftovers = expectOk(result, "检查临时用户清理");
      assert.equal(leftovers.length, 0, "临时用户仍然存在");
    }),
  ]);
  for (const result of finalChecks) {
    if (result.status === "rejected") cleanupErrors.push(result.reason.message);
  }
}

if (cleanupErrors.length) {
  throw new AggregateError(
    [primaryError, ...cleanupErrors].filter(Boolean),
    `清理失败：${cleanupErrors.join("; ")}`,
  );
}
console.log("PASS cleanup (no test product, export file, or temporary user retained)");
if (primaryError) throw primaryError;
