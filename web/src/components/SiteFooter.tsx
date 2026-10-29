import Image from "next/image";
import SocialIcons, { type SocialLinkItem } from "@/components/SocialIcons";
import { siteHref } from "@/lib/site";
import type { Lang } from "@/lib/lang";

const FOOTER_LINKS = [
  { title: { zh: "产品", en: "Products" }, links: [
    { path: "/products", zh: "产品中心", en: "Product center" },
    { path: "/product/category/terminal-blocks", zh: "接线端子", en: "Terminal blocks" },
    { path: "/product/category/circular-connectors", zh: "圆形连接器", en: "Circular connectors" },
  ] },
  { title: { zh: "方案", en: "Solutions" }, links: [
    { path: "/solutions", zh: "行业解决方案", en: "Industry solutions" },
    { path: "/solutions#industries", zh: "应用场景", en: "Applications" },
  ] },
  { title: { zh: "服务", en: "Services" }, links: [
    { path: "/services", zh: "服务与支持", en: "Services & support" },
    { path: "/services/faq", zh: "常见问题", en: "FAQ" },
    { path: "/services#service-explorer", zh: "选型与资料", en: "Selection & documents" },
  ] },
  { title: { zh: "关于", en: "About" }, links: [
    { path: "/about", zh: "关于高松", en: "About DEGSON" },
    { path: "/news", zh: "新闻动态", en: "News & insights" },
    { path: "mailto:info@degson.com", zh: "联系我们", en: "Contact us" },
  ] },
] as const;

export default function SiteFooter({
  text = "© DEGSON. All rights reserved.",
  social = [],
  lang,
}: {
  text?: string;
  social?: SocialLinkItem[];
  lang: Lang;
}) {
  const zh = lang === "zh";
  return (
    <footer className="bg-[#0c1d2b] text-white">
      <div className="footer-cta border-t border-white/10">
        <div className="mx-auto flex min-h-[220px] max-w-[1280px] items-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="max-w-[610px]">
            <p className="text-[12px] font-semibold tracking-[0.06em] text-[#f6818c]">DEGSON {zh ? "高松" : "CONNECTIVITY"}</p>
            <h2 className="mt-3 text-[clamp(27px,3vw,39px)] font-semibold leading-[1.16] tracking-[-0.035em]">
              {zh ? "找到适合您应用的连接方案。" : "Find the right connection for your application."}
            </h2>
            <p className="mt-3 max-w-[520px] text-[13px] leading-6 text-white/75 sm:text-sm">
              {zh ? "从产品选型、技术资料到行业应用，我们愿意和您一起梳理下一步。" : "From product selection and technical documents to application needs, explore the next step with us."}
            </p>
            <a href="mailto:info@degson.com" className="footer-cta-link motion-arrow mt-5 inline-flex min-h-10 items-center gap-5 bg-[#c5162e] px-5 text-[13px] font-semibold text-white hover:bg-[#e0243d] focus-visible:bg-[#e0243d]">
              {zh ? "联系高松" : "Contact DEGSON"}<span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0b1b28]">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-11 sm:px-10 lg:grid-cols-[210px_minmax(0,1fr)_215px] lg:gap-10 lg:px-12 lg:py-12">
          <div>
            <a href={siteHref(lang, "/")} aria-label={zh ? "高松首页" : "DEGSON home"} className="relative block h-[40px] w-[184px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <Image src="/images/degson-logo.png" alt="DEGSON" fill sizes="184px" className="object-contain object-left" />
              <Image src="/images/degson-logo.png" alt="" aria-hidden="true" fill sizes="184px" className="object-contain object-left brightness-0 invert" style={{ clipPath: "inset(0 0 0 24%)" }} />
            </a>
            <p className="mt-3 text-[11px] leading-[1.7] text-white/55">{zh ? "连接 · 让工业更智能" : "CONNECTING A SMARTER INDUSTRY"}</p>
            <a href="mailto:info@degson.com" className="footer-nav-link mt-5 inline-block text-xs text-white/65 hover:text-white">info@degson.com</a>
          </div>

          <nav aria-label={zh ? "页脚导航" : "Footer navigation"} className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4">
            {FOOTER_LINKS.map(group => <div key={group.title.en}>
              <h2 className="text-[13px] font-semibold text-white">{group.title[lang]}</h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map(item => <li key={item.path}><a href={item.path.startsWith("mailto:") ? item.path : siteHref(lang, item.path)} className="footer-nav-link inline-block text-[12px] leading-5 text-white/55 hover:text-white focus-visible:text-white">{item[lang]}</a></li>)}
              </ul>
            </div>)}
          </nav>

          <div>
            <h2 className="text-[13px] font-semibold">{zh ? "了解最新资讯" : "Latest updates"}</h2>
            <a href={siteHref(lang, "/news")} className="footer-news-link mt-4 flex min-h-11 items-center justify-between border border-white/20 pl-4 text-[12px] text-white/65 hover:border-white/45 hover:text-white focus-visible:border-white/45 focus-visible:text-white">
              <span>{zh ? "阅读产品与应用通讯" : "Read news & insights"}</span><span aria-hidden="true" className="flex min-h-11 w-11 items-center justify-center bg-[#c5162e] text-lg text-white">→</span>
            </a>
            <SocialIcons items={social} className="footer-social mt-5" />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0b1b28]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-6 py-5 text-[11px] text-white/45 sm:px-10 md:flex-row md:items-center md:justify-between lg:px-12">
          <p>{text}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href={siteHref(lang, "/about")} className="footer-nav-link hover:text-white">{zh ? "关于高松" : "About DEGSON"}</a>
            <a href={siteHref(lang, "/services")} className="footer-nav-link hover:text-white">{zh ? "服务与支持" : "Services"}</a>
            <a href="#" className="footer-back-top inline-flex items-center gap-1.5 hover:text-white focus-visible:text-white">{zh ? "回到顶部" : "Back to top"}<span aria-hidden="true">↑</span></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
