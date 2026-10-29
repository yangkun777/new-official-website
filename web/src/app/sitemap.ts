import type { MetadataRoute } from "next";
import { getCategoriesForSitemap, getNewsForSitemap, getProductsForSitemap, getSeriesForSitemap } from "@/lib/repo";
import { LANGS, type Lang } from "@/lib/lang";
import { siteUrl } from "@/lib/site";
import { categoryPublicPath, seriesPublicPath } from "@/lib/productPaths";

export const revalidate = 300;

function addUnique(
  entries: MetadataRoute.Sitemap,
  url: string,
  lastModified?: string | null
): void {
  const existing = entries.find((entry) => entry.url === url);
  if (existing) {
    if (!existing.lastModified && lastModified) existing.lastModified = lastModified;
    return;
  }
  entries.push({
    url,
    ...(lastModified ? { lastModified } : {}),
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  for (const lang of LANGS) {
    addUnique(entries, siteUrl(lang, "/"));
    addUnique(entries, siteUrl(lang, "/news"));

    try {
      const limit = 100;
      const first = await getNewsForSitemap(lang, 1, limit);
      const pages = Math.max(1, Math.ceil(first.total / limit));
      const newsPages = [first.items];
      for (let page = 2; page <= pages; page++) {
        const result = await getNewsForSitemap(lang, page, limit);
        newsPages.push(result.items);
      }
      for (const item of newsPages.flat()) {
        if (item.slug) {
          addUnique(entries, siteUrl(item.lang, `/news/${item.slug}`), item.updated_at);
        }
      }
    } catch {
      // The base sitemap remains available while CMS data is unavailable.
    }

    for (const level of [1, 2, 3]) {
      try {
        const limit = 100;
        const first = await getCategoriesForSitemap(level, lang, 1, limit);
        const pages = Math.max(1, Math.ceil(first.total / limit));
        const categoryPages = [first.items];
        for (let page = 2; page <= pages; page++) {
          const result = await getCategoriesForSitemap(level, lang, page, limit);
          categoryPages.push(result.items);
        }
        for (const category of categoryPages.flat()) {
          const path = categoryPublicPath(category.categoryPath);
          if (path) {
            addUnique(
              entries,
              siteUrl(category.lang as Lang, path),
              category.updated_at
            );
          }
        }
      } catch {
        // Keep already collected URLs; a temporary CMS failure must not 500 the route.
      }
    }

    try {
      const limit = 100;
      const first = await getSeriesForSitemap(lang, 1, limit);
      const pages = Math.max(1, Math.ceil(first.total / limit));
      for (const series of first.items) {
        if (series.matecode) {
          addUnique(
            entries,
            siteUrl(series.lang, seriesPublicPath(series)),
            series.updated_at
          );
        }
      }
      for (let page = 2; page <= pages; page++) {
        const result = await getSeriesForSitemap(lang, page, limit);
        for (const series of result.items) {
          if (series.matecode) {
            addUnique(
              entries,
              siteUrl(series.lang, seriesPublicPath(series)),
              series.updated_at
            );
          }
        }
      }
    } catch {
      // Keep the already collected URL classes if the CMS is temporarily unavailable.
    }

    try {
      const limit = 100;
      const first = await getProductsForSitemap(lang, 1, limit);
      const pages = Math.max(1, Math.ceil(first.total / limit));
      for (const product of first.items) addUnique(entries, siteUrl(product.lang, product.path), product.updated_at);
      for (let page = 2; page <= pages; page++) {
        const result = await getProductsForSitemap(lang, page, limit);
        for (const product of result.items) addUnique(entries, siteUrl(product.lang, product.path), product.updated_at);
      }
    } catch {
      // Keep category and series URLs even if SKU data is temporarily unavailable.
    }
  }
  return entries;
}
