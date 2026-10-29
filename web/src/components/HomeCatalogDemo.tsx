import Link from "next/link";
import HomeBanner from "@/components/HomeBanner";
import ProductImage from "@/components/ProductImage";
import MediaReveal from "@/components/MediaReveal";
import ProductLoopVideo from "@/components/ProductLoopVideo";
import ScrollReveal from "@/components/ScrollReveal";
import ConnectionJourney from "@/components/ConnectionJourney";
import { NEWS_DEMO_STORIES } from "@/lib/newsDemo";
import { siteHref } from "@/lib/site";
import type { Lang } from "@/lib/lang";
import type { HomeBannerSlide } from "@/lib/homeBannerModel";

/** Homepage visual demo: Banner comes from Directus; remaining sections use local demo content. */
const FAMILIES = [
  {
    href: "/product/category/terminal-blocks",
    image: "/images/marketing/home-product-1.png",
    en: { title: "Terminal blocks", detail: "For control cabinets and device wiring" },
    zh: { title: "接线端子", detail: "服务控制柜与设备接线" },
  },
  {
    href: "/product/category/circular-connectors",
    image: "/images/marketing/circular-connectors.jpg",
    en: { title: "Circular connectors", detail: "Signal, data and power at the device edge" },
    zh: { title: "圆形连接器", detail: "连接设备端的信号、数据与电力" },
  },
  {
    href: "/solutions",
    image: "/images/marketing/home-banner-heavy-duty.jpg",
    en: { title: "Heavy-duty connectors", detail: "Reliable interfaces for demanding environments" },
    zh: { title: "重载连接器", detail: "面向严苛环境的可靠接口" },
  },
  {
    href: "/solutions",
    image: "/images/marketing/home-banner-energy.jpg",
    en: { title: "Energy connectors", detail: "Connections across storage and charging systems" },
    zh: { title: "能源连接器", detail: "覆盖储能与充电系统的连接需求" },
  },
] as const;

const INDUSTRIES = [
  {
    image: "/images/marketing/feature-automation.jpg",
    anchor: "automation",
    en: { title: "Industrial automation", detail: "Cabinet wiring, sensors and machine modules" },
    zh: { title: "工业自动化", detail: "连接控制柜、传感器与设备模块" },
  },
  {
    image: "/images/marketing/feature-energy.jpg",
    anchor: "energy",
    en: { title: "New energy", detail: "From generation to storage and equipment wiring" },
    zh: { title: "新能源", detail: "从发电侧走向储能与设备配线" },
  },
  {
    image: "/images/marketing/feature-rail.jpg",
    anchor: "rail",
    en: { title: "Rail transit", detail: "Onboard control, equipment links and trackside signals" },
    zh: { title: "轨道交通", detail: "兼顾车载控制、设备连接与轨旁信号" },
  },
] as const;

const PROOF_POINTS = [
  {
    value: "1990",
    en: { label: "Founded", detail: "Decades focused on industrial connectivity" },
    zh: { label: "创立", detail: "持续专注工业连接技术" },
  },
  {
    value: "40,000+",
    en: { label: "Product models", detail: "A broad portfolio for varied applications" },
    zh: { label: "产品型号", detail: "覆盖多种连接需求与应用场景" },
  },
  {
    value: "UL-CTDP · VDE-TDAP · CNAS",
    en: { label: "Lab accreditations", detail: "Testing capability built around reliability" },
    zh: { label: "实验室资质", detail: "具备 UL、VDE 与 CNAS 相关认可" },
  },
] as const;

const ENGINEERING_PATHS = [
  { href: "/products", zh: "浏览产品目录", en: "Browse the product catalog" },
  { href: "/services", zh: "获取选型与资料支持", en: "Get selection and document support" },
  { href: "/solutions", zh: "按行业查看解决方案", en: "Explore solutions by industry" },
] as const;

