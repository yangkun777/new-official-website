/**
 * 方案页新增入口的后台初始内容。仅创建缺失记录，不覆盖运营已编辑的文案。
 * node data/seed_solutions_sections.mjs
 */
import { readFileSync } from "node:fs";

const base = process.env.DIRECTUS_URL ?? "http://localhost:8055";
const token = (process.env.DIRECTUS_ADMIN_TOKEN ?? readFileSync(
  process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? "D:/degson-pilot/.admin_token",
  "utf8",
)).trim();

async function request(method, path, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(result)}`);
  return result.data;
}

const sections = [
  {
    code: "sol-products",
    list_title: "方案页 · 产品分类入口",
    sort: 100,
    translations: {
      en: {
        title: "Continue with product categories",
        intro: "Explore product categories, series and order numbers for your connection requirements.",
      },
      zh: {
        title: "按产品类别继续选型",
        intro: "根据连接方式和应用要求，浏览实际产品分类、系列与订货号。",
      },
    },
  },
  {
    code: "sol-support",
    list_title: "方案页 · 服务引导",
    sort: 110,
    translations: {
      en: {
        title: "Need help narrowing down a series?",
        intro: "See our service information for selection and application support.",
        cta: "Explore services",
      },
      zh: {
        title: "需要进一步缩小选型范围？",
        intro: "查看现有服务内容，了解选型和应用支持。",
        cta: "查看服务",
      },
    },
  },
];

for (const section of sections) {
  const query = new URLSearchParams({
    "filter[code][_eq]": section.code,
    fields: "id,code",
    limit: "1",
  });
  const existing = await request("GET", `/items/page_sections?${query}`);
  const id = existing[0]?.id ?? (await request("POST", "/items/page_sections", {
    code: section.code,
    page_slug: "solutions",
    list_title: section.list_title,
    sort: section.sort,
    status: "published",
  })).id;

  const translations = await request(
    "GET",
    `/items/page_sections_translations?${new URLSearchParams({
      "filter[page_sections_id][_eq]": String(id),
      fields: "id,language",
      limit: "-1",
    })}`,
  );
  for (const [language, copy] of Object.entries(section.translations)) {
    if (translations.some((item) => item.language === language)) continue;
    await request("POST", "/items/page_sections_translations", {
      page_sections_id: id,
      language,
      ...copy,
    });
  }
  console.log(`${section.code}: ready`);
}
