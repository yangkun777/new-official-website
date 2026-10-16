import { apiGet, apiGetList } from "./directus";
import { resolveMediaUrl } from "./media";
import { CONTENT_TAGS } from "./cacheTags";
import {
  DEFAULT_LANG,
  LANGS,
  pickTranslation,
  type Lang,
  type TranslationRow,
} from "./lang";
import type {
  Category,
  CatLite,
  Series,
  SeriesListItem,
  SubCategoryCard,
  SiteSettings,
  LocalizedSiteCopy,
  Variant,
  ProductDetail,
  ProductMedia,
} from "@/types/product";
import type { NewsListItem, NewsDetail } from "@/types/news";

// 全部通过 Directus REST API 取数（PRD §5.2：前台不直连数据库）。
// 本文件是「主表 + *_translations」到页面视图的唯一适配层，页面不感知 translations 结构。

// ---------------------------------------------------------------------------
// 字段 / 过滤构造
// ---------------------------------------------------------------------------

/** 四个翻译表模板一致，字段清单只需维护一份 */
const TRANS_FIELDS =
  "id,language,name,slug,seo_title,seo_description,h1,short_description,description";

/** Directus 常见默认 LIMIT_MAX 为 100；分页读取不请求更大的单页，避免服务端截断却页数算错。 */
const PAGINATION_LIMIT = 100;

/** 展开成 Directus 嵌套 fields 语法：translations.name,translations.slug,... */
function tf(prefix: string): string {
  return TRANS_FIELDS.split(",")
    .map((f) => `${prefix}.${f}`)
    .join(",");
}

/**
 * 列表页的语言策略（PRD §6.4）：一次请求取回「请求语言 + en」，
 * 应用层优先请求语言、缺失回退 en——列表不出现空位；
 * 每条记录带 resolved lang，卡片据此把链接指向真正有内容的语言页。
 */
function dfList(prefix: string, lang: Lang): Record<string, string> {
  const langs = lang === DEFAULT_LANG ? DEFAULT_LANG : `${lang},${DEFAULT_LANG}`;
  return { [`deep[${prefix}][_filter][language][_in]`]: langs };
}

/** 某条记录实际拥有翻译的语言（升序按 LANGS 顺序），用于 hreflang */
function langsOf(rows: TranslationRow[] | undefined): Lang[] {
  if (!rows?.length) return [];
  return LANGS.filter((l) => rows.some((r) => r.language === l));
}

// ---------------------------------------------------------------------------
// 原始行形状（Directus 返回）
// ---------------------------------------------------------------------------

interface RawCatNode {
  id: number;
  level: number;
  sort?: number;
  status?: string;
  image: string | null;
  translations: TranslationRow[];
  updated_at?: string | null;
  parent_id?: RawCatNode | null;
}

interface RawSeriesNode {
  id: number;
  matecode: string;
  image: string | null;
  translations: TranslationRow[];
  updated_at?: string | null;
  category_id?: RawCatNode | null;
}

// ---------------------------------------------------------------------------
// 拍平
// ---------------------------------------------------------------------------

/** 父级链节点：name/slug 已按语言解析 */
function chainNode(node: RawCatNode | null | undefined, lang: Lang) {
  const p = node ?? null;
  if (!p) return null;
  const t = pickTranslation(p.translations, lang);
  if (!t) return null;
  const g = p.parent_id ?? null;
  const gt = g ? pickTranslation(g.translations, lang) : null;
  return {
    id: p.id,
    level: p.level,
    name: t.row.name ?? "",
    slug: t.row.slug ?? "",
    parent_id:
      g && gt
        ? {
            id: g.id,
            level: g.level,
            name: gt.row.name ?? "",
            slug: gt.row.slug ?? "",
            parent_id: null,
          }
        : null,
  };
}

const CAT_CHAIN_FIELDS = [
  "id,level,image",
  tf("translations"),
  "parent_id.id,parent_id.level,parent_id.image",
  tf("parent_id.translations"),
  "parent_id.parent_id.id,parent_id.parent_id.level,parent_id.parent_id.image",
  tf("parent_id.parent_id.translations"),
].join(",");

