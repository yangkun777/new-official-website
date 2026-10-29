import Image from "next/image";
import HeaderLangSwitcher from "@/components/HeaderLangSwitcher";
import SiteNavigation from "@/components/SiteNavigation";
import { siteHref } from "@/lib/site";
import type { Lang } from "@/lib/lang";

const NAV: { path: string; en: string; zh: string }[] = [
  { path: "/", en: "Home", zh: "首页" },
  { path: "/products", en: "Products", zh: "产品" },
  { path: "/solutions", en: "Solutions", zh: "方案" },
  { path: "/services", en: "Services", zh: "服务" },
  { path: "/about", en: "About", zh: "关于" },
  { path: "/news", en: "News", zh: "新闻" },
];

export default function SiteHeader({
  siteName = "DEGSON",
  lang,
}: {
  siteName?: string;
  lang: Lang;
}) {
  const items = NAV.map(n => ({ path: n.path, href: siteHref(lang, n.path), label: lang === "zh" ? n.zh : n.en,
    children: n.path === "/services" ? [
      { href: siteHref(lang, "/services"), label: lang === "zh" ? "服务与支持" : "Services & support", description: lang === "zh" ? "选型、资料与工程沟通" : "Selection and engineering support", path: "/services" },
      { href: siteHref(lang, "/services/faq"), label: lang === "zh" ? "常见问题 FAQ" : "Frequently asked questions", description: lang === "zh" ? "快速查找产品与应用答案" : "Answers about products and applications", path: "/services/faq" },
    ] : undefined,
  }));
  return (
    <header className="sticky top-0 z-30 border-b border-[#e4e4e4] bg-white">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-4 px-6 lg:px-8">
        <a
          href={siteHref(lang, "/")}
          aria-label={siteName}
          className="flex shrink-0 items-center"
        >
          <Image
            src="/images/degson-logo.png"
            alt={siteName}
            width={314}
            height={68}
            className="h-8 w-auto"
            priority
          />
        </a>
        <SiteNavigation items={items} zh={lang === "zh"} />
        <HeaderLangSwitcher lang={lang} />
      </div>
      <SiteNavigation items={items} zh={lang === "zh"} mobile />
    </header>
  );
}
