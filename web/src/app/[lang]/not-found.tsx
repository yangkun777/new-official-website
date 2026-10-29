"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { siteHref } from "@/lib/site";

export default function NotFound() {
  const { lang: routeLang } = useParams<{ lang: string }>();
  const lang = routeLang === "zh" ? "zh" : "en";
  const zh = lang === "zh";

  return <section className="mx-auto grid min-h-[60vh] max-w-[1280px] items-center gap-10 px-6 py-20 text-[#17212b] sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-12 lg:py-28">
    <div className="border-t-2 border-[#af1728] pt-5"><span className="text-[clamp(80px,12vw,170px)] font-semibold leading-none tracking-[-0.08em] text-[#e2e6e8]">404</span></div>
    <div>
      <p className="text-[13px] font-semibold text-[#af1728]">{zh ? "页面未找到" : "Page not found"}</p>
      <h1 className="mt-4 max-w-[14em] text-[clamp(34px,3.5vw,50px)] font-semibold leading-tight tracking-[-0.035em]">{zh ? "这页暂时没有可查看的内容。" : "This page is not available right now."}</h1>
      <p className="mt-5 max-w-[520px] text-[15px] leading-8 text-[#53606a]">{zh ? "地址可能已调整，或内容尚未发布。你可以从首页重新寻找，或直接浏览产品。" : "The address may have changed, or the content may not be published. Start again from the home page or browse products."}</p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href={siteHref(lang, "/")} className="motion-arrow inline-flex min-h-12 items-center bg-[#17212b] px-6 text-sm font-semibold text-white hover:bg-[#af1728] focus-visible:bg-[#af1728]">{zh ? "返回首页" : "Back to home"}<span className="ml-4" aria-hidden="true">↗</span></Link>
        <Link href={siteHref(lang, "/products")} className="motion-arrow inline-flex min-h-12 items-center border border-[#17212b] px-6 text-sm font-semibold hover:border-[#af1728] hover:text-[#af1728] focus-visible:border-[#af1728] focus-visible:text-[#af1728]">{zh ? "浏览产品" : "Browse products"}<span className="ml-4" aria-hidden="true">↗</span></Link>
      </div>
    </div>
  </section>;
}