const SERIES_CHAIN_FIELDS = [
  "id,matecode,image",
  tf("translations"),
  "category_id.id,category_id.level,category_id.image",
  tf("category_id.translations"),
  "category_id.parent_id.id,category_id.parent_id.level,category_id.parent_id.image",
  tf("category_id.parent_id.translations"),
  "category_id.parent_id.parent_id.id,category_id.parent_id.parent_id.level,category_id.parent_id.parent_id.image",
  tf("category_id.parent_id.parent_id.translations"),
].join(",");

/** 详情页拉全部翻译，不需要 deep 语言过滤；父链各层仍需各自的语言过滤之外的选取 */
function catChainFilters(lang: Lang): Record<string, string> {
  return {
    ...dfList("parent_id.translations", lang),
    ...dfList("parent_id.parent_id.translations", lang),
  };
}

// ---------------------------------------------------------------------------
// 站点设置
// ---------------------------------------------------------------------------

export function getSiteSettings(): Promise<SiteSettings | null> {
  return apiGet<SiteSettings>("/items/site_settings/1", {}, CONTENT_TAGS.settings).catch(
    () => null
  );
}

/** site_settings 主表存英文，中文在 *_zh 字段；前台按语言选用。 */
export function localizeSiteCopy(
  settings: SiteSettings | null,
  lang: Lang,
): LocalizedSiteCopy {
  const isZh = lang === "zh";
  return {
    siteName: settings?.site_name ?? "DEGSON",
    siteDescription: isZh
      ? settings?.site_description_zh ??
        settings?.site_description ??
        "高松工业连接解决方案，包括接线端子、连接器和工业组件。"
      : settings?.site_description ??
        "DEGSON industrial connection solutions — terminal blocks and connectors.",
    heroTitle: isZh
      ? settings?.hero_title_zh ?? "以可靠连接赢得信赖"
      : settings?.hero_title ?? "Connect with confidence",
    heroSubtitle: isZh
      ? settings?.hero_subtitle_zh ?? "接线端子、连接器与工业组件"
      : settings?.hero_subtitle ??
        "Terminal blocks, connectors and industrial components",
    heroKicker: isZh
      ? settings?.hero_kicker_zh ?? "工业连接解决方案"
      : settings?.hero_kicker ?? "Industrial Connectivity",
    heroImage: resolveMediaUrl(settings?.hero_image) ?? "/images/marketing/home-hero.jpg",
    footerText: isZh
      ? settings?.footer_text_zh ?? "© 高松 DEGSON 保留所有权利。"
      : settings?.footer_text ?? "© DEGSON. All rights reserved.",
    ctaTitle: isZh
      ? settings?.cta_title_zh ?? "需要选型支持？"
      : settings?.cta_title ?? "Need selection support?",
    ctaText: isZh
      ? settings?.cta_text_zh ??
        "告诉我们应用场景与额定参数，应用团队可协助缩小系列范围。"
      : settings?.cta_text ??
        "Tell us your application and ratings — our application team can help shortlist series.",
    ctaLink: settings?.cta_link || "/services",
  };
}

// ---------------------------------------------------------------------------
// 营销页 / 社交外链（后台可配置）
// ---------------------------------------------------------------------------

export type SitePageSlug = "solutions" | "services" | "about";

export interface SitePageView {
  slug: SitePageSlug;
  title: string;
  summary: string | null;
  body: string | null;
  seo_title: string | null;
  seo_description: string | null;
  coverImage: string | null;
  panels: Array<{ image: string | null; title: string; text: string }>;
  lang: Lang;
  availableLangs: Lang[];
}

interface RawSitePageTranslation {
  id: number;
  language: string;
  title: string | null;
  summary: string | null;
  body: string | null;
  seo_title: string | null;
  seo_description: string | null;
  panel_1_title?: string | null;
  panel_1_text?: string | null;
  panel_2_title?: string | null;
  panel_2_text?: string | null;
  panel_3_title?: string | null;
  panel_3_text?: string | null;
}

interface RawSitePage {
  id: number;
  slug: string;
  status?: string;
  sort?: number;
  cover_image?: string | null;
  panel_image_1?: string | null;
  panel_image_2?: string | null;
  panel_image_3?: string | null;
  translations?: RawSitePageTranslation[];
}

