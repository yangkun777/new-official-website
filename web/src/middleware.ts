import { NextResponse, type NextRequest } from "next/server";

import { LANGS, DEFAULT_LANG } from "@/lib/lang";
import { getSitePolicy } from "@/lib/siteConfig";
import { CONTENT_TAGS } from "@/lib/cacheTags";
import { productOrderNoFromSlug, productPublicSlug } from "@/lib/productSlug";

/**
 * 语言前缀收敛：
 *  - Demo：首段已是受支持语言 → 放行，否则把路径挂到默认语言下
 *  - Production：按域名选择英文/中文内部语言，浏览器 URL 保持 canonical 形态
 * 未受支持的语言码（如 /de/...）同样落到默认语言，一期只有 en / zh。
 */
type SiteLang = "en" | "zh";

/** 在渲染前解析分类翻译，避免 Next 流式页面把 redirect 降为 HTTP 200。 */
async function categoryRedirect(req: NextRequest, lang: SiteLang, slug: string) {
  try {
    const decoded = decodeURIComponent(slug);
    const category = await getPathCandidate("category", decoded) as PathNode | null;
    if (!category) return null;
    const own = category.translations?.find((row) => row.slug === decoded);
    const selected = category.translations?.find((row) => row.language === lang && row.slug) ?? own;
    const targetLang = selected?.language;
    if (!selected || (targetLang !== "en" && targetLang !== "zh")) return null;
    const segments = localizedPath(category, targetLang);
    const path = segments.length
      ? `/products/${segments.map((part) => encodeURIComponent(part)).join("/")}`
      : `/product/category/${encodeURIComponent(selected.slug!)}`;
    if (targetLang === lang && path === `/product/category/${encodeURIComponent(decoded)}`) return null;
    const target = getSitePolicy().siteHref(targetLang, path);
    const redirectUrl = new URL(target, req.url);
    redirectUrl.search = req.nextUrl.search;
    const result = NextResponse.redirect(redirectUrl, 301);
    if (process.env.SITE_MODE !== "production") result.headers.set("X-Robots-Tag", "noindex, nofollow");
    return result;
  } catch {
    return null;
  }
}

type PathNode = { level: number; translations?: Array<{ language: string; slug: string | null }>; parent_id?: PathNode | null };

function localizedPath(node: PathNode | null | undefined, lang: SiteLang): string[] {
  const segments: string[] = [];
  let current = node ?? null;
  while (current) {
    const slug = current.translations?.find((row) => row.language === lang)?.slug?.trim();
    if (!slug) return [];
    segments.unshift(slug);
    current = current.parent_id ?? null;
  }
  return segments;
}

async function getPathCandidate(collection: "category" | "series", slug: string) {
  const token = process.env.DIRECTUS_TOKEN;
  if (!token) return null;
  try {
    const base = (process.env.DIRECTUS_URL ?? "http://localhost:8055").replace(/\/+$/, "");
    const url = new URL(`${base}/items/${collection}`);
    url.searchParams.set("filter[status][_eq]", "published");
    url.searchParams.set(collection === "series" && /^\d+$/.test(slug) ? "filter[matecode][_eq]" : "filter[translations][slug][_eq]", slug);
    url.searchParams.set("limit", "1");
    url.searchParams.set("fields", collection === "category"
      ? "id,level,translations.language,translations.slug,parent_id.id,parent_id.level,parent_id.translations.language,parent_id.translations.slug,parent_id.parent_id.id,parent_id.parent_id.level,parent_id.parent_id.translations.language,parent_id.parent_id.translations.slug"
      : "id,matecode,translations.language,translations.name,translations.slug,category_id.id,category_id.level,category_id.translations.language,category_id.translations.slug,category_id.parent_id.id,category_id.parent_id.level,category_id.parent_id.translations.language,category_id.parent_id.translations.slug,category_id.parent_id.parent_id.id,category_id.parent_id.parent_id.level,category_id.parent_id.parent_id.translations.language,category_id.parent_id.parent_id.translations.slug");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60, tags: [collection === "category" ? CONTENT_TAGS.category : CONTENT_TAGS.series] },
    });
    if (!response.ok) return null;
    const json = await response.json() as { data?: Array<Record<string, unknown>> };
    return json.data?.[0] ?? null;
  } catch {
    return null;
  }
}

