import { DEFAULT_LANG, LANGS, type Lang } from "./lang";
import { getSitePolicy } from "./siteConfig";

export const SITE_ORIGIN =
  process.env.SITE_ORIGIN ??
  (process.env.SITE_MODE === "production"
    ? "https://www.degson.com"
    : "http://localhost:3000");

/** 演示模式按访问 Host 拼绝对地址，同事用局域网 IP 进来时不再写成 localhost。 */
export function publicOriginFromHeaders(headerList: {
  get(name: string): string | null;
}): string {
  if (process.env.SITE_MODE === "production") {
    return SITE_ORIGIN.replace(/\/+$/, "");
  }
  const host = (headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "")
    .split(",")[0]
    .trim();
  if (!host) return SITE_ORIGIN.replace(/\/+$/, "");
  const proto = (headerList.get("x-forwarded-proto") ?? "http").split(",")[0].trim() || "http";
  return `${proto}://${host}`;
}

export function absUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN.replace(/\/+$/, "")}${p}`;
}

export function siteUrl(lang: Lang, path = "/"): string {
  return getSitePolicy().siteUrl(lang, path);
}

/** 浏览器站内跳转：演示模式保留访问者当前的主机/IP。 */
export function siteHref(lang: Lang, path = "/"): string {
  return getSitePolicy().siteHref(lang, path);
}

/**
 * 语言前缀路径的唯一拼接点。
 * 当前形态为路径式 /en/...（PRD D2 建议）；
 * 若将来改为子域 de.degson.com，只需改这里 + middleware.ts，不必动页面。
 */
export function localePath(lang: Lang, path = "/"): string {
  return getSitePolicy().localePath(lang, path);
}

/** hreflang 取值：zh 明确写 zh-Hans，避免与繁体混淆 */
export function hreflangOf(lang: Lang): string {
  return lang === "zh" ? "zh-Hans" : lang;
}

/**
 * hreflang 互链（PRD §8.1.1 第 3 条）：
 * 只声明真实存在内容的语言，未翻译语言不声明——避免指向空页/错误页（现网正是这个毛病）。
 * langs 省略 = 全站语言集（首页/列表页）；详情页传该条记录真实拥有的语言。
 */
export function hreflangMap(
  path: string,
  langs: Lang[] = [...LANGS]
): Record<string, string> {
  const list = langs.length > 0 ? langs : [DEFAULT_LANG];
  const languages: Record<string, string> = {};
  for (const l of list) {
    languages[hreflangOf(l)] = siteHref(l, path);
  }
  const xDefault = list.includes(DEFAULT_LANG) ? DEFAULT_LANG : list[0];
  languages["x-default"] = siteHref(xDefault, path);
  return languages;
}

