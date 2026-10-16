// 为前台创建只读凭据：policy(Web Read) + role(Web) + user(web-readonly, 带静态 token)
// 幂等：已存在则复用。用法: node make_web_token.mjs
const BASE = process.env.DIRECTUS_URL ?? "http://localhost:8055";
const ADMIN_EMAIL = "admin@degson.dev";
const ADMIN_PASSWORD = "degson1234";

const POLICY_NAME = "Web Read";
const ROLE_NAME = "Web";
const USER_EMAIL = "web-readonly@degson.dev";

async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, body: json };
}

// 1) 登录
const login = await req("POST", "/auth/login", {
  body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
});
if (login.status !== 200) {
  console.error("登录失败:", login.status, JSON.stringify(login.body));
  process.exit(1);
}
const admin = login.body.data.access_token;
console.log("✓ admin 登录成功");

// 2) policy
const policies = await req("GET", "/policies?limit=-1", { token: admin });
let policy = policies.body.data.find((p) => p.name === POLICY_NAME);
if (!policy) {
  const r = await req("POST", "/policies", {
    token: admin,
    body: { name: POLICY_NAME, icon: "visibility", description: "前台只读", admin: false, app_access: false },
  });
  if (r.status !== 200) {
    console.error("建 policy 失败:", r.status, JSON.stringify(r.body));
    process.exit(1);
  }
  policy = r.body.data;
  console.log("✓ 创建 policy:", policy.id);
} else {
  console.log("= 复用 policy:", policy.id);
}

// 3) permissions：对业务集合给 read
const business = [
  "category",
  "category_translations",
  "series",
  "series_translations",
  "product",
  "product_translations",
  "news",
  "news_translations",
  "site_settings",
  "languages",
  "directus_files",
  "media",
  "product_media",
  "site_pages",
  "site_pages_translations",
  "social_links",
  "home_blocks",
  "home_blocks_translations",
  "page_sections",
  "page_sections_translations",
];
const perms = await req("GET", `/permissions?limit=-1&filter[policy][_eq]=${policy.id}`, {
  token: admin,
});
const existing = new Set(
  perms.body.data.map((p) => `${p.collection}:${p.action}`)
);
for (const c of business) {
  if (existing.has(`${c}:read`)) continue;
  const r = await req("POST", "/permissions", {
    token: admin,
    body: {
      policy: policy.id,
      collection: c,
      action: "read",
      fields: ["*"],
      permissions: {},
      validation: {},
      presets: {},
    },
  });
  if (r.status !== 200) {
    console.error(`建权限失败 ${c}:`, r.status, JSON.stringify(r.body));
    process.exit(1);
  }
}
console.log(`✓ 权限就绪 (${business.length} 个集合 read)`);

// 4) role
const roles = await req("GET", "/roles?limit=-1", { token: admin });
let role = roles.body.data.find((r) => r.name === ROLE_NAME);
if (!role) {
  const r = await req("POST", "/roles", {
    token: admin,
    body: { name: ROLE_NAME, icon: "public", description: "前台只读角色" },
  });
  if (r.status !== 200) {
    console.error("建 role 失败:", r.status, JSON.stringify(r.body));
    process.exit(1);
  }
  role = r.body.data;
  console.log("✓ 创建 role:", role.id);
} else {
  console.log("= 复用 role:", role.id);
}

// 5) 绑定 role <-> policy（通过 /access）
const access = await req("GET", "/access?limit=-1", { token: admin });
const linked = access.body.data.some(
  (a) => a.role === role.id && a.policy === policy.id
);
if (!linked) {
  const r = await req("POST", "/access", {
    token: admin,
    body: { role: role.id, policy: policy.id },
  });
  if (r.status !== 200) {
    console.error("绑定失败:", r.status, JSON.stringify(r.body));
    process.exit(1);
  }
  console.log("✓ 绑定 role→policy");
} else {
  console.log("= 已绑定");
}

// 6) user + 静态 token
const tokenVal =
  "degson_web_" + [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const users = await req("GET", `/users?limit=-1&filter[email][_eq]=${encodeURIComponent(USER_EMAIL)}`, {
  token: admin,
});
let user = users.body.data[0];
if (!user) {
  const r = await req("POST", "/users", {
    token: admin,
    body: {
      email: USER_EMAIL,
      password: tokenVal,
      role: role.id,
      token: tokenVal,
      status: "active",
      first_name: "Web",
      last_name: "Readonly",
    },
  });
  if (r.status !== 200) {
    console.error("建 user 失败:", r.status, JSON.stringify(r.body));
    process.exit(1);
  }
  user = r.body.data;
  console.log("✓ 创建 user:", user.id);
} else {
  const r = await req("PATCH", `/users/${user.id}`, {
    token: admin,
    body: { role: role.id, token: tokenVal, status: "active" },
  });
  if (r.status !== 200) {
    console.error("更新 user 失败:", r.status, JSON.stringify(r.body));
    process.exit(1);
  }
  console.log("= 复用 user, 已刷新 token:", user.id);
}

console.log("\n================ 前台凭据 ================");
console.log("DIRECTUS_URL=" + BASE);
console.log("DIRECTUS_TOKEN=" + tokenVal);
console.log("==========================================");