export async function getSitePage(
  slug: SitePageSlug,
  lang: Lang,
): Promise<SitePageView | null> {
  try {
    const rows = await apiGet<RawSitePage[]>(
      "/items/site_pages",
      {
        "filter[slug][_eq]": slug,
        "filter[status][_eq]": "published",
        fields:
          "id,slug,status,cover_image,panel_image_1,panel_image_2,panel_image_3,translations.*",
        limit: "1",
      },
      CONTENT_TAGS.pages,
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return null;
    const picked = pickTranslation(row.translations, lang);
    if (!picked) return null;
    const t = picked.row;
    const panels = [
      {
        image: resolveMediaUrl(row.panel_image_1),
        title: t.panel_1_title ?? "",
        text: t.panel_1_text ?? "",
      },
      {
        image: resolveMediaUrl(row.panel_image_2),
        title: t.panel_2_title ?? "",
        text: t.panel_2_text ?? "",
      },
      {
        image: resolveMediaUrl(row.panel_image_3),
        title: t.panel_3_title ?? "",
        text: t.panel_3_text ?? "",
      },
    ].filter((p) => p.title || p.text || p.image);
    return {
      slug,
      title: t.title ?? slug,
      summary: t.summary,
      body: t.body,
      seo_title: t.seo_title,
      seo_description: t.seo_description,
      coverImage: resolveMediaUrl(row.cover_image),
      panels,
      lang: t.language as Lang,
      availableLangs: langsOf(row.translations as TranslationRow[]),
    };
  } catch {
    return null;
  }
}

export interface PageSectionView {
  id: number;
  code: string | null;
  listTitle: string;
  title: string;
  intro: string | null;
  stat1: string | null;
  stat1Label: string | null;
  stat2: string | null;
  stat2Label: string | null;
  intro1: string | null;
  intro2: string | null;
  image: string | null;
  children: PageSectionView[];
}

interface RawPageSectionTranslation {
  language: string;
  title?: string | null;
  intro?: string | null;
  stat1?: string | null;
  stat1_label?: string | null;
  stat2?: string | null;
  stat2_label?: string | null;
  intro1?: string | null;
  intro2?: string | null;
}

interface RawPageSection {
  id: number;
  code?: string | null;
  page_slug?: string;
  parent_id?: number | { id: number } | null;
  list_title?: string | null;
  sort?: number;
  status?: string;
  image?: string | null;
  translations?: RawPageSectionTranslation[];
}

function parentIdOf(row: RawPageSection): number | null {
  if (row.parent_id == null) return null;
  return typeof row.parent_id === "object" ? row.parent_id.id : row.parent_id;
}

function toSectionView(row: RawPageSection, lang: Lang): PageSectionView | null {
  const picked = pickTranslation(row.translations as TranslationRow[] | undefined, lang);
  if (!picked) return null;
  const t = picked.row as RawPageSectionTranslation;
  return {
    id: row.id,
    code: row.code ?? null,
    listTitle: row.list_title || t.title || "",
    title: t.title || row.list_title || "",
    intro: t.intro ?? null,
    stat1: t.stat1 ?? null,
    stat1Label: t.stat1_label ?? null,
    stat2: t.stat2 ?? null,
    stat2Label: t.stat2_label ?? null,
    intro1: t.intro1 ?? null,
    intro2: t.intro2 ?? null,
    image: resolveMediaUrl(row.image),
    children: [],
  };
}

export async function getPageSections(
  pageSlug: SitePageSlug,
  lang: Lang,
): Promise<PageSectionView[]> {
  try {
    const rows = await apiGet<RawPageSection[]>(
      "/items/page_sections",
      {
        "filter[page_slug][_eq]": pageSlug,
        "filter[status][_eq]": "published",
        fields:
          "id,code,page_slug,parent_id,list_title,sort,status,image,translations.*",
        sort: "sort,id",
        limit: "-1",
      },
      CONTENT_TAGS.pages,
    );
    const list = Array.isArray(rows) ? rows : [];
    const views = new Map<number, PageSectionView>();
    for (const row of list) {
      const view = toSectionView(row, lang);
      if (view) views.set(row.id, view);
    }
    const roots: PageSectionView[] = [];
    for (const row of list) {
      const view = views.get(row.id);
      if (!view) continue;
      const parentId = parentIdOf(row);
      const parent = parentId != null ? views.get(parentId) : null;
      if (parent) parent.children.push(view);
      else roots.push(view);
    }
    return roots;
  } catch {
    return [];
  }
}

export async function getSitePageCards(lang: Lang): Promise<
  Array<{
    slug: SitePageSlug;
    title: string;
    summary: string | null;
    coverImage: string | null;
  }>
> {
  const slugs: SitePageSlug[] = ["solutions", "services", "about"];
  const pages = await Promise.all(slugs.map((s) => getSitePage(s, lang)));
  return pages
    .filter((p): p is SitePageView => !!p)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      coverImage: p.coverImage,
    }));
}

