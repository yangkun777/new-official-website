/**
 * 演示用：新增一条与 Terminal Blocks 同结构的一级产品分类（圆形连接器）
 * + L2 / L3 子类 + 若干系列，全部走 Directus category / series 集合，后台可改。
 *
 * 图片一律取自本地旧库 degson_legacy.hr_article.thumb（见 data/01_legacy_subset.sql）：
 *   231879 Circular Connector → imgs/list/c03.jpg
 *   231880 M Series           → upload/image/20210208/20210208132900_81072.jpg
 *   5155047 M12 Series        → upload/image/20250311/M12系列.jpg
 *
 *   node data/seed_demo_circular_category.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BASE = process.env.DIRECTUS_URL || "http://localhost:8055";

const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || "admin@degson.dev";
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || "degson1234";

const L1_SLUG_EN = "circular-connectors";
const L2_SLUG_EN = "circular-connector-family";
const L3_SLUG_EN = "m12-circular-connectors";

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
    throw new Error(`登录失败 ${login.status}: ${JSON.stringify(login.json)}`);
  }
  return login.json.data.access_token;
}

async function findCategoryBySlug(token, slug) {
  const r = await api(
    "GET",
    `/items/category?filter[translations][slug][_eq]=${encodeURIComponent(slug)}&fields=id,level,parent_id,image,sort,status,translations.id,translations.language,translations.name,translations.slug&limit=1`,
    token,
  );
  return r.json?.data?.[0] ?? null;
}

async function ensureTranslation(token, categoryId, row) {
  const list = await api(
    "GET",
    `/items/category_translations?filter[category_id][_eq]=${categoryId}&filter[language][_eq]=${row.language}&limit=1&fields=id`,
    token,
  );
  const existing = list.json?.data?.[0];
  if (existing) {
    const r = await api("PATCH", `/items/category_translations/${existing.id}`, token, {
      name: row.name,
      slug: row.slug,
      short_description: row.short_description,
    });
    if (r.status < 200 || r.status >= 300) {
      throw new Error(`更新翻译失败: ${JSON.stringify(r.json).slice(0, 300)}`);
    }
    return existing.id;
  }
  const r = await api("POST", "/items/category_translations", token, {
    category_id: categoryId,
    ...row,
  });
  if (r.status < 200 || r.status >= 300) {
    throw new Error(`创建翻译失败: ${JSON.stringify(r.json).slice(0, 300)}`);
  }
  return r.json.data.id;
}

async function ensureCategory(token, { level, parent_id, image, sort, translations }) {
  const bySlug = await findCategoryBySlug(token, translations.en.slug);
  let id = bySlug?.id ?? null;
  if (!id) {
    const r = await api("POST", "/items/category", token, {
      level,
      parent_id: parent_id ?? null,
      image,
      sort,
      status: "published",
    });
    if (r.status < 200 || r.status >= 300) {
      throw new Error(`创建分类失败: ${JSON.stringify(r.json).slice(0, 400)}`);
    }
    id = r.json.data.id;
    console.log(`+ category L${level} id=${id} ${translations.en.slug}`);
  } else {
    const r = await api("PATCH", `/items/category/${id}`, token, {
      level,
      parent_id: parent_id ?? null,
      image,
      sort,
      status: "published",
    });
    if (r.status < 200 || r.status >= 300) {
      throw new Error(`更新分类失败: ${JSON.stringify(r.json).slice(0, 400)}`);
    }
    console.log(`= category L${level} id=${id} ${translations.en.slug}`);
  }
  await ensureTranslation(token, id, { language: "en", ...translations.en });
  await ensureTranslation(token, id, { language: "zh", ...translations.zh });
  return id;
}

async function findSeriesByMatecode(token, matecode) {
  const r = await api(
    "GET",
    `/items/series?filter[matecode][_eq]=${encodeURIComponent(matecode)}&fields=id&limit=1`,
    token,
  );
  return r.json?.data?.[0] ?? null;
}

async function ensureSeriesTranslation(token, seriesId, row) {
  const list = await api(
    "GET",
    `/items/series_translations?filter[series_id][_eq]=${seriesId}&filter[language][_eq]=${row.language}&limit=1&fields=id`,
    token,
  );
  const existing = list.json?.data?.[0];
  if (existing) {
    await api("PATCH", `/items/series_translations/${existing.id}`, token, {
      name: row.name,
      slug: row.slug,
      short_description: row.short_description,
    });
    return;
  }
  const r = await api("POST", "/items/series_translations", token, {
    series_id: seriesId,
    ...row,
  });
  if (r.status < 200 || r.status >= 300) {
    throw new Error(`创建系列翻译失败: ${JSON.stringify(r.json).slice(0, 300)}`);
  }
}

async function ensureSeries(token, { matecode, category_id, image, sort, translations }) {
  const existing = await findSeriesByMatecode(token, matecode);
  let id = existing?.id ?? null;
  if (!id) {
    const r = await api("POST", "/items/series", token, {
      matecode,
      category_id,
      image,
      sort,
      status: "published",
    });
    if (r.status < 200 || r.status >= 300) {
      throw new Error(`创建系列失败: ${JSON.stringify(r.json).slice(0, 400)}`);
    }
    id = r.json.data.id;
    console.log(`+ series ${matecode} id=${id}`);
  } else {
    await api("PATCH", `/items/series/${id}`, token, {
      category_id,
      image,
      sort,
      status: "published",
    });
    console.log(`= series ${matecode} id=${id}`);
  }
  await ensureSeriesTranslation(token, id, { language: "en", ...translations.en });
  await ensureSeriesTranslation(token, id, { language: "zh", ...translations.zh });
  return id;
}

async function main() {
  const token = await getToken();
  console.log("✓ Directus 已登录");

  const l1 = await ensureCategory(token, {
    level: 1,
    parent_id: null,
    image: "https://enoss.degson.com/imgs/list/c03.jpg",
    sort: 510,
    translations: {
      en: {
        name: "Circular Connectors",
        slug: L1_SLUG_EN,
        short_description:
          "M-series circular connectors for industrial signal and power — field-ready locking and IP-rated options.",
      },
      zh: {
        name: "圆形连接器",
        slug: "yuan-xing-lian-jie-qi",
        short_description:
          "面向工业信号与功率的 M 系列圆形连接器，提供可靠锁紧与防护等级选项。",
      },
    },
  });

  const l2 = await ensureCategory(token, {
    level: 2,
    parent_id: l1,
    image: "https://enoss.degson.com/upload/image/20210208/20210208132900_81072.jpg",
    sort: 100,
    translations: {
      en: {
        name: "Circular Connector Family",
        slug: L2_SLUG_EN,
        short_description:
          "Compact circular interfaces for automation, robotics and outdoor equipment.",
      },
      zh: {
        name: "圆形连接器家族",
        slug: "yuan-xing-lian-jie-qi-jia-zu",
        short_description: "面向自动化、机器人和户外设备的紧凑圆形接口。",
      },
    },
  });

  const l3 = await ensureCategory(token, {
    level: 3,
    parent_id: l2,
    image: "https://enoss.degson.com/upload/image/20250311/M12系列.jpg",
    sort: 100,
    translations: {
      en: {
        name: "M12 Circular Connectors",
        slug: L3_SLUG_EN,
        short_description:
          "M12 plugs and receptacles for sensor, actuator and power distribution wiring.",
      },
      zh: {
        name: "M12 圆形连接器",
        slug: "m12-yuan-xing-lian-jie-qi",
        short_description: "用于传感器、执行器与配电布线的 M12 插头与插座。",
      },
    },
  });

  const seriesList = [
    {
      matecode: "DEMO-M12-A-CODE",
      image: "https://enoss.degson.com/upload/image/20250311/M12系列.jpg",
      sort: 10,
      translations: {
        en: {
          name: "M12 A-Code",
          slug: "m12-a-code",
          short_description: "A-coded M12 for sensors and standard I/O.",
        },
        zh: {
          name: "M12 A 编码",
          slug: "m12-a-bian-ma",
          short_description: "面向传感器与标准 I/O 的 A 编码 M12。",
        },
      },
    },
    {
      matecode: "DEMO-M12-D-CODE",
      image: "https://enoss.degson.com/upload/image/20250311/M12系列.jpg",
      sort: 20,
      translations: {
        en: {
          name: "M12 D-Code",
          slug: "m12-d-code",
          short_description: "D-coded M12 for industrial Ethernet links.",
        },
        zh: {
          name: "M12 D 编码",
          slug: "m12-d-bian-ma",
          short_description: "面向工业以太网链路的 D 编码 M12。",
        },
      },
    },
    {
      matecode: "DEMO-M12-POWER",
      image: "https://enoss.degson.com/upload/image/20250311/M12系列.jpg",
      sort: 30,
      translations: {
        en: {
          name: "M12 Power",
          slug: "m12-power",
          short_description: "Higher-current M12 variants for distributed power.",
        },
        zh: {
          name: "M12 电源型",
          slug: "m12-dian-yuan-xing",
          short_description: "面向分布式供电的高载流 M12 变体。",
        },
      },
    },
  ];

  for (const s of seriesList) {
    await ensureSeries(token, { ...s, category_id: l3 });
  }

  console.log("\n完成。后台可在「产品分类 / 产品系列」中编辑；首页 L1 应出现 Circular Connectors / 圆形连接器。");
  console.log(`L1 slug en: /en/product/category/${L1_SLUG_EN}`);
  console.log(`L1 slug zh: /zh/product/category/yuan-xing-lian-jie-qi`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
