/**
 * 充实营销页图文 + 新闻封面；修正品牌中文名为「高松」
 *   node data/enrich_demo_marketing.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BASE = process.env.DIRECTUS_URL || "http://localhost:8055";
const TOKEN = readFileSync(
  process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? join(ROOT, ".admin_token"),
  "utf8",
).trim();

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

async function ensureField(collection, field, type, schema = {}, meta = {}) {
  const exists = await api("GET", `/fields/${collection}/${field}`);
  if (exists.status === 200) return;
  const r = await api("POST", `/fields/${collection}`, {
    field,
    type,
    schema: { is_nullable: true, ...schema },
    meta: { interface: type === "text" ? "input-multiline" : "input", ...meta },
  });
  if (r.status < 200 || r.status >= 300) {
    throw new Error(`${collection}.${field} ${r.status} ${JSON.stringify(r.json).slice(0, 200)}`);
  }
  console.log(`+ ${collection}.${field}`);
}

const CONTENT = {
  solutions: {
    cover_image: "/images/marketing/hero-solutions.jpg",
    panel_image_1: "/images/marketing/feature-automation.jpg",
    panel_image_2: "/images/marketing/feature-energy.jpg",
    panel_image_3: "/images/marketing/feature-rail.jpg",
    en: {
      title: "Industry Solutions",
      summary:
        "Connectivity for industrial automation, energy, rail transit and equipment OEMs — from PCB terminals to heavy-duty connectors.",
      body: `Modern machines need denser I/O, faster commissioning and certified interfaces that survive vibration, temperature and long service life. DEGSON focuses on industrial connectors so design teams can lock electrical interfaces earlier and scale production with fewer redesigns.

We map application requirements — pitch, poles, current, wiring method and certification — to product families that are already proven in control cabinets, energy systems and rolling stock. That shortens the path from prototype wiring to stable series supply.

Application engineers support selection packages, drawings and sample loops. For volume programs we align packaging, lead time and change control so purchasing and manufacturing stay predictable.

Whether you need a catalog series or a coordinated multi-SKU kit, the goal is the same: reliable connectivity that your field service teams can trust.`,
      panel_1_title: "Industrial Automation",
      panel_1_text:
        "Fine-pitch PCB terminals and DIN-rail interfaces for dense 24V I/O, PLCs and modular control cabinets.",
      panel_2_title: "Energy & Power",
      panel_2_text:
        "Higher-current and power interfaces for energy storage, distribution and equipment power inlets.",
      panel_3_title: "Rail & Infrastructure",
      panel_3_text:
        "Robust connectors and terminal systems for vibration-prone environments and long maintenance intervals.",
      seo_title: "Industry Solutions | DEGSON",
      seo_description:
        "DEGSON industry solutions for automation, energy and rail connectivity.",
    },
    zh: {
      title: "行业解决方案",
      summary:
        "面向工业自动化、能源、轨交与设备 OEM 的连接方案——从 PCB 接线端子到重载连接器。",
      body: `现代设备需要更高密度的 I/O、更快的调试，以及能承受振动、温变与长期服役的认证接口。高松（DEGSON）专注工业连接器，帮助设计团队更早锁定电气接口，并以更少改版进入量产。

我们把应用需求——节距、极数、载流、接线方式与认证——映射到已在控制柜、能源系统与轨交场景验证过的产品系列，缩短从样机布线到稳定供货的路径。

应用工程师提供选型包、图纸与样品闭环。批量项目中，我们协同包装、交期与变更管控，让采购与制造更可预期。

无论是标准系列选型，还是多订货号协同配套，目标始终一致：现场可信赖的可靠连接。`,
      panel_1_title: "工业自动化",
      panel_1_text:
        "细间距 PCB 端子与导轨接口，适配高密度 24V I/O、PLC 与模块化控制柜。",
      panel_2_title: "能源与电力",
      panel_2_text:
        "面向储能、配电与设备电源入口的大电流与功率连接方案。",
      panel_3_title: "轨交与基础设施",
      panel_3_text:
        "面向振动环境与长维护周期的高可靠连接器与端子系统。",
      seo_title: "行业解决方案 | 高松 DEGSON",
      seo_description: "高松面向自动化、能源与轨交的工业连接解决方案。",
    },
  },
  services: {
    cover_image: "/images/marketing/hero-services.jpg",
    panel_image_1: "/images/marketing/feature-automation.jpg",
    panel_image_2: "/images/marketing/news-cover.jpg",
    panel_image_3: "/images/marketing/feature-energy.jpg",
    en: {
      title: "Services",
      summary:
        "Selection support, documentation, samples and lifecycle care — so connectivity does not become the bottleneck.",
      body: `Our service model covers the product lifecycle: catalog guidance, sample coordination, drawing packages and after-sales follow-up.

Before you freeze a design, application engineers help validate poles, pitch, mating interfaces and certification scope against the markets you ship to.

During ramp-up we coordinate packaging, labeling and delivery windows with your purchasing plan. After launch we support replacements, cross-references and controlled changes when platforms evolve.

The outcome we aim for is simple: fewer last-minute connector swaps, clearer documentation for manufacturing, and a stable supply conversation between engineering and sourcing.`,
      panel_1_title: "Selection & Samples",
      panel_1_text:
        "Shortlist series by pitch, poles and ratings; coordinate samples for lab and pilot builds.",
      panel_2_title: "Documentation",
      panel_2_text:
        "Drawings, datasheets and certification pointers aligned to the exact configuration you place.",
      panel_3_title: "Lifecycle Support",
      panel_3_text:
        "Lead-time alignment, replacements and change control for long-running product platforms.",
      seo_title: "Services | DEGSON",
      seo_description: "DEGSON engineering and commercial connectivity services.",
    },
    zh: {
      title: "服务",
      summary:
        "选型支持、技术资料、样品与全生命周期服务——让连接器不再成为项目卡点。",
      body: `服务覆盖产品全生命周期：目录选型、样品协调、工程图纸资料与售后跟进。

设计定稿前，应用工程师协助确认极数、节距、对插接口，以及目标市场对应的认证范围。

爬坡阶段我们协同包装、标识与交期窗口，对齐采购计划。量产后继续支持替代选型、交叉参考，以及平台升级时的受控变更。

我们追求的结果很简单：减少临时换连接器、给制造更清晰的资料，以及工程与采购之间更稳定的供货沟通。`,
      panel_1_title: "选型与样品",
      panel_1_text:
        "按节距、极数与额定参数缩小系列范围，并协调实验室与小批样件。",
      panel_2_title: "技术资料",
      panel_2_text:
        "图纸、规格书与认证线索，对齐你实际下单的配置。",
      panel_3_title: "生命周期支持",
      panel_3_text:
        "交期协同、替代与变更管控，服务长期在产平台。",
      seo_title: "服务 | 高松 DEGSON",
      seo_description: "高松连接器工程与商务服务。",
    },
  },
  about: {
    cover_image: "/images/marketing/hero-about.jpg",
    panel_image_1: "/images/marketing/feature-automation.jpg",
    panel_image_2: "/images/marketing/feature-energy.jpg",
    panel_image_3: "/images/marketing/feature-rail.jpg",
    en: {
      title: "About DEGSON",
      summary:
        "An industrial connector manufacturer focused on reliability, certification depth and global delivery.",
      body: `DEGSON (Chinese brand name: 高松) designs and manufactures terminal blocks and connectors used across industrial equipment worldwide.

We combine manufacturing depth with structured product data so engineers can find the right order number quickly and trust the documentation behind it — poles, pitch, ratings and certification scope included.

This new website is being rebuilt on a single multilingual content platform: one catalog, many language sites. Marketing pages, product data and news are managed in one Directus backend so operations teams no longer maintain duplicated PHP sites.

Our roadmap continues toward richer industry solutions, downloadable technical packages and search that understands order numbers the way engineers search.`,
      panel_1_title: "Manufacturing Focus",
      panel_1_text:
        "Terminal blocks, circular and heavy-duty connectors built for industrial duty cycles.",
      panel_2_title: "Structured Catalog",
      panel_2_text:
        "Order numbers, series and translations managed as data — not copied HTML sites.",
      panel_3_title: "One Backend, Many Languages",
      panel_3_text:
        "A single Directus CMS powers Chinese, English and future language sites.",
      seo_title: "About DEGSON | 高松",
      seo_description: "About DEGSON (高松) — industrial terminal blocks and connectors.",
    },
    zh: {
      title: "关于高松",
      summary:
        "专注可靠连接、认证深度与全球交付的工业连接器制造商。",
      body: `高松（DEGSON）设计并制造广泛应用于工业设备的接线端子与连接器。

我们将制造能力与结构化产品数据结合，帮助工程师更快找到正确订货号，并信任背后的技术资料——极数、节距、额定与认证范围一目了然。

新官网正以「一套内容、多语言站点」重建：营销页、产品与新闻统一在 Directus 后台管理，运营不再维护多套重复的 PHP 站点。

后续将继续补齐更丰富的行业方案、可下载技术资料包，以及更懂订货号的搜索体验。`,
      panel_1_title: "制造与产品",
      panel_1_text:
        "面向工业工况的接线端子、圆形与重载连接器。",
      panel_2_title: "结构化目录",
      panel_2_text:
        "订货号、系列与翻译按数据管理，而不是复制多套网页。",
      panel_3_title: "一个后台，多种语言",
      panel_3_text:
        "同一套 Directus 支撑中文、英文及后续语言站点。",
      seo_title: "关于高松 | DEGSON",
      seo_description: "关于高松 DEGSON — 工业接线端子与连接器。",
    },
  },
};

async function main() {
  console.log("=== enrich_demo_marketing ===");

  for (const field of ["cover_image", "panel_image_1", "panel_image_2", "panel_image_3"]) {
    await ensureField("site_pages", field, "string", { max_length: 512 }, {
      translations: [{ language: "zh-CN", translation: field.replaceAll("_", " ") }],
    });
  }
  for (const field of [
    "panel_1_title",
    "panel_1_text",
    "panel_2_title",
    "panel_2_text",
    "panel_3_title",
    "panel_3_text",
  ]) {
    await ensureField(
      "site_pages_translations",
      field,
      field.endsWith("text") ? "text" : "string",
      field.endsWith("title") ? { max_length: 255 } : {},
      { translations: [{ language: "zh-CN", translation: field }] },
    );
  }

  for (const [slug, cfg] of Object.entries(CONTENT)) {
    const list = await api(
      "GET",
      `/items/site_pages?filter[slug][_eq]=${slug}&fields=id&limit=1`,
    );
    const id = list.json?.data?.[0]?.id;
    if (!id) {
      console.warn("missing page", slug);
      continue;
    }
    await api("PATCH", `/items/site_pages/${id}`, {
      cover_image: cfg.cover_image,
      panel_image_1: cfg.panel_image_1,
      panel_image_2: cfg.panel_image_2,
      panel_image_3: cfg.panel_image_3,
      status: "published",
    });
    const trans = await api(
      "GET",
      `/items/site_pages_translations?filter[site_pages_id][_eq]=${id}&fields=id,language&limit=-1`,
    );
    for (const lang of ["en", "zh"]) {
      const hit = (trans.json?.data || []).find((r) => r.language === lang);
      const payload = { site_pages_id: id, language: lang, ...cfg[lang] };
      if (hit) await api("PATCH", `/items/site_pages_translations/${hit.id}`, payload);
      else await api("POST", "/items/site_pages_translations", payload);
    }
    console.log("= enriched", slug, id);
  }

  // news cover + ensure no 德昌
  const news = await api("GET", "/items/news?fields=id,cover_image&limit=-1");
  for (const n of news.json?.data || []) {
    await api("PATCH", `/items/news/${n.id}`, {
      cover_image: "/images/marketing/news-cover.jpg",
    });
    console.log("= news cover", n.id);
  }
  const ntr = await api("GET", "/items/news_translations?fields=*&limit=-1");
  for (const row of ntr.json?.data || []) {
    const patch = {};
    for (const [k, v] of Object.entries(row)) {
      if (typeof v === "string" && v.includes("德昌")) patch[k] = v.replaceAll("德昌", "高松");
    }
    if (Object.keys(patch).length) {
      await api("PATCH", `/items/news_translations/${row.id}`, patch);
      console.log("fixed 德昌 in news", row.id);
    }
  }

  console.log("=== done ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