export default function HomeCatalogDemo({ lang, bannerSlides }: { lang: Lang; bannerSlides: HomeBannerSlide[] }) {
  const zh = lang === "zh";
  return (
    <>
      {bannerSlides.length > 0 && <HomeBanner key={bannerSlides.map((slide) => slide.id).join(",")} lang={lang} slides={bannerSlides} />}

      <section className="border-b border-[#dce2e6] bg-[#f0f3f5] text-[#17212b]" aria-label={zh ? "高松与公司概览" : "DEGSON and company overview"}>
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-9 sm:px-10 lg:grid-cols-[0.9fr_1.8fr] lg:items-center lg:gap-12 lg:px-12 lg:py-10">
          <ScrollReveal direction="left">
            <p className="text-[12px] font-semibold tracking-[0.08em] text-[#af1728]">{zh ? "DEGSON 高松" : "DEGSON"}</p>
            <h2 className="mt-3 max-w-[16em] text-[clamp(23px,2.1vw,30px)] font-semibold leading-[1.22] tracking-[-0.025em]">
              {zh ? "从一个连接点，延伸到整个工业现场。" : "From one connection to the whole industrial system."}
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-3 border-l border-[#d6dde1]" aria-label={zh ? "高松实力" : "DEGSON at a glance"}>
          {PROOF_POINTS.map((point) => {
            const copy = zh ? point.zh : point.en;
            return (
              <ScrollReveal key={point.value} direction="up" delay={point.value === "1990" ? 0 : point.value === "40,000+" ? 60 : 120} className="h-full border-r border-[#d6dde1] last:border-r-0">
                <div className="proof-item relative h-full px-3 py-3 sm:px-6">
                  <span className="proof-line absolute left-3 top-0 h-[2px] w-8 origin-left bg-[#b7172b] sm:left-6" aria-hidden="true" />
                  <p className={`font-semibold tracking-[-0.035em] ${point.value.length > 16 ? "text-[clamp(11px,1.25vw,18px)]" : point.value.length > 8 ? "text-[clamp(17px,2vw,25px)]" : "text-[clamp(24px,2.7vw,36px)]"}`}>{point.value}</p>
                  <p className="mt-1 text-[12px] font-semibold text-[#17212b] sm:text-[13px]">{copy.label}</p>
                  <p className="mt-1 hidden text-[12px] leading-5 text-[#65717a] xl:block">{copy.detail}</p>
                </div>
              </ScrollReveal>
            );
          })}
          </div>
        </div>
      </section>

      <section id="products" className="bg-white">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-14 lg:px-12 lg:py-24">
          <ScrollReveal direction="left" className="lg:pr-4">
            <p className="text-[13px] font-semibold text-[#af1728]">{zh ? "产品体系" : "Products"}</p>
            <h2 className="mt-5 max-w-[10em] text-[clamp(34px,3.4vw,52px)] font-semibold leading-[1.12] tracking-[-0.04em] text-[#17212b]">
              {zh ? "为不同连接需求而设计" : "Designed around every connection"}
            </h2>
            <p className="mt-6 max-w-[360px] text-[15px] leading-7 text-[#5b6771]">
              {zh ? "从接线端子到工业连接器，探索面向设备与现场应用的产品体系。" : "Explore terminal blocks and industrial connectors built for equipment and field applications."}
            </p>
            <Link href={siteHref(lang, "/products")} className="motion-link mt-8 inline-flex text-sm font-semibold text-[#17212b] hover:text-[#af1728]">
              {zh ? "浏览全部产品" : "Browse all products"} ↗
            </Link>
          </ScrollReveal>
          <div className="grid gap-3 sm:grid-cols-2">
            {FAMILIES.map((family, index) => {
              const copy = zh ? family.zh : family.en;
              return (
                <Link key={family.image} href={siteHref(lang, family.href)} className="motion-card group block overflow-hidden border border-[#e5e9ec] bg-[#f3f5f6] hover:border-[#cbd3d8]">
                  <MediaReveal direction={index % 2 === 0 ? "left" : "right"} delay={(index % 2) * 70} className="relative aspect-[1.85/1]">
                    <ProductImage src={family.image} alt="" sizes="(min-width:1024px) 360px, (min-width:640px) 50vw, 100vw" className="object-contain p-3" />
                  </MediaReveal>
                  <div className="flex items-end justify-between gap-3 border-t border-[#e2e6e8] bg-white px-5 py-4">
                    <div>
                      <h3 className="text-[17px] font-semibold text-[#17212b]">{copy.title}</h3>
                      <p className="mt-1 text-[12px] leading-5 text-[#68747e]">{copy.detail}</p>
                    </div>
                    <span className="shrink-0 text-xl text-[#af1728] transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true">↗</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <ConnectionJourney lang={lang} />

      <section id="push-snap" className="scroll-mt-20 bg-[#eef1f3]">
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:px-12 lg:py-24">
          <ScrollReveal direction="left" className="order-2 lg:order-1">
            <p className="text-[13px] font-semibold text-[#af1728]">{zh ? "重点产品 · PUSH-SNAP" : "Featured technology · PUSH-SNAP"}</p>
            <h2 className="mt-5 max-w-[12em] text-[clamp(32px,3.4vw,50px)] font-semibold leading-[1.14] tracking-[-0.035em] text-[#17212b]">
              {zh ? <><span className="block">让接线更简单，</span><span className="block">让连接更可靠。</span></> : "Simpler wiring. More reliable connections."}
            </h2>
            <p className="mt-6 max-w-[490px] text-[16px] leading-8 text-[#53606a]">
              {zh
                ? "PUSH-SNAP 以直插连接技术回应设备小型化与现场接线效率的需求。"
                : "PUSH-SNAP connection technology supports compact equipment and more efficient field wiring."}
            </p>
            <Link href={siteHref(lang, "/product/category/terminal-blocks")} className="motion-arrow mt-8 inline-flex border-b-2 border-[#af1728] pb-2 text-[14px] font-semibold text-[#17212b] hover:text-[#af1728]">
              {zh ? "了解接线产品" : "Explore terminal blocks"}<span className="ml-2" aria-hidden="true">↗</span>
            </Link>
          </ScrollReveal>
          <ScrollReveal direction="right" className="order-1 bg-white lg:order-2">
            <ProductLoopVideo lang={lang} />
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-20 sm:px-10 lg:px-12 lg:py-28">
          <ScrollReveal direction="left" className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[13px] font-semibold text-[#af1728]">{zh ? "行业应用" : "Applications"}</p>
              <h2 className="mt-4 text-[clamp(32px,3.2vw,48px)] font-semibold leading-tight tracking-[-0.035em] text-[#17212b]">
                {zh ? "连接技术，走进更多现场" : "Connectivity at work"}
              </h2>
              <p className="mt-4 max-w-[580px] text-[14px] leading-7 text-[#68747e]">
                {zh ? "从控制柜到能源设备与轨道系统，按真实连接位置继续探索。" : "Explore connections from control cabinets to energy equipment and rail systems."}
              </p>
            </div>
            <Link href={siteHref(lang, "/solutions")} className="motion-link text-sm font-semibold text-[#17212b] hover:text-[#af1728]">
              {zh ? "查看行业方案" : "Explore solutions"} ↗
            </Link>
          </ScrollReveal>
          <div className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:grid-rows-2">
            {INDUSTRIES.map((industry, index) => {
              const copy = zh ? industry.zh : industry.en;
              return <Link key={industry.anchor} href={siteHref(lang, `/solutions#${industry.anchor}`)} className={`home-industry-card group relative isolate block min-h-[320px] overflow-hidden bg-[#17212b] text-white sm:min-h-[360px] ${index === 0 ? "lg:row-span-2 lg:min-h-[680px]" : "lg:min-h-[332px]"}`}>
                <MediaReveal direction={index === 0 ? "left" : "right"} delay={index * 60} className="absolute inset-0">
                  <ProductImage src={industry.image} alt="" sizes={index === 0 ? "(min-width:1024px) 680px, 100vw" : "(min-width:1024px) 480px, 100vw"} className="object-cover" />
                </MediaReveal>
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d1a27]/95 via-[#0d1a27]/20 to-transparent" aria-hidden="true" />
                <span className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-9">
                  <span className="flex items-end justify-between gap-5">
                    <span className="text-[clamp(24px,2.5vw,36px)] font-semibold leading-tight tracking-[-0.025em]">{copy.title}</span>
                    <span className="home-industry-arrow flex h-10 w-10 shrink-0 items-center justify-center border border-white/50 text-xl" aria-hidden="true">↗</span>
                  </span>
                  <span className="mt-3 block max-w-[26em] text-[13px] leading-6 text-white/80 sm:text-sm">{copy.detail}</span>
                </span>
              </Link>;
            })}
          </div>
        </div>
      </section>

      <section id="latest-insights" className="border-t border-[#dce1e5] bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 lg:px-12 lg:py-20">
          <ScrollReveal direction="left" className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[13px] font-semibold text-[#af1728]">{zh ? "产品与应用通讯" : "Product & application notes"}</p>
              <h2 className="mt-4 max-w-[18em] text-[clamp(30px,3vw,44px)] font-semibold leading-tight tracking-[-0.035em] text-[#17212b]">
                {zh ? "从连接细节，看见更多应用可能。" : "A closer look at connections in use."}
              </h2>
            </div>
            <Link href={siteHref(lang, "/news")} className="motion-link w-fit shrink-0 text-sm font-semibold text-[#17212b] hover:text-[#af1728]">
              {zh ? "阅读全部通讯" : "Read all stories"} ↗
            </Link>
          </ScrollReveal>
          <div className="mt-9 grid gap-8 md:grid-cols-2">
            {NEWS_DEMO_STORIES.slice(0, 2).map((story, index) => {
              const copy = story[lang];
              return <Link key={copy.slug} href={siteHref(lang, `/news/${copy.slug}`)} className="news-card group flex h-full flex-col border-t border-[#dce1e5] pt-4">
                <MediaReveal direction={index === 1 ? "up" : index === 0 ? "left" : "right"} delay={index * 60} className="relative aspect-[2/1] bg-[#f1f3f4]">
                  <ProductImage src={story.image} alt="" sizes="(min-width:1024px) 390px, (min-width:768px) 33vw, 100vw" className="object-cover" />
                </MediaReveal>
                <span className="mt-5 text-[11px] font-semibold text-[#af1728]">{copy.tag}</span>
                <h3 className="mt-2 text-[clamp(20px,1.9vw,24px)] font-semibold leading-[1.35] tracking-[-0.02em] text-[#17212b] transition-colors duration-200 group-hover:text-[#af1728] group-focus-visible:text-[#af1728]">{copy.title}</h3>
                <p className="mt-3 flex-1 text-[13px] leading-6 text-[#68747e]">{copy.summary}</p>
                <span className="motion-arrow mt-5 inline-flex items-center justify-between border-b border-[#dce1e5] pb-4 text-[13px] font-semibold text-[#17212b]">
                  {zh ? "阅读文章" : "Read story"}<span className="text-[#af1728]" aria-hidden="true">↗</span>
                </span>
              </Link>;
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-[#dce1e5] bg-[#f5f6f7]">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-20 lg:px-12 lg:py-20">
          <ScrollReveal direction="left" className="lg:sticky lg:top-24">
            <p className="text-[13px] font-semibold text-[#af1728]">{zh ? "选型与支持" : "Selection and support"}</p>
            <h2 className="mt-4 max-w-[13em] text-[clamp(29px,3vw,42px)] font-semibold leading-tight tracking-[-0.03em] text-[#17212b]">
              {zh ? "找到适合你应用的连接方案。" : "Find the right connection for your application."}
            </h2>
            <p className="mt-5 max-w-[440px] text-[15px] leading-7 text-[#68747e]">
              {zh ? "从产品目录、技术资料到应用方案，按你的工作路径继续浏览。" : "Continue from the product catalog, technical support or an industry application."}
            </p>
          </ScrollReveal>
          <ScrollReveal direction="right" className="border-t border-[#cbd2d7]">
            {ENGINEERING_PATHS.map((path, index) => (
              <Link key={path.href} href={siteHref(lang, path.href)} className="engineering-path group grid grid-cols-[auto_1fr_auto] items-center gap-5 border-b border-[#cbd2d7] py-6 text-[#17212b] hover:text-[#af1728]">
                <span className="text-[12px] tabular-nums text-[#89939b]">0{index + 1}</span>
                <span className="text-[clamp(18px,2vw,25px)] font-semibold tracking-[-0.02em]">{zh ? path.zh : path.en}</span>
                <span className="text-xl transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true">↗</span>
              </Link>
            ))}
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