async function seriesRedirect(req: NextRequest, lang: SiteLang, slug: string) {
  try {
    const decoded = decodeURIComponent(slug);
    const series = await getPathCandidate("series", decoded) as {
      matecode: string;
      translations?: Array<{ language: string; name?: string | null; slug: string | null }>;
      category_id?: PathNode | null;
    } | null;
    if (!series) return null;
    const rows = series.translations?.filter((row) => row.name?.trim() && row.slug?.trim()) ?? [];
    const selected = rows.find((row) => row.language === lang) ?? rows.find((row) => row.language === "en");
    const targetLang = selected?.language;
    if (!selected || (targetLang !== "en" && targetLang !== "zh")) return null;
    const category = localizedPath(series.category_id, targetLang);
    const canonical = category.length
      ? `/products/${[...category, selected.slug!].map((part) => encodeURIComponent(part)).join("/")}`
      : `/product/series/${encodeURIComponent(selected.slug!)}`;
    if (targetLang === lang && canonical === `/product/series/${encodeURIComponent(decoded)}`) return null;
    const url = new URL(getSitePolicy().siteHref(targetLang, canonical), req.url);
    url.search = req.nextUrl.search;
    const response = NextResponse.redirect(url, 301);
    if (process.env.SITE_MODE !== "production") response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  } catch {
    return null;
  }
}

async function productRedirect(req: NextRequest, lang: SiteLang, slug: string) {
  const orderNo = productOrderNoFromSlug(decodeURIComponent(slug));
  const token = process.env.DIRECTUS_TOKEN;
  if (!orderNo || !token) return null;
  try {
    const base = (process.env.DIRECTUS_URL ?? "http://localhost:8055").replace(/\/+$/, "");
    const url = new URL(`${base}/items/product`);
    url.searchParams.set("filter[status][_eq]", "published");
    url.searchParams.set("filter[order_no][_eq]", orderNo);
    url.searchParams.set("limit", "1");
    url.searchParams.set("fields", "order_no,title,combined_title,translations.language,translations.name,translations.slug,series_id.matecode,series_id.translations.language,series_id.translations.name,series_id.translations.slug,series_id.category_id.id,series_id.category_id.level,series_id.category_id.translations.language,series_id.category_id.translations.slug,series_id.category_id.parent_id.id,series_id.category_id.parent_id.level,series_id.category_id.parent_id.translations.language,series_id.category_id.parent_id.translations.slug,series_id.category_id.parent_id.parent_id.id,series_id.category_id.parent_id.parent_id.level,series_id.category_id.parent_id.parent_id.translations.language,series_id.category_id.parent_id.parent_id.translations.slug");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60, tags: [CONTENT_TAGS.product] },
    });
    if (!response.ok) return null;
    const json = await response.json() as { data?: Array<{
      order_no: string; title: string | null; combined_title: string | null;
      translations?: Array<{ language: string; name: string | null; slug: string | null }>;
      series_id?: { matecode: string; translations?: Array<{ language: string; name: string | null; slug: string | null }>; category_id?: PathNode | null } | null;
    }> };
    const product = json.data?.[0];
    if (!product) return null;
    const selected = product.translations?.find((row) => row.language === lang)
      ?? product.translations?.find((row) => row.language === "en");
    const targetLang = selected?.language;
    if (!selected || (targetLang !== "en" && targetLang !== "zh")) return null;
    const productSlug = productPublicSlug(product.combined_title || product.title || selected.name, orderNo);
    const series = product.series_id;
    const seriesRow = series?.translations?.find((row) => row.language === targetLang && row.name?.trim() && row.slug?.trim());
    const category = localizedPath(series?.category_id, targetLang);
    const canonical = series && seriesRow && category.length
      ? `/products/${[...category, seriesRow.slug || series.matecode, productSlug].map((part) => encodeURIComponent(part)).join("/")}`
      : `/product/${encodeURIComponent(productSlug)}`;
    if (targetLang === lang && canonical === `/product/${encodeURIComponent(decodeURIComponent(slug))}`) return null;
    const target = new URL(getSitePolicy().siteHref(targetLang, canonical), req.url);
    target.search = req.nextUrl.search;
    const result = NextResponse.redirect(target, 301);
    if (process.env.SITE_MODE !== "production") result.headers.set("X-Robots-Tag", "noindex, nofollow");
    return result;
  } catch {
    return null;
  }
}

