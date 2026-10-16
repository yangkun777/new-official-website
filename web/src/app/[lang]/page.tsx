import type { Metadata } from "next";
import Link from "next/link";
import {
  getSiteSettings,
  localizeSiteCopy,
  getCategoriesByLevel,
  getSitePageCards,
  getSocialLinks,
  getNewsList,
  getHomeBlocks,
} from "@/lib/repo";
import { toLang, type Lang } from "@/lib/lang";
import { hreflangMap, siteUrl } from "@/lib/site";
import { socialMetadata } from "@/lib/seo";
import SocialIcons from "@/components/SocialIcons";
import ProductImage from "@/components/ProductImage";
import CategoryCard from "@/components/CategoryCard";
import NewsCard from "@/components/NewsCard";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ lang: string }>;
}

const CATEGORY_FALLBACKS = [
  "/images/marketing/home-product-1.jpg",
  "/images/marketing/home-product-2.jpg",
  "/images/marketing/home-product-3.jpg",
  "/images/marketing/home-product-4.jpg",
  "/images/marketing/home-connector.png",
  "/images/marketing/home-push.jpg",
];

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const lang = toLang((await params).lang);
  const title = "DEGSON";
  const description =
    lang === "zh"
      ? "高松工业连接解决方案，包括接线端子、连接器和工业组件。"
      : "DEGSON industrial connection solutions — terminal blocks and connectors.";
  return {
    ...socialMetadata({ title, description, url: siteUrl(lang, "/") }),
    alternates: {
      canonical: siteUrl(lang, "/"),
      languages: hreflangMap("/"),
    },
  };
}

