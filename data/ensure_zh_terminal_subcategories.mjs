/**
 * 给端子一级、二级和三个子分类补中文翻译行（幂等）。
 * 有了 zh 行后，中文站分类卡片和产品中心目录分组才会出现。
 *
 *   node data/ensure_zh_terminal_subcategories.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.DIRECTUS_URL || "http://localhost:8055";
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || "admin@degson.dev";
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || "degson1234";

const TERMINAL_SUBCATEGORIES = [
  {
    enSlug: "terminal-blocks",
    zh: {
      language: "zh",
      name: "接线端子",
      slug: "jie-xian-duan-zi",
      short_description: "面向控制柜、设备内部与现场接线的产品系列。",
      h1: "接线端子",
    },
  },
  {
    enSlug: "pluggable-terminal-blocks",
    zh: {
      language: "zh",
      name: "插拔式接线端子",
      slug: "cha-ba-shi-jie-xian-duan-zi",
      short_description: "用于 PCB 与导轨、面板安装的插拔式接线。",
      h1: "插拔式接线端子",
    },
  },
  {
    enSlug: "pcb-plug",
    zh: {
      language: "zh",
      name: "PCB 插头",
      slug: "pcb-cha-tou",
      short_description: "作为接线端与 PCB 插座配套，提供多种接线方式。",
      h1: "PCB 插头",
    },
  },
  {
    enSlug: "pcb-socket",
    zh: {
      language: "zh",
      name: "PCB 插座",
      slug: "pcb-cha-zuo",
      short_description: "与 PCB 插头配套，提供板端连接与多种焊接方式。",
      h1: "PCB 插座",
    },
  },
  {
    enSlug: "din-rail-panel-mounting-connector",
    zh: {
      language: "zh",
      name: "导轨 / 面板安装连接器",
      slug: "dao-gui-mian-ban-an-zhuang-lian-jie-qi",
      short_description: "用于无需焊接的插拔式连接，适合导轨或面板安装。",
      h1: "导轨 / 面板安装连接器",
    },
  },
];

async function api(method, path, token, body) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

async function getToken() {
  const tokenFile = process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? join(ROOT, ".admin_token");
  if (existsSync(tokenFile)) {
    const t = readFileSync(tokenFile, "utf8").trim();
    if (t) {
      const probe = await api("GET", "/users/me", t);
      if (probe.status === 200) return t;
    }
  }
  const login = await api("POST", "/auth/login", null, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (login.status !== 200) {
    throw new Error(`登录失败 ${login.status}`);
  }
  return login.json.data.access_token;
}

const token = await getToken();
for (const item of TERMINAL_SUBCATEGORIES) {
  const found = await api(
    "GET",
    `/items/category?filter[translations][slug][_eq]=${encodeURIComponent(item.enSlug)}&fields=id,translations.id,translations.language,translations.slug&limit=1`,
    token,
  );
  const category = found.json?.data?.[0];
  if (!category) throw new Error(`找不到分类 ${item.enSlug}`);
  const existing = (category.translations ?? []).find((row) => row.language === "zh");
  if (existing) {
    const r = await api("PATCH", `/items/category_translations/${existing.id}`, token, item.zh);
    if (r.status < 200 || r.status >= 300) {
      throw new Error(`更新 ${item.enSlug} 中文翻译失败`);
    }
    console.log(`= ${item.enSlug} → ${item.zh.slug}`);
    continue;
  }
  const r = await api("POST", "/items/category_translations", token, {
    category_id: category.id,
    ...item.zh,
  });
  if (r.status < 200 || r.status >= 300) {
    throw new Error(`创建 ${item.enSlug} 中文翻译失败`);
  }
  console.log(`+ ${item.enSlug} → ${item.zh.slug}`);
}
