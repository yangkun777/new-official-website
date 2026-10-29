import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import MediaReveal from "@/components/MediaReveal";
import { siteHref } from "@/lib/site";
import { NEWS_DEMO_STORIES } from "@/lib/newsDemo";
import type { Lang } from "@/lib/lang";

export default function NewsDemo({ lang }: { lang: Lang }) {
  const zh = lang === "zh";
  return <div className="bg-white text-[#17212b]">
    <section className="border-b border-[#dce1e5] bg-[#f5f6f7]"><div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 lg:px-12 lg:py-24"><p className="text-[13px] font-semibold text-[#af1728]">{zh ? "高松资讯" : "DEGSON updates"}</p><h1 className="mt-5 text-[clamp(44px,4.4vw,68px)] font-semibold tracking-[-0.045em]">{zh ? "产品与应用通讯" : "Products and applications"}</h1><p className="mt-5 max-w-[650px] text-[17px] leading-8 text-[#53606a]">{zh ? "从连接技术到行业应用，继续了解高松的产品方向。" : "A closer look at DEGSON products, technologies and the places they work."}</p></div></section>
    <section className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 lg:px-12 lg:py-24"><div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
      {NEWS_DEMO_STORIES.map((story, index) => {
        const copy = story[lang];
        return (
          <Link
            key={copy.slug}
            href={siteHref(lang, `/news/${copy.slug}`)}
            className={`news-card group block border-b border-[#dce1e5] pb-8 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#af1728] ${index === 0 ? "lg:row-span-2" : ""}`}
          >
            <MediaReveal
              direction={index === 0 ? "left" : "right"}
              delay={index * 65}
              className="relative aspect-[12/5] bg-[#eef1f3]"
            >
              <ProductImage
                src={story.image}
                alt={copy.title}
                sizes={index === 0 ? "(min-width:1024px) 60vw, 100vw" : "(min-width:1024px) 35vw, 100vw"}
                className="object-cover"
              />
            </MediaReveal>
            <p className="mt-6 text-[13px] font-semibold text-[#af1728]">{copy.tag}</p>
            <h2 className={`mt-3 font-semibold leading-tight tracking-[-0.025em] transition-colors group-hover:text-[#af1728] group-focus-visible:text-[#af1728] motion-reduce:transition-none ${index === 0 ? "text-[clamp(27px,2.6vw,38px)]" : "text-[25px]"}`}>
              {copy.title}
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-[#53606a]">{copy.summary}</p>
            <span className="motion-arrow mt-5 inline-flex items-center gap-2 text-sm font-semibold">
              {zh ? "查看新闻详情" : "Read article"}
              <span aria-hidden="true">↗</span>
            </span>
          </Link>
        );
      })}
    </div></section>
  </div>;
}