/** Rewrite user-facing hierarchical product URLs to the existing page components. */
async function hierarchicalProductRewrite(req: NextRequest, lang: SiteLang, pathname: string) {
  const match = pathname.match(/^\/products\/(.+)\/?$/);
  if (!match) return null;
  const segments = match[1].split("/").filter(Boolean).map((part) => decodeURIComponent(part));
  if (!segments.length) return null;
  const last = segments.at(-1)!;
  let target: string;
  let canonicalRedirect: NextResponse | null = null;
  if (/-[0-9]{6,}$/.test(last)) {
    target = `/product/${encodeURIComponent(last)}`;
    canonicalRedirect = await productRedirect(req, lang, last);
  } else {
    const [category, series] = await Promise.all([
      getPathCandidate("category", last),
      getPathCandidate("series", last),
    ]);
    const categoryNode = category as (PathNode & { translations?: Array<{ language: string; slug: string | null }> }) | null;
    const seriesRow = series as { translations?: Array<{ language: string; slug: string | null }>; category_id?: PathNode | null } | null;
    const categoryPath = localizedPath(categoryNode, lang);
    const seriesCategoryPath = localizedPath(seriesRow?.category_id, lang);
    const seriesSlug = seriesRow?.translations?.find((row) => row.language === lang)?.slug?.trim();
    const categoryMatches = categoryPath.length === segments.length && categoryPath.every((part, index) => part === segments[index]);
    const seriesPath = seriesSlug ? [...seriesCategoryPath, seriesSlug] : [];
    const seriesMatches = seriesPath.length === segments.length && seriesPath.every((part, index) => part === segments[index]);
    if (categoryMatches || (!seriesMatches && categoryNode)) {
      target = `/product/category/${encodeURIComponent(last)}`;
      canonicalRedirect = await categoryRedirect(req, lang, last);
    } else {
      target = `/product/series/${encodeURIComponent(last)}`;
      canonicalRedirect = await seriesRedirect(req, lang, last);
    }
  }
  if (canonicalRedirect) {
    const location = canonicalRedirect.headers.get("location");
    if (location && new URL(location, req.url).href !== req.nextUrl.href) return canonicalRedirect;
  }
  const url = req.nextUrl.clone();
  url.pathname = `/${lang}${target}`;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-degson-hierarchical-path", `/products/${segments.map((part) => encodeURIComponent(part)).join("/")}`);
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1] ?? "";

  const policy = getSitePolicy();
  if (policy.mode === "production") {
    const cnHostname = new URL(policy.siteUrl("zh", "/")).hostname;
    const requestHostname = (req.headers.get("host") ?? req.nextUrl.hostname)
      .split(":")[0]
      .toLowerCase();
    const isCnHost = requestHostname === cnHostname;
    const hostLang = isCnHost ? "zh" : DEFAULT_LANG;
    // Production URL contract: English is the canonical root, while Chinese
    // lives on the separate CN domain. Both prefixed variants are normalized.
    const rest = pathname === "/" ? "/" : pathname.slice(first.length + 1) || "/";
    if (first === "zh") {
      return NextResponse.redirect(policy.siteUrl("zh", rest));
    }
    if (first === DEFAULT_LANG) {
      return NextResponse.redirect(policy.siteUrl(hostLang, rest));
    }
    const category = pathname.match(/^\/product\/category\/([^/]+)\/?$/);
    if (category) {
      const redirected = await categoryRedirect(req, hostLang, category[1]);
      if (redirected) return redirected;
    }
    const series = pathname.match(/^\/product\/series\/([^/]+)\/?$/);
    if (series) {
      const redirected = await seriesRedirect(req, hostLang, series[1]);
      if (redirected) return redirected;
    }
    const product = pathname.match(/^\/product\/([^/]+)\/?$/);
    if (product && product[1] !== "category" && product[1] !== "series") {
      const redirected = await productRedirect(req, hostLang, product[1]);
      if (redirected) return redirected;
    }
    const hierarchical = await hierarchicalProductRewrite(req, hostLang, pathname);
    if (hierarchical) return hierarchical;
    // Root and unprefixed English routes are canonical in production, but the
    // app router still uses the shared [lang] segment internally.
    const url = req.nextUrl.clone();
    url.pathname = `/${hostLang}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  if ((LANGS as readonly string[]).includes(first)) {
    const category = pathname.match(/^\/(?:en|zh)\/product\/category\/([^/]+)\/?$/);
    if (category) {
      const redirected = await categoryRedirect(req, first as SiteLang, category[1]);
      if (redirected) return redirected;
    }
    const series = pathname.match(/^\/(?:en|zh)\/product\/series\/([^/]+)\/?$/);
    if (series) {
      const redirected = await seriesRedirect(req, first as SiteLang, series[1]);
      if (redirected) return redirected;
    }
    const product = pathname.match(/^\/(?:en|zh)\/product\/([^/]+)\/?$/);
    if (product && product[1] !== "category" && product[1] !== "series") {
      const redirected = await productRedirect(req, first as SiteLang, product[1]);
      if (redirected) return redirected;
    }
    const hierarchical = await hierarchicalProductRewrite(req, first as SiteLang, pathname.replace(/^\/(?:en|zh)/, ""));
    if (hierarchical) return hierarchical;
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LANG}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(url);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  // 排除 Next 内部资源、favicon 与所有带扩展名的静态文件
  matcher: ["/products/:path*", "/en/products/:path*", "/zh/products/:path*", "/product/:path*", "/en/product/:path*", "/zh/product/:path*", "/((?!api/|_next|favicon\\.ico|.*\\.).*)"],
};