export default async function Home({ params }: PageProps) {
  const lang: Lang = toLang((await params).lang);
  const isZh = lang === "zh";

  const [settings, level1, pageCards, social, news, homeBlocks] = await Promise.all([
    getSiteSettings(),
    getCategoriesByLevel(1, lang),
    getSitePageCards(lang),
    getSocialLinks(),
    getNewsList(lang),
    getHomeBlocks(lang),
  ]);

  const copy = localizeSiteCopy(settings, lang);
  const highlights = homeBlocks.filter((b) => b.kind === "highlight");
  const bands = homeBlocks.filter((b) => b.kind === "feature");
  const industries = homeBlocks.filter((b) => b.kind === "industry");
  const productShots = homeBlocks.filter((b) => b.kind === "product_shot");
  const heroThumbs = homeBlocks.filter((b) => b.kind === "hero_thumb");
  const categories = level1.map((c, i) => ({
    ...c,
    image: c.image || CATEGORY_FALLBACKS[i % CATEGORY_FALLBACKS.length],
  }));
  const newsPreview = news.slice(0, 3);

  return (
    <>
      {/* Hero — 工业站常见大图首屏 */}
      <section className="relative min-h-[420px] overflow-hidden bg-[#003f88] text-white sm:min-h-[520px]">
        <div className="absolute inset-0">
          <ProductImage
            src={copy.heroImage || "/images/marketing/home-hero.jpg"}
            alt=""
            priority
            className="object-cover opacity-50"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#002a5c]/95 via-[#003f88]/80 to-[#003f88]/45" />
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-20 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100/90">
              {copy.heroKicker}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {copy.heroTitle}
            </h1>
            <p className="mt-5 text-lg text-blue-50/95 sm:text-xl">
              {copy.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={siteUrl(lang, "/#products")}
                className="inline-flex items-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[#003f88] hover:bg-blue-50"
              >
                {isZh ? "浏览产品" : "Browse products"}
              </Link>
              <Link
                href={siteUrl(lang, "/solutions")}
                className="inline-flex items-center rounded-md border border-white/50 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                {isZh ? "行业方案" : "Industry solutions"}
              </Link>
            </div>
            {social.length > 0 ? (
              <div className="mt-8">
                <SocialIcons
                  items={social}
                  className="[&_a]:border-white/30 [&_a]:bg-white/10 [&_a]:text-white [&_a:hover]:border-white [&_a:hover]:bg-white/20"
                />
              </div>
            ) : null}
          </div>
          {heroThumbs.length > 0 ? (
          <div className="grid w-full max-w-md grid-cols-3 gap-3 lg:pb-2">
            {heroThumbs.map((item) => (
              <div
                key={item.key}
                className="relative aspect-[3/4] overflow-hidden rounded-lg border border-white/20 bg-white/10"
              >
                <ProductImage
                  src={item.image || ""}
                  alt={item.title}
                  className="object-contain p-2"
                  sizes="120px"
                />
              </div>
            ))}
          </div>
          ) : null}
        </div>
      </section>

      {highlights.length > 0 ? (
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
          {highlights.map((h) => (
            <div key={h.key}>
              <p className="text-lg font-semibold text-[#003f88]">{h.title}</p>
              {h.text ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{h.text}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
      ) : null}

      {/* 产品分类 */}
      <section id="products" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#003f88]">
              {isZh ? "产品中心" : "Products"}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              {isZh ? "按分类快速进入选型" : "Start from product categories"}
            </h2>
          </div>
          <Link
            href={siteUrl(lang, "/solutions")}
            className="text-sm font-medium text-[#003f88] hover:underline"
          >
            {isZh ? "不确定型号？先看行业方案 →" : "Not sure which series? See solutions →"}
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c} pageLang={lang} />
          ))}
        </div>
        {productShots.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {productShots.map((item) => (
            <div
              key={item.key}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="relative aspect-square bg-slate-50">
                <ProductImage
                  src={item.image || ""}
                  alt={item.title}
                  className="object-contain p-4"
                  sizes="(min-width:640px) 25vw, 50vw"
                />
              </div>
              <p className="border-t border-slate-100 px-3 py-2 text-center text-sm font-medium text-slate-700">
                {item.title}
              </p>
            </div>
          ))}
        </div>
        ) : null}
      </section>

      {industries.length > 0 ? (
      <section className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#003f88]">
                {isZh ? "应用场景" : "Applications"}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                {isZh ? "覆盖关键工业赛道" : "Built for key industrial markets"}
              </h2>
            </div>
            <Link
              href={siteUrl(lang, "/solutions")}
              className="text-sm font-medium text-[#003f88] hover:underline"
            >
              {isZh ? "查看全部方案 →" : "All solutions →"}
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {industries.map((item) => (
              <Link
                key={item.key}
                href={siteUrl(lang, item.href)}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition hover:-translate-y-0.5 hover:border-[#003f88]/30 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-slate-200">
                  <ProductImage
                    src={item.image || ""}
                    alt={item.title}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 group-hover:text-[#003f88]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {item.text}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {bands.length > 0 ? (
      <section className="bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
          {bands.map((band, idx) => (
            <div
              key={band.key}
              className={`grid items-center gap-8 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-2 ${
                idx % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div className="relative min-h-[240px] lg:min-h-[320px]">
                <ProductImage
                  src={band.image || ""}
                  alt={band.title}
                  className="object-cover"
                  sizes="(min-width:1024px) 50vw, 100vw"
                />
              </div>
              <div className="p-8 lg:p-10">
                <h2 className="text-2xl font-bold text-slate-900">{band.title}</h2>
                {band.text ? <p className="mt-3 text-slate-600">{band.text}</p> : null}
                <Link
                  href={siteUrl(lang, band.href)}
                  className="mt-6 inline-flex text-sm font-semibold text-[#003f88] hover:underline"
                >
                  {(band.cta || (isZh ? "了解更多" : "Learn more"))} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
      ) : null}

      {/* 解决方案 / 服务 / 关于 */}
      {pageCards.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#003f88]">
            {isZh ? "公司与方案" : "Company & solutions"}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            {isZh ? "从应用到服务的完整入口" : "From applications to services"}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {pageCards.map((p) => (
              <Link
                key={p.slug}
                href={siteUrl(lang, `/${p.slug}`)}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-[#003f88]/30 hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] bg-slate-100">
                  <ProductImage
                    src={p.coverImage || "/images/marketing/hero-solutions.jpg"}
                    alt={p.title}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(min-width:768px) 33vw, 100vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-[#003f88]">
                    {p.title}
                  </h3>
                  {p.summary ? (
                    <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                      {p.summary}
                    </p>
                  ) : null}
                  <span className="mt-4 inline-block text-sm font-medium text-[#003f88]">
                    {isZh ? "查看详情 →" : "Learn more →"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* 新闻 */}
      {newsPreview.length > 0 ? (
        <section className="border-t border-slate-100 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-[#003f88]">
                  {isZh ? "新闻动态" : "News"}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {isZh ? "最新资讯" : "Latest updates"}
                </h2>
              </div>
              <Link
                href={siteUrl(lang, "/news")}
                className="text-sm font-medium text-[#003f88] hover:underline"
              >
                {isZh ? "全部新闻 →" : "All news →"}
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {newsPreview.map((n) => (
                <NewsCard key={n.id} news={n} pageLang={lang} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 底部 CTA */}
      <section className="bg-[#003f88] text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <h2 className="text-2xl font-bold">{copy.ctaTitle}</h2>
            <p className="mt-2 max-w-xl text-blue-100">{copy.ctaText}</p>
          </div>
          <Link
            href={siteUrl(lang, copy.ctaLink)}
            className="inline-flex shrink-0 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[#003f88] hover:bg-blue-50"
          >
            {isZh ? "了解服务" : "View services"}
          </Link>
        </div>
      </section>
    </>
  );
}
