import type { MetadataRoute } from "next";
import { getCategoriesForSitemap, getNewsList, getSeriesForSitemap } from "@/lib/repo";
import { LANGS, type Lang } from "@/lib/lang";
import { siteUrl } from "@/lib/site";

export const revalidate = 300;

function addUnique(entries: MetadataRoute.Sitemap, url: string): void {
  if (!entries.some((entry) => entry.url === url)) entries.push({ url });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  for (const lang of LANGS) {
    addUnique(entries, siteUrl(lang, "/"));
    addUnique(entries, siteUrl(lang, "/news"));

    try {
      const news = await getNewsList(lang);
      for (const item of news) {
        if (item.slug) addUnique(entries, siteUrl(item.lang, `/news/${item.slug}`));
      }
    } catch {
      // The base sitemap remains available while CMS data is unavailable.
    }

    for (const level of [1, 2, 3]) {
      try {
        const limit = 500;
        const first = await getCategoriesForSitemap(level, lang, 1, limit);
        const pages = Math.max(1, Math.ceil(first.total / limit));
        const categoryPages = [first.items];
        for (let page = 2; page <= pages; page++) {
          const result = await getCategoriesForSitemap(level, lang, page, limit);
          categoryPages.push(result.items);
        }
        for (const category of categoryPages.flat()) {
          if (category.slug) {
            addUnique(entries, siteUrl(category.lang as Lang, `/product/category/${category.slug}`));
          }
        }
      } catch {
        // Keep already collected URLs; a temporary CMS failure must not 500 the route.
      }
    }

    try {
      const limit = 500;
      const first = await getSeriesForSitemap(lang, 1, limit);
      const pages = Math.max(1, Math.ceil(first.total / limit));
      for (const series of first.items) {
        if (series.matecode) addUnique(entries, siteUrl(series.lang, `/product/series/${series.matecode}`));
      }
      for (let page = 2; page <= pages; page++) {
        const result = await getSeriesForSitemap(lang, page, limit);
        for (const series of result.items) {
          if (series.matecode) addUnique(entries, siteUrl(series.lang, `/product/series/${series.matecode}`));
        }
      }
    } catch {
      // Keep the already collected URL classes if the CMS is temporarily unavailable.
    }
  }
  return entries;
}
