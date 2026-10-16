import { readFileSync } from "node:fs";

const BASE = process.env.DIRECTUS_URL ?? "http://localhost:8055";
const ADMIN_TOKEN_FILE =
  process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? "D:/degson-pilot/.admin_token";
const ADMIN_TOKEN =
  process.env.DIRECTUS_ADMIN_TOKEN ?? readFileSync(ADMIN_TOKEN_FILE, "utf8").trim();
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
  "site_pages",
  "site_pages_translations",
  "home_blocks",
  "home_blocks_translations",
  "page_sections",
  "page_sections_translations",
  "social_links",
  "site_settings",
];
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
  site_pages: [
    "id", "slug", "status", "sort", "cover_image",
    "panel_image_1", "panel_image_2", "panel_image_3", "translations", "list_title",
  ],
  site_pages_translations: [
    "id", "language", "site_pages_id", "title", "summary", "body",
    "seo_title", "seo_description",
    "panel_1_title", "panel_1_text", "panel_2_title", "panel_2_text",
    "panel_3_title", "panel_3_text",
  ],
  home_blocks: [
    "id", "key", "label", "kind", "image", "link_path", "sort", "status", "translations",
  ],
  home_blocks_translations: [
    "id", "language", "home_blocks_id", "title", "text", "cta",
  ],
  page_sections: [
    "id", "page_slug", "parent_id", "list_title", "sort", "status", "image",
    "translations", "children",
  ],
  page_sections_translations: [
    "id", "language", "page_sections_id", "title", "intro",
    "stat1", "stat1_label", "stat2", "stat2_label", "intro1", "intro2",
  ],
  social_links: ["id", "platform", "label", "url", "sort", "status"],
  site_settings: [
    "id", "site_name", "site_description", "site_description_zh",
    "hero_title", "hero_subtitle", "hero_title_zh", "hero_subtitle_zh",
    "footer_text", "footer_text_zh", "contact_email",
    "hero_image", "hero_kicker", "hero_kicker_zh",
    "cta_title", "cta_title_zh", "cta_text", "cta_text_zh", "cta_link",
  ],
};
const DIRECTUS_FILES_READ_FIELDS = [
  "id", "storage", "filename_disk", "filename_download", "title", "type",
  "filesize", "folder", "uploaded_on", "modified_on",
];
const DIRECTUS_FILES_CREATE_FIELDS = [
  "storage", "filename_disk", "filename_download", "title", "type",
];
const DESIRED_PERMISSIONS = [
  ...BUSINESS_COLLECTIONS.filter((collection) => collection !== "site_settings").flatMap((collection) =>
    ["read", "create", "update"].map((action) => ({
      collection,
      action,
      fields: BUSINESS_FIELD_ALLOWLISTS[collection],
    })),
  ),
  ...["read", "update"].map((action) => ({
    collection: "site_settings",
    action,
    fields: BUSINESS_FIELD_ALLOWLISTS.site_settings,
  })),
  { collection: "directus_files", action: "read", fields: DIRECTUS_FILES_READ_FIELDS },
  { collection: "directus_files", action: "create", fields: DIRECTUS_FILES_CREATE_FIELDS },
];
const DESIRED_PERMISSION_KEYS = new Set(
  DESIRED_PERMISSIONS.map(({ collection, action }) => `${collection}:${action}`),
);

let created = 0;
let updated = 0;
let removed = 0;
let unchanged = 0;

async function request(method, path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error(
      `${method} ${path} failed with HTTP ${response.status}: ${JSON.stringify(data)}`,
    );
  }
  return data?.data;
}

async function ensurePolicy() {
  const policies = await request(
    "GET",
    "/policies?limit=-1&fields=id,name,app_access,admin_access",
  );
  let policy = policies.find((item) => item.name === POLICY_NAME);
  if (!policy) {
    policy = await request("POST", "/policies", {
      name: POLICY_NAME,
      icon: "edit_note",
      description: "内容编辑：原生 CSV 导入导出，不含删除权限",
      app_access: true,
      admin_access: false,
    });
    created++;
    console.log(`CREATE policy ${POLICY_NAME}`);
    return policy;
  }

  if (policy.app_access !== true || policy.admin_access !== false) {
    policy = await request("PATCH", `/policies/${policy.id}`, {
      app_access: true,
      admin_access: false,
    });
    updated++;
    console.log(`UPDATE policy ${POLICY_NAME}`);
  } else {
    unchanged++;
  }
  return policy;
}

