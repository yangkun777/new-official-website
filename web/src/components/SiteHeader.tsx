import Link from "next/link";
import HeaderLangSwitcher from "@/components/HeaderLangSwitcher";
import { siteUrl } from "@/lib/site";
import type { Lang } from "@/lib/lang";

const NAV: { path: string; en: string; zh: string }[] = [
  { path: "/", en: "Home", zh: "首页" },
  { path: "/#products", en: "Products", zh: "产品" },
  { path: "/solutions", en: "Solutions", zh: "行业解决方案" },
  { path: "/services", en: "Services", zh: "服务" },
  { path: "/about", en: "About", zh: "关于我们" },
  { path: "/news", en: "News", zh: "新闻" },
];

export default function SiteHeader({
  siteName = "DEGSON",
  lang,
}: {
  siteName?: string;
  lang: Lang;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={siteUrl(lang, "/")} className="flex shrink-0 items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-[#003f88]">
            {siteName}
          </span>
        </Link>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-4 sm:gap-6">
          <nav className="hidden items-center gap-4 text-sm md:flex lg:gap-5">
            {NAV.map((n) => (
              <Link
                key={n.path}
                href={siteUrl(lang, n.path)}
                className="whitespace-nowrap text-slate-600 hover:text-[#003f88]"
              >
                {lang === "zh" ? n.zh : n.en}
              </Link>
            ))}
          </nav>
          <HeaderLangSwitcher lang={lang} />
        </div>
      </div>
      {/* 窄屏：第二行导航，避免顶栏挤爆 */}
      <nav className="flex gap-4 overflow-x-auto border-t border-slate-100 px-4 py-2 text-sm md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.path}
            href={siteUrl(lang, n.path)}
            className="shrink-0 whitespace-nowrap text-slate-600 hover:text-[#003f88]"
          >
            {lang === "zh" ? n.zh : n.en}
          </Link>
        ))}
      </nav>
    </header>
  );
}
