"use client";

import { usePathname } from "next/navigation";
import LangSwitcher from "@/components/LangSwitcher";
import { LANGS, type Lang } from "@/lib/lang";
import { getDemoNewsBySlug } from "@/lib/newsDemo";

/** 顶栏语言切换：自动去掉当前 URL 的语言前缀，切到同业务 path。 */
export default function HeaderLangSwitcher({ lang }: { lang: Lang }) {
  const pathname = usePathname() || "/";
  const stripped =
    pathname.replace(new RegExp(`^/(${LANGS.join("|")})(?=/|$)`), "") || "/";
  const demo = stripped.startsWith("/news/")
    ? getDemoNewsBySlug(lang, stripped.slice("/news/".length))
    : null;
  const paths = demo ? {
    en: `/news/${demo.en.slug}`,
    zh: `/news/${demo.zh.slug}`,
  } : undefined;
  return <LangSwitcher lang={lang} path={stripped} paths={paths} nativeNavigation />;
}
