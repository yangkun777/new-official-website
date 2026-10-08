type Lang = "en" | "zh";
const DEFAULT_LANG: Lang = "en";
const LANGS: readonly Lang[] = ["en", "zh"];

export type SiteMode = "demo-path" | "production";

export interface SitePolicyOptions {
  mode: SiteMode;
  siteOrigin: string;
  cnSiteOrigin: string;
}

export interface SitePolicy {
  mode: SiteMode;
  localePath(lang: Lang, path?: string): string;
  siteUrl(lang: Lang, path?: string): string;
}

function normalizePath(path = "/"): string {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function trimOrigin(origin: string): string {
  return origin.replace(/\/+$/, "");
}

export function createSitePolicy(options: SitePolicyOptions): SitePolicy {
  const siteOrigin = trimOrigin(options.siteOrigin);
  const cnSiteOrigin = trimOrigin(options.cnSiteOrigin);

  function localePath(lang: Lang, path = "/"): string {
    const normalized = normalizePath(path);
    if (options.mode === "production" && (lang === DEFAULT_LANG || lang === "zh")) {
      return normalized;
    }
    if (options.mode === "production" && lang !== "zh") {
      return normalized === "/" ? `/${lang}` : `/${lang}${normalized}`;
    }
    return normalized === "/" ? `/${lang}` : `/${lang}${normalized}`;
  }

  function siteUrl(lang: Lang, path = "/"): string {
    const origin = options.mode === "production" && lang === "zh"
      ? cnSiteOrigin
      : siteOrigin;
    return `${origin}${localePath(lang, path)}`;
  }

  return { mode: options.mode, localePath, siteUrl };
}

export function getSitePolicy(): SitePolicy {
  const mode = process.env.SITE_MODE === "production" ? "production" : "demo-path";
  return createSitePolicy({
    mode,
    siteOrigin:
      process.env.SITE_ORIGIN ??
      (mode === "production" ? "https://www.degson.com" : "http://localhost:3000"),
    cnSiteOrigin:
      process.env.CN_SITE_ORIGIN ??
      (mode === "production" ? "https://www.degson.com.cn" : "http://localhost:3000"),
  });
}

export function supportedSiteLanguages(): readonly Lang[] {
  return LANGS;
}