async function ensureRole() {
  const roles = await request("GET", "/roles?limit=-1&fields=id,name");
  let role = roles.find((item) => item.name === ROLE_NAME);
  if (!role) {
    role = await request("POST", "/roles", {
      name: ROLE_NAME,
      icon: "edit_note",
      description: "内容编辑角色",
    });
    created++;
    console.log(`CREATE role ${ROLE_NAME}`);
  } else {
    unchanged++;
  }
  return role;
}

async function ensureAccess(roleId, policyId) {
  const access = await request(
    "GET",
    `/access?limit=-1&filter[role][_eq]=${encodeURIComponent(roleId)}&fields=id,role,policy`,
  );
  const desired = access.filter((item) => item.policy === policyId);
  let retained = desired[0];
  if (!retained) {
    retained = await request("POST", "/access", { role: roleId, policy: policyId });
    created++;
    console.log(`CREATE access ${ROLE_NAME} -> ${POLICY_NAME}`);
  } else {
    unchanged++;
  }

  for (const duplicate of desired.slice(1)) {
    await request("DELETE", `/access/${duplicate.id}`);
    removed++;
    console.log(`REMOVE access duplicate ${ROLE_NAME} -> ${POLICY_NAME}`);
  }
  for (const extra of access.filter((item) => item.policy !== policyId)) {
    await request("DELETE", `/access/${extra.id}`);
    removed++;
    console.log(`REMOVE access ${ROLE_NAME} -> ${extra.policy}`);
  }
}

async function reconcilePermissions(policyId) {
  const permissions = await request(
    "GET",
    `/permissions?limit=-1&filter[policy][_eq]=${encodeURIComponent(policyId)}&fields=id,collection,action,fields,permissions,validation,presets`,
  );
  const byKey = new Map();
  for (const permission of permissions) {
    const key = `${permission.collection}:${permission.action}`;
    if (!DESIRED_PERMISSION_KEYS.has(key)) {
      await request("DELETE", `/permissions/${permission.id}`);
      removed++;
      console.log(`REMOVE permission ${key}`);
      continue;
    }
    if (byKey.has(key)) {
      await request("DELETE", `/permissions/${permission.id}`);
      removed++;
      console.log(`REMOVE permission duplicate ${key}`);
      continue;
    }
    byKey.set(key, permission);
  }

  for (const { collection, action, fields } of DESIRED_PERMISSIONS) {
    const key = `${collection}:${action}`;
    const existing = byKey.get(key);
    const body = {
      policy: policyId,
      collection,
      action,
      fields,
      permissions: {},
      validation: {},
      presets: {},
    };
    if (!existing) {
      await request("POST", "/permissions", body);
      created++;
      console.log(`CREATE permission ${key}`);
      continue;
    }

    const normalized = {
      fields: existing.fields,
      permissions: existing.permissions ?? {},
      validation: existing.validation ?? {},
      presets: existing.presets ?? {},
    };
    const desired = {
      fields: body.fields,
      permissions: body.permissions,
      validation: body.validation,
      presets: body.presets,
    };
    if (JSON.stringify(normalized) !== JSON.stringify(desired)) {
      await request("PATCH", `/permissions/${existing.id}`, body);
      updated++;
      console.log(`UPDATE permission ${key}`);
    } else {
      unchanged++;
    }
  }

}

const policy = await ensurePolicy();
const role = await ensureRole();
await ensureAccess(role.id, policy.id);
await reconcilePermissions(policy.id);

console.log(
  `PASS Content Editor access applied (created=${created}, updated=${updated}, removed=${removed}, unchanged=${unchanged})`,
);
