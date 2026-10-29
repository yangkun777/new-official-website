import type { Metadata } from "next";
import { DEFAULT_LANG, LANGS, type Lang } from "./lang";
import { socialMetadata } from "./seo";
import { hreflangMap, hreflangOf, siteHref } from "./site";

/** 页面可见 H1：后台填了用后台，否则用标题。 */
export function displayHeading(
  h1: string | null | undefined,
  fallback: string
): string {
  const value = h1?.trim();
  return value || fallback;
}

export function keywordsMeta(
  raw: string | null | undefined
): string[] | undefined {
  if (!raw?.trim()) return undefined;
  const parts = raw
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
}

const BRAND_IN_TITLE = /DEGSON|高松/i;

/** 后台 SEO 标题若已含品牌，不再套布局的「%s | DEGSON」。 */
export function documentTitle(title: string): Metadata["title"] {
  const trimmed = title.trim() || "DEGSON";
  if (BRAND_IN_TITLE.test(trimmed)) return { absolute: trimmed };
  return trimmed;
}

export function cmsPageMetadata(opts: {
  lang: Lang;
  path: string;
  title: string;
  description: string;
  keywords?: string | null;
  availableLangs?: Lang[];
  pathsByLang?: Partial<Record<Lang, string>>;
}): Metadata {
  const title = opts.title.trim() || "DEGSON";
  const description = (opts.description || title).slice(0, 160);
  const languages = opts.pathsByLang
    ? (() => {
        const available = (opts.availableLangs ?? [...LANGS]).filter((language) => Boolean(opts.pathsByLang?.[language]));
        if (!available.length) return hreflangMap(opts.path, opts.availableLangs);
        const result: Record<string, string> = {};
        for (const language of available) result[hreflangOf(language)] = siteHref(language, opts.pathsByLang![language]!);
        const fallback = available.includes(DEFAULT_LANG) ? DEFAULT_LANG : available[0];
        result["x-default"] = siteHref(fallback, opts.pathsByLang![fallback]!);
        return result;
      })()
    : hreflangMap(opts.path, opts.availableLangs);
  return {
    title: documentTitle(title),
    description,
    keywords: keywordsMeta(opts.keywords),
    ...socialMetadata({
      title,
      description,
      url: siteHref(opts.lang, opts.path),
    }),
    alternates: {
      canonical: siteHref(opts.lang, opts.path),
      languages,
    },
  };
}

export function webPageJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  lang: Lang;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: opts.lang === "zh" ? "zh-Hans" : "en",
  };
}
