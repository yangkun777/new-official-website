import { apiGet, apiGetList } from "./directus";
import type {
  Category,
  Series,
  Variant,
  SeriesListItem,
  SubCategoryCard,
  SiteSettings,
} from "@/types/product";
import type { NewsListItem, NewsDetail } from "@/types/news";

// 全部通过 Directus REST API 取数；filter/sort/fields 用 URLSearchParams 组装（见 directus.ts）

export function getSiteSettings(): Promise<SiteSettings | null> {
  return apiGet<SiteSettings>("/items/site_settings/1", {}, "settings").catch(
    () => null
  );
}

export async function getCategoriesByLevel(level: number): Promise<Category[]> {
  return (
    await apiGetList<Category>(
      "/items/category",
      {
        "filter[level][_eq]": String(level),
        "filter[status][_eq]": "published",
        sort: "sort",
        fields: "id,name,slug,level,description,image",
        limit: "100",
      },
      "category"
    )
  ).items;
}

const CATEGORY_FIELDS =
  "id,name,slug,level,description,image,sort,status," +
  "parent_id.id,parent_id.name,parent_id.slug,parent_id.level," +
  "parent_id.parent_id.id,parent_id.parent_id.name,parent_id.parent_id.slug,parent_id.parent_id.level";

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { items } = await apiGetList<Category>(
    "/items/category",
    {
      "filter[slug][_eq]": slug,
      "filter[status][_eq]": "published",
      fields: CATEGORY_FIELDS,
      limit: "1",
    },
    "category"
  );
  return items[0] ?? null;
}

export async function getSubCategories(
  parentId: number
): Promise<SubCategoryCard[]> {
  return (
    await apiGetList<SubCategoryCard>(
      "/items/category",
      {
        "filter[parent_id][_eq]": String(parentId),
        "filter[status][_eq]": "published",
        sort: "sort",
        fields: "id,name,slug,image,description",
        limit: "100",
      },
      "category"
    )
  ).items;
}

export async function getSeriesByCategory(
  catId: number,
  page: number,
  limit = 12
): Promise<{ items: SeriesListItem[]; total: number }> {
  return apiGetList<SeriesListItem>(
    "/items/series",
    {
      "filter[category_id][_eq]": String(catId),
      "filter[status][_eq]": "published",
      sort: "-sort",
      limit: String(limit),
      page: String(page),
      fields: "id,name,matecode,image,description",
    },
    "series"
  );
}

const SERIES_FIELDS =
  "id,name,matecode,description,image," +
  "category_id.id,category_id.name,category_id.slug," +
  "category_id.parent_id.id,category_id.parent_id.name,category_id.parent_id.slug," +
  "category_id.parent_id.parent_id.id,category_id.parent_id.parent_id.name,category_id.parent_id.parent_id.slug";

export async function getSeriesByMatecode(
  matecode: string
): Promise<Series | null> {
  const { items } = await apiGetList<Series>(
    "/items/series",
    {
      "filter[matecode][_eq]": matecode,
      "filter[status][_eq]": "published",
      fields: SERIES_FIELDS,
      limit: "1",
    },
    "series"
  );
  return items[0] ?? null;
}

export async function getVariants(seriesId: number): Promise<Variant[]> {
  return (
    await apiGetList<Variant>(
      "/items/product",
      {
        "filter[series_id][_eq]": String(seriesId),
        "filter[status][_eq]": "published",
        sort: "id",
        fields: "id,title,order_no,poles,pitch",
        limit: "500",
      },
      "product"
    )
  ).items;
}

export async function getRelatedSeries(
  categoryId: number | null,
  excludeMatecode: string,
  limit = 6
): Promise<SeriesListItem[]> {
  if (!categoryId) return [];
  return (
    await apiGetList<SeriesListItem>(
      "/items/series",
      {
        "filter[category_id][_eq]": String(categoryId),
        "filter[status][_eq]": "published",
        "filter[matecode][_neq]": excludeMatecode,
        sort: "-sort",
        fields: "id,name,matecode,image,description",
        limit: String(limit),
      },
      "series"
    )
  ).items;
}

// 注：本 Directus 实例对「深层 filter（filter[rel][field]）」与「M2O 字段展开」均不可靠，
// 故新闻用「两次 root 查询 + 应用层 join」：filter 只用各表自身字段（language / slug / news_id / id）。

interface NewsRow {
  id: number;
  slug: string;
  publish_date: string | null;
  cover_image: string | null;
  status: string;
}
interface NewsTransRow {
  id: number;
  title: string;
  summary: string | null;
  body: string | null;
  news_id: number;
}

// cover_image 是 directus_files 的 file id（UUID），渲染用 Directus /assets/{id}
const DIRECTUS_BASE = process.env.DIRECTUS_URL ?? "http://localhost:8055";
function fileUrl(fileId: string | null): string | null {
  return fileId ? `${DIRECTUS_BASE}/assets/${fileId}` : null;
}

async function fetchNewsRows(
  extra?: Record<string, string>
): Promise<NewsRow[]> {
  const { items } = await apiGetList<NewsRow>(
    "/items/news",
    {
      fields: "id,slug,publish_date,cover_image,status",
      limit: "200",
      ...(extra ?? {}),
    },
    "news"
  );
  return items;
}

/** 新闻列表（按语言，已发布，按日期倒序） */
export async function getNewsList(lang: string): Promise<NewsListItem[]> {
  const { items: trans } = await apiGetList<NewsTransRow>(
    "/items/news_translations",
    {
      "filter[language][_eq]": lang,
      fields: "id,title,summary,news_id",
      limit: "200",
    },
    "news"
  );
  if (!trans.length) return [];
  const ids = [...new Set(trans.map((t) => t.news_id))];
  const news = await fetchNewsRows({ "filter[id][_in]": ids.join(",") });
  const published = new Map(
    news
      .filter((n) => n.status === "published")
      .map((n) => [String(n.id), n] as const)
  );
  return trans
    .filter((t) => published.has(String(t.news_id)))
    .map((t) => {
      const n = published.get(String(t.news_id))!;
      return {
        id: t.id,
        newsId: n.id,
        slug: n.slug,
        publish_date: n.publish_date,
        cover_image: fileUrl(n.cover_image),
        title: t.title,
        summary: t.summary,
      };
    })
    .sort((a, b) =>
      (b.publish_date ?? "").localeCompare(a.publish_date ?? "")
    );
}

/** 新闻详情（按 slug + 语言） */
export async function getNewsBySlug(
  slug: string,
  lang: string
): Promise<NewsDetail | null> {
  const newsArr = await fetchNewsRows({ "filter[slug][_eq]": slug, limit: "1" });
  const n = newsArr[0];
  if (!n || n.status !== "published") return null;
  const { items: trans } = await apiGetList<NewsTransRow>(
    "/items/news_translations",
    {
      "filter[news_id][_eq]": String(n.id),
      "filter[language][_eq]": lang,
      fields: "id,title,summary,body,news_id",
      limit: "1",
    },
    "news"
  );
  const t = trans[0];
  if (!t) return null;
  return {
    id: t.id,
    newsId: n.id,
    slug: n.slug,
    publish_date: n.publish_date,
    cover_image: fileUrl(n.cover_image),
    title: t.title,
    summary: t.summary,
    body: t.body,
  };
}
