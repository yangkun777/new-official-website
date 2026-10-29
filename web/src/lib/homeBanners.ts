import { CONTENT_TAGS } from "./cacheTags";
import { apiGetList } from "./directus";
import { mapHomeBannerRows, type HomeBannerRow } from "./homeBannerModel";
import { resolveMediaUrl } from "./media";
import type { Lang } from "./lang";

export async function getHomeBanners(lang: Lang) {
  try {
    const { items } = await apiGetList<HomeBannerRow>("/items/home_banner", {
      "filter[status][_eq]": "published",
      fields: "id,sort,status,image,link_path,link_url,translations.language,translations.status,translations.tag,translations.title,translations.text,translations.cta,translations.image",
      sort: "sort,id",
      limit: "100",
    }, CONTENT_TAGS.home);
    return mapHomeBannerRows(items, lang, resolveMediaUrl);
  } catch (error) {
    console.error("Unable to load published homepage Banners", error);
    return [];
  }
}
