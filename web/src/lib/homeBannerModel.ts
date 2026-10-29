export interface HomeBannerTranslationRow {
  language: string;
  status: string | null;
  tag?: string | null;
  title?: string | null;
  text?: string | null;
  cta?: string | null;
  image?: string | null;
}

export interface HomeBannerRow {
  id: number;
  sort: number | null;
  status: string | null;
  image: string | null;
  link_path: string | null;
  link_url: string | null;
  translations: HomeBannerTranslationRow[] | null;
}

export interface HomeBannerSlide {
  id: number;
  image: string;
  href: string;
  tag: string;
  title: string;
  text: string;
  cta: string;
}

function bannerHref(row: HomeBannerRow): string | null {
  if (row.link_path === "external") {
    try {
      const url = new URL(row.link_url ?? "");
      return url.protocol === "https:" ? url.href : null;
    } catch {
      return null;
    }
  }
  const path = row.link_path?.trim();
  return path?.startsWith("/") && !path.startsWith("//") ? path : null;
}

/** 每条 Banner 一条业务记录；只显示本语言已发布的翻译，不跨语言借文案。 */
export function mapHomeBannerRows(
  rows: HomeBannerRow[],
  lang: "en" | "zh",
  resolveImage: (value: string | null | undefined) => string | null,
): HomeBannerSlide[] {
  return rows
    .filter((row) => row.status === "published")
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.id - b.id)
    .flatMap((row) => {
      const translation = row.translations?.find((item) => item.language === lang && item.status === "published");
      const image = resolveImage(translation?.image || row.image);
      const href = bannerHref(row);
      const title = translation?.title?.trim();
      const cta = translation?.cta?.trim();
      if (!translation || !image || !href || !title || !cta) return [];
      return [{
        id: row.id,
        image,
        href,
        tag: translation.tag?.trim() ?? "",
        title,
        text: translation.text?.trim() ?? "",
        cta,
      }];
    });
}