export type SocialPlatform = "twitter" | "linkedin" | "youtube" | "facebook";

export interface SocialLinkView {
  platform: SocialPlatform;
  url: string;
  label: string | null;
}

const SOCIAL_PLATFORMS = new Set<SocialPlatform>([
  "twitter",
  "linkedin",
  "youtube",
  "facebook",
]);

export async function getSocialLinks(): Promise<SocialLinkView[]> {
  try {
    const rows = await apiGet<
      Array<{ platform: string; url: string | null; label: string | null; sort?: number; status?: string }>
    >(
      "/items/social_links",
      {
        "filter[status][_eq]": "published",
        sort: "sort",
        fields: "platform,url,label,sort,status",
        limit: "10",
      },
      CONTENT_TAGS.social,
    );
    const list = Array.isArray(rows) ? rows : [];
    return list
      .filter(
        (r) =>
          r.url &&
          SOCIAL_PLATFORMS.has(r.platform as SocialPlatform),
      )
      .map((r) => ({
        platform: r.platform as SocialPlatform,
        url: r.url as string,
        label: r.label,
      }));
  } catch {
    return [];
  }
}

export type HomeBlockKind =
  | "highlight"
  | "industry"
  | "feature"
  | "product_shot"
  | "hero_thumb";

export interface HomeBlockView {
  key: string;
  kind: HomeBlockKind;
  title: string;
  text: string | null;
  cta: string | null;
  image: string | null;
  href: string;
}

const HOME_KINDS = new Set<HomeBlockKind>([
  "highlight",
  "industry",
  "feature",
  "product_shot",
  "hero_thumb",
]);

const HOME_LINKS = new Set([
  "/#products",
  "/solutions",
  "/services",
  "/about",
  "/news",
]);

interface RawHomeBlock {
  key: string;
  kind: string;
  image?: string | null;
  link_path?: string | null;
  sort?: number;
  translations?: Array<{
    language: string;
    title?: string | null;
    text?: string | null;
    cta?: string | null;
  }>;
}

