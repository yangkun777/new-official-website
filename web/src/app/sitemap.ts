import type { MetadataRoute } from "next";
import { getCategoriesByLevel, getNewsList } from "@/lib/repo";
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
        const categories = await getCategoriesByLevel(level, lang);
        for (const category of categories) {
          if (category.slug) {
            addUnique(entries, siteUrl(category.lang as Lang, `/product/category/${category.slug}`));
          }
        }
      } catch {
        // Keep already collected URLs; a temporary CMS failure must not 500 the route.
      }
    }
  }
  return entries;
}
