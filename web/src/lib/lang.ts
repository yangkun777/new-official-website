// 语言单一来源：URL / 数据 / hreflang / slug 唯一 scope 全部从这里取。
// PRD §6.4：两位短码，不得混用 en-US / zh-CN。

export const LANGS = ["en", "zh"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";

export function isLang(v: string | undefined | null): v is Lang {
  return !!v && (LANGS as readonly string[]).includes(v);
}

/** 把任意输入收敛为受支持语言，非法值落到默认语言 */
export function toLang(v: string | undefined | null): Lang {
  return isLang(v) ? v : DEFAULT_LANG;
}

/** `*_translations` 行的通用形状（四个翻译表模板一致） */
export interface TranslationRow {
  id: number;
  language: string;
  name: string | null;
  slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  h1: string | null;
  short_description: string | null;
  description: string | null;
}

export interface Picked<T> {
  row: T;
  /** true = 请求语言没有翻译行，这一条是回退到 en 的结果 */
  isFallback: boolean;
}

/**
 * 语言选取 + 回退（PRD §6.4）：
 * 请求语言存在则用；否则回退 en；两者都没有则返回 null（调用方必须丢弃，绝不产出空壳页）。
 */
export function pickTranslation<T extends { language: string }>(
  rows: T[] | undefined | null,
  lang: Lang
): Picked<T> | null {
  if (!rows || rows.length === 0) return null;
  const exact = rows.find((r) => r.language === lang);
  if (exact) return { row: exact, isFallback: false };
  const fallback = rows.find((r) => r.language === DEFAULT_LANG);
  if (fallback) return { row: fallback, isFallback: true };
  // 只有其它语言的行：不猜、不回退，交给调用方跳过
  return null;
}

/** 语言相关的 <html lang> 取值（zh → zh-Hans，便于浏览器与 SEO 正确解析） */
export function htmlLang(lang: Lang): string {
  return lang === "zh" ? "zh-Hans" : "en";
}
