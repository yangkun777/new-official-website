"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { siteHref } from "@/lib/site";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { lang: routeLang } = useParams<{ lang: string }>();
  const lang = routeLang === "zh" ? "zh" : "en";
  const zh = lang === "zh";

  return <section className="mx-auto grid min-h-[60vh] max-w-[1280px] items-center gap-10 px-6 py-20 text-[#17212b] sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-12 lg:py-28">
    <div className="border-t-2 border-[#af1728] pt-5"><span className="text-[clamp(72px,10vw,130px)] font-semibold leading-none tracking-[-0.07em] text-[#e2e6e8]">DEGSON</span></div>
    <div>
      <p className="text-[13px] font-semibold text-[#af1728]">{zh ? "页面暂时无法显示" : "Page unavailable"}</p>
      <h1 className="mt-4 max-w-[14em] text-[clamp(34px,3.5vw,50px)] font-semibold leading-tight tracking-[-0.035em]">{zh ? "让我们重新打开这一页。" : "Let’s try opening this page again."}</h1>
      <p className="mt-5 max-w-[520px] text-[15px] leading-8 text-[#53606a]">{zh ? "请重试；如果仍无法打开，可以先返回首页继续浏览。" : "Try again. If the page still does not open, return to the home page and continue browsing."}</p>
      <div className="mt-8 flex flex-wrap gap-4">
        <button type="button" onClick={reset} className="motion-arrow inline-flex min-h-12 items-center bg-[#17212b] px-6 text-sm font-semibold text-white hover:bg-[#af1728] focus-visible:bg-[#af1728]">{zh ? "重试" : "Try again"}<span className="ml-4" aria-hidden="true">↗</span></button>
        <Link href={siteHref(lang, "/")} className="motion-arrow inline-flex min-h-12 items-center border border-[#17212b] px-6 text-sm font-semibold hover:border-[#af1728] hover:text-[#af1728] focus-visible:border-[#af1728] focus-visible:text-[#af1728]">{zh ? "返回首页" : "Back to home"}<span className="ml-4" aria-hidden="true">↗</span></Link>
      </div>
    </div>
  </section>;
}
