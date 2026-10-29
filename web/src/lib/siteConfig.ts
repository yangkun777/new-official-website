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
  siteHref(lang: Lang, path?: string): string;
}

/** 把误写成 http://localhost:3000/... 的地址收成路径，避免同事点进自己的电脑。 */
export function toSitePath(path = "/"): string {
  const raw = (path || "/").trim() || "/";
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      const combined = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      return combined.startsWith("/") ? combined : `/${combined}`;
    } catch {
      return raw.startsWith("/") ? raw : `/${raw}`;
    }
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function stripLangPrefix(path: string): string {
  const matched = path.match(/^\/(en|zh)(?=\/|$|\?|#)/);
  if (!matched) return path || "/";
  const rest = path.slice(matched[0].length);
  if (!rest) return "/";
  if (rest.startsWith("#") || rest.startsWith("?")) return `/${rest}`;
  return rest.startsWith("/") ? rest : `/${rest}`;
}

function normalizePath(path = "/"): string {
  const value = toSitePath(path);
  if (!value || value === "/") return "/";
  return value;
}

function trimOrigin(origin: string): string {
  return origin.replace(/\/+$/, "");
}

export function createSitePolicy(options: SitePolicyOptions): SitePolicy {
  const siteOrigin = trimOrigin(options.siteOrigin);
  const cnSiteOrigin = trimOrigin(options.cnSiteOrigin);

  function localePath(lang: Lang, path = "/"): string {
    let normalized = normalizePath(path);
    if (options.mode === "demo-path") {
      normalized = stripLangPrefix(normalized);
    }
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

  function siteHref(lang: Lang, path = "/"): string {
    return options.mode === "demo-path" ? localePath(lang, path) : siteUrl(lang, path);
  }

  return { mode: options.mode, localePath, siteUrl, siteHref };
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