export async function getHomeBlocks(lang: Lang): Promise<HomeBlockView[]> {
  try {
    const rows = await apiGet<RawHomeBlock[]>(
      "/items/home_blocks",
      {
        "filter[status][_eq]": "published",
        sort: "sort",
        fields: "key,kind,image,link_path,sort,translations.language,translations.title,translations.text,translations.cta",
        limit: "50",
      },
      CONTENT_TAGS.home,
    );
    const list = Array.isArray(rows) ? rows : [];
    return list
      .filter((r) => HOME_KINDS.has(r.kind as HomeBlockKind))
      .map((r) => {
        const t = pickTranslation(r.translations as TranslationRow[] | undefined, lang);
        const href = r.link_path && HOME_LINKS.has(r.link_path) ? r.link_path : "/solutions";
        return {
          key: r.key,
          kind: r.kind as HomeBlockKind,
          title: t?.row.title ?? "",
          text: t?.row.text ?? null,
          cta: t?.row.cta ?? null,
          image: resolveMediaUrl(r.image),
          href,
        };
      })
      .filter((r) => r.title || r.image);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// 分类
// ---------------------------------------------------------------------------

function toSubCard(node: RawCatNode, lang: Lang): SubCategoryCard | null {
  const t = pickTranslation(node.translations, lang);
  if (!t) return null;
  return {
    id: node.id,
    name: t.row.name ?? "",
    slug: t.row.slug ?? "",
    image: resolveMediaUrl(node.image),
    description: t.row.short_description ?? t.row.description ?? null,
    lang: t.row.language as Lang,
    fallback: t.isFallback,
    updated_at: node.updated_at ?? null,
  };
}

interface CategoryPageQuery {
  lang: Lang;
  page: number;
  limit: number;
  level?: number;
  parentId?: number;
}

async function getCategoryPage({
  lang,
  page,
  limit,
  level,
  parentId,
}: CategoryPageQuery): Promise<{ items: SubCategoryCard[]; total: number }> {
  const filters: Record<string, string> = {
    "filter[status][_eq]": "published",
  };
  if (level !== undefined) filters["filter[level][_eq]"] = String(level);
  if (parentId !== undefined) filters["filter[parent_id][_eq]"] = String(parentId);

  const { items, total } = await apiGetList<RawCatNode>(
    "/items/category",
    {
      ...filters,
      sort: "sort",
      limit: String(limit),
      page: String(page),
      fields: `id,level,sort,status,image,updated_at,${tf("translations")}`,
      ...dfList("translations", lang),
    },
    CONTENT_TAGS.category
  );
  return {
    items: items
      .map((n) => toSubCard(n, lang))
      .filter((c): c is SubCategoryCard => c !== null),
    total,
  };
}

/** 首页/导航用：按层级分页取全量分类卡片。 */
export async function getCategoriesByLevel(
  level: number,
  lang: Lang
): Promise<SubCategoryCard[]> {
  const limit = PAGINATION_LIMIT;
  const first = await getCategoryPage({ level, lang, page: 1, limit });
  const pages = Math.max(1, Math.ceil(first.total / limit));
  const all = [...first.items];
  for (let page = 2; page <= pages; page++) {
    const result = await getCategoryPage({ level, lang, page, limit });
    all.push(...result.items);
  }
  return all;
}

/** Sitemap 用分页分类读取：避免单次 limit 截断全量分类 URL。 */
export async function getCategoriesForSitemap(
  level: number,
  lang: Lang,
  page: number,
  limit = PAGINATION_LIMIT
): Promise<{ items: SubCategoryCard[]; total: number }> {
  return getCategoryPage({ level, lang, page, limit });
}

export interface LocalizedCategory {
  category: Category;
  /** 该 slug 行真正所属的语言——canonical 用 */
  resolvedLang: Lang;
  /** 该分类存在翻译的全部语言——hreflang 用 */
  availableLangs: Lang[];
}

export async function getCategoryBySlug(
  slug: string,
  lang: Lang
): Promise<LocalizedCategory | null> {
  const { items } = await apiGetList<RawCatNode>(
    "/items/category",
    {
      "filter[status][_eq]": "published",
      "filter[translations][slug][_eq]": slug,
      limit: "1",
      fields: CAT_CHAIN_FIELDS,
      ...catChainFilters(lang),
    },
    CONTENT_TAGS.category
  );
  const node = items[0];
  if (!node) return null;

  // slug 唯一标识某一条翻译行；以该行语言为准（而非请求语言）
  const own = node.translations.find((r) => r.slug === slug);
  if (!own || !LANGS.includes(own.language as Lang)) return null;
  const resolvedLang = own.language as Lang;
  const t = pickTranslation(node.translations, resolvedLang);
  if (!t) return null;

  return {
    resolvedLang,
    availableLangs: langsOf(node.translations),
    category: {
      id: node.id,
      level: node.level,
      sort: node.sort ?? 0,
      status: node.status ?? "published",
      image: node.image,
      name: t.row.name ?? "",
      slug: t.row.slug ?? "",
      short_description: t.row.short_description,
      description: t.row.description ?? t.row.short_description ?? null,
      seo_title: t.row.seo_title,
      seo_description: t.row.seo_description,
      parent_id: chainNode(node.parent_id, resolvedLang),
    },
  };
}

export async function getSubCategories(
  parentId: number,
  lang: Lang
): Promise<SubCategoryCard[]> {
  const limit = PAGINATION_LIMIT;
  const first = await getCategoryPage({ parentId, lang, page: 1, limit });
  const pages = Math.max(1, Math.ceil(first.total / limit));
  const all = [...first.items];
  for (let page = 2; page <= pages; page++) {
    const result = await getCategoryPage({ parentId, lang, page, limit });
    all.push(...result.items);
  }
  return all;
}

// ---------------------------------------------------------------------------
// 系列
// ---------------------------------------------------------------------------

function toSeriesItem(node: RawSeriesNode, lang: Lang): SeriesListItem | null {
  const t = pickTranslation(node.translations, lang);
  if (!t) return null;
  return {
    id: node.id,
    matecode: node.matecode,
    name: t.row.name ?? "",
    image: node.image,
    description: t.row.short_description ?? t.row.description ?? null,
    lang: t.row.language as Lang,
    fallback: t.isFallback,
    updated_at: node.updated_at ?? null,
  };
}

export async function getSeriesByCategory(
  catId: number,
  page: number,
  lang: Lang,
  limit = 12
): Promise<{ items: SeriesListItem[]; total: number }> {
  const { items, total } = await apiGetList<RawSeriesNode>(
    "/items/series",
    {
      "filter[category_id][_eq]": String(catId),
      "filter[status][_eq]": "published",
      sort: "-sort",
      limit: String(limit),
      page: String(page),
      fields: `id,matecode,image,${tf("translations")}`,
      ...dfList("translations", lang),
    },
    CONTENT_TAGS.series
  );
  return {
    items: items
      .map((n) => toSeriesItem(n, lang))
      .filter((s): s is SeriesListItem => s !== null),
    total,
  };
}

/** Sitemap 用分页系列读取：只返回已发布且有可服务翻译的系列。 */
export async function getSeriesForSitemap(
  lang: Lang,
  page: number,
  limit = PAGINATION_LIMIT
): Promise<{ items: SeriesListItem[]; total: number }> {
  const { items, total } = await apiGetList<RawSeriesNode>(
    "/items/series",
    {
      "filter[status][_eq]": "published",
      sort: "id",
      limit: String(limit),
      page: String(page),
      fields: `id,matecode,image,updated_at,${tf("translations")}`,
      ...dfList("translations", lang),
    },
    CONTENT_TAGS.series
  );
  return {
    items: items
      .map((n) => toSeriesItem(n, lang))
      .filter((s): s is SeriesListItem => s !== null),
    total,
  };
}

export interface LocalizedSeries {
  series: Series;
  /** matecode 与语言无关，但翻译可能缺失 → 实际可服务的语言 */
  resolvedLang: Lang;
  availableLangs: Lang[];
}

export async function getSeriesByMatecode(
  matecode: string,
  lang: Lang
): Promise<LocalizedSeries | null> {
  const { items } = await apiGetList<RawSeriesNode>(
    "/items/series",
    {
      "filter[matecode][_eq]": matecode,
      "filter[status][_eq]": "published",
      limit: "1",
      fields: SERIES_CHAIN_FIELDS,
      ...catChainFilters(lang),
    },
    CONTENT_TAGS.series
  );
  const node = items[0];
  if (!node) return null;
  const t = pickTranslation(node.translations, lang);
  if (!t) return null; // 请求语言与 en 都没有 → 该系列无可服务内容
  const resolvedLang = t.row.language as Lang;

  return {
    resolvedLang,
    availableLangs: langsOf(node.translations),
    series: {
      id: node.id,
      matecode: node.matecode,
      image: node.image,
      name: t.row.name ?? "",
      short_description: t.row.short_description,
      description: t.row.description ?? t.row.short_description ?? null,
      seo_title: t.row.seo_title,
      seo_description: t.row.seo_description,
      category_id: chainNode(node.category_id, resolvedLang),
    },
  };
}

export async function getRelatedSeries(
  categoryId: number | null,
  excludeMatecode: string,
  lang: Lang,
  limit = 6
): Promise<SeriesListItem[]> {
  if (!categoryId) return [];
  const { items } = await apiGetList<RawSeriesNode>(
    "/items/series",
    {
      "filter[category_id][_eq]": String(categoryId),
      "filter[status][_eq]": "published",
      "filter[matecode][_neq]": excludeMatecode,
      sort: "-sort",
      limit: String(limit),
      fields: `id,matecode,image,${tf("translations")}`,
      ...dfList("translations", lang),
    },
    CONTENT_TAGS.series
  );
  return items
    .map((n) => toSeriesItem(n, lang))
    .filter((s): s is SeriesListItem => s !== null);
}

// ---------------------------------------------------------------------------
// 产品变体（参数与语言无关，仍在 product 主表）
// ---------------------------------------------------------------------------

export async function getVariants(seriesId: number): Promise<Variant[]> {
  const limit = PAGINATION_LIMIT;
  const getPage = (page: number) =>
    apiGetList<Variant>(
      "/items/product",
      {
        "filter[series_id][_eq]": String(seriesId),
        "filter[status][_eq]": "published",
        sort: "id",
        limit: String(limit),
        page: String(page),
        fields: "id,title,order_no,poles,pitch",
      },
      CONTENT_TAGS.product
    );

  const first = await getPage(1);
  const pages = Math.max(1, Math.ceil(first.total / limit));
  const all = [...first.items];
  for (let page = 2; page <= pages; page++) {
    const result = await getPage(page);
    all.push(...result.items);
  }
  return all;
}

// ---------------------------------------------------------------------------
// SKU 产品详情
// ---------------------------------------------------------------------------

interface RawProductMedia {
  id: number;
  kind: string;
  sort?: number | null;
  is_primary?: boolean | null;
  file_id?: string | null;
  media_id?: {
    id: number;
    kind: string;
    file_id: string | null;
    language: string | null;
    alt: string | null;
    caption: string | null;
    sort?: number | null;
    status?: string | null;
  } | null;
}

interface RawProduct {
  id: number;
  order_no: string;
  title: string | null;
  poles: string | null;
  pitch: string | null;
  combined_title: string | null;
  status: string;
  translations: TranslationRow[];
  media_links?: RawProductMedia[];
}

export interface LocalizedProduct {
  product: ProductDetail;
  resolvedLang: Lang;
  availableLangs: Lang[];
}

export async function getProductByOrderNo(
  orderNo: string,
  lang: Lang,
): Promise<LocalizedProduct | null> {
  const { items } = await apiGetList<RawProduct>(
    "/items/product",
    {
      "filter[order_no][_eq]": orderNo,
      "filter[status][_eq]": "published",
      limit: "1",
      fields: [
        "id,order_no,title,poles,pitch,combined_title,status",
        tf("translations"),
        "media_links.id,media_links.kind,media_links.sort,media_links.is_primary",
        "media_links.file_id",
        "media_links.media_id.id,media_links.media_id.kind,media_links.media_id.file_id",
        "media_links.media_id.language,media_links.media_id.alt,media_links.media_id.caption",
        "media_links.media_id.sort,media_links.media_id.status",
      ].join(","),
      ...dfList("translations", lang),
    },
    CONTENT_TAGS.product,
  );
  const node = items[0];
  if (!node) return null;

  const picked = pickTranslation(node.translations, lang);
  if (!picked) return null;

  const media: ProductMedia[] = (node.media_links ?? [])
    .filter((link) => link.media_id?.status !== "draft")
    .map((link) => ({
      id: link.id,
      kind: link.kind,
      sort: link.sort ?? link.media_id?.sort ?? 0,
      is_primary: Boolean(link.is_primary),
      url: resolveMediaUrl(link.file_id) ?? resolveMediaUrl(link.media_id?.file_id),
      alt: link.media_id?.alt ?? null,
      caption: link.media_id?.caption ?? null,
    }))
    .filter((item) => item.url !== null)
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort - b.sort || a.id - b.id);

  const row = picked.row;
  return {
    resolvedLang: row.language as Lang,
    availableLangs: langsOf(node.translations),
    product: {
      id: node.id,
      order_no: node.order_no,
      title: node.title,
      poles: node.poles,
      pitch: node.pitch,
      combined_title: node.combined_title,
      name: row.name ?? node.title ?? node.order_no,
      slug: row.slug ?? node.order_no,
      h1: row.h1,
      short_description: row.short_description,
      description: row.description,
      seo_title: row.seo_title,
      seo_description: row.seo_description,
      media,
    },
  };
}

// ---------------------------------------------------------------------------
// 新闻
// ---------------------------------------------------------------------------

interface RawNews {
  id: number;
  publish_date: string | null;
  cover_image: string | null;
  status: string;
  translations: TranslationRow[];
  updated_at: string | null;
}

/** 新闻列表：一次查回主表 + 「请求语言 + en」翻译 */
export async function getNewsList(lang: Lang): Promise<NewsListItem[]> {
  const { items } = await apiGetList<RawNews>(
    "/items/news",
    {
      "filter[status][_eq]": "published",
      sort: "-publish_date",
      limit: "200",
      fields: `id,publish_date,cover_image,status,updated_at,${tf("translations")}`,
      ...dfList("translations", lang),
    },
    CONTENT_TAGS.news
  );
  return toNewsListItems(items, lang);
}

function toNewsListItems(items: RawNews[], lang: Lang): NewsListItem[] {
  const out: NewsListItem[] = [];
  for (const n of items) {
    const t = pickTranslation(n.translations, lang);
    if (!t) continue; // 请求语言与 en 都无翻译 → 丢弃，不产出空壳
    out.push({
      id: t.row.id,
      newsId: n.id,
      slug: t.row.slug ?? "",
      publish_date: n.publish_date,
      cover_image: resolveMediaUrl(n.cover_image),
      title: t.row.name ?? "",
      summary: t.row.short_description,
      lang: t.row.language as Lang,
      fallback: t.isFallback,
      updated_at: n.updated_at,
    });
  }
  return out.sort((a, b) =>
    (b.publish_date ?? "").localeCompare(a.publish_date ?? "")
  );
}

/** Sitemap 用分页新闻读取：避免新闻超过单次 limit 后静默漏 URL。 */
export async function getNewsForSitemap(
  lang: Lang,
  page: number,
  limit = PAGINATION_LIMIT
): Promise<{ items: NewsListItem[]; total: number }> {
  const { items, total } = await apiGetList<RawNews>(
    "/items/news",
    {
      "filter[status][_eq]": "published",
      sort: "-publish_date",
      limit: String(limit),
      page: String(page),
      fields: `id,publish_date,cover_image,status,updated_at,${tf("translations")}`,
      ...dfList("translations", lang),
    },
    CONTENT_TAGS.news
  );
  return { items: toNewsListItems(items, lang), total };
}

export interface LocalizedNews {
  news: NewsDetail;
  resolvedLang: Lang;
  availableLangs: Lang[];
  slugs: Partial<Record<Lang, string>>;
}

/** 新闻详情：slug 属于某一条翻译行，以该行语言为 canonical */
export async function getNewsBySlug(
  slug: string
): Promise<LocalizedNews | null> {
  const { items } = await apiGetList<RawNews>(
    "/items/news",
    {
      "filter[status][_eq]": "published",
      "filter[translations][slug][_eq]": slug,
      limit: "1",
      fields: `id,publish_date,cover_image,status,${tf("translations")}`,
    },
    CONTENT_TAGS.news
  );
  const n = items[0];
  if (!n) return null;

  const own = n.translations.find((r) => r.slug === slug);
  if (!own || !LANGS.includes(own.language as Lang)) return null;
  const resolvedLang = own.language as Lang;
  const slugs = Object.fromEntries(
    n.translations
      .filter((row) => LANGS.includes(row.language as Lang) && row.slug)
      .map((row) => [row.language, row.slug as string])
  ) as Partial<Record<Lang, string>>;

  return {
    resolvedLang,
    availableLangs: langsOf(n.translations),
    slugs,
    news: {
      id: own.id,
      newsId: n.id,
      slug: own.slug ?? "",
      publish_date: n.publish_date,
      cover_image: resolveMediaUrl(n.cover_image),
      title: own.name ?? "",
      summary: own.short_description,
      body: own.description,
      lang: resolvedLang,
      fallback: false,
    },
  };
}
