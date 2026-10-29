import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Breadcrumb from "@/components/Breadcrumb";
import SeriesCard from "@/components/SeriesCard";
import VariantTable from "@/components/VariantTable";
import MediaReveal from "@/components/MediaReveal";
import ScrollReveal from "@/components/ScrollReveal";
import { catalogImage } from "@/lib/catalogAssets";
import { seriesFacts } from "@/lib/catalogTypes";
import ProductImage from "@/components/ProductImage";
import ProductSearch from "@/components/ProductSearch";
import { categoryPublicPath, seriesPublicPath } from "@/lib/productPaths";
import {
  getSeriesByMatecode,
  getSeriesBySlug,
  getVariants,
  getRelatedSeries,
} from "@/lib/repo";
import { toLang, type Lang } from "@/lib/lang";
import { siteUrl, siteHref } from "@/lib/site";
import { serializeJsonLd } from "@/lib/seo";
import { cmsPageMetadata, displayHeading } from "@/lib/pageGeo";
import type { Crumb, Series } from "@/types/product";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  const found = /^\d+$/.test(slug)
    ? await getSeriesByMatecode(slug, toLang(rawLang))
    : await getSeriesBySlug(slug, toLang(rawLang));
  if (!found) return {};
  const s = found.series;
  const path = seriesPublicPath(s);
  return cmsPageMetadata({
    lang: found.resolvedLang,
    path,
    title: s.seo_title ?? `${s.name} Series`,
    description: s.seo_description ?? s.description ?? `${s.name} series from DEGSON`,
    keywords: s.seo_keywords,
    availableLangs: found.availableLangs,
    pathsByLang: found.pathsByLang,
  });
}

function buildCrumbs(s: Series, lang: Lang): Crumb[] {
  const crumbs: Crumb[] = [
    { id: 0, title: lang === "zh" ? "首页" : "Home", href: siteHref(lang, "/") },
    { id: 0, title: lang === "zh" ? "产品" : "Products", href: siteHref(lang, "/products") },
  ];
  s.categoryPath.forEach((category, index) => {
    const href = categoryPublicPath(s.categoryPath.slice(0, index + 1));
    crumbs.push({ id: category.id, title: category.name, ...(href ? { href: siteHref(lang, href) } : {}) });
  });
  crumbs.push({ id: s.id, title: s.name, current: true });
  return crumbs;
}

export default async function SeriesPage({ params }: PageProps) {
  const { lang: rawLang, slug } = await params;
  const lang: Lang = toLang(rawLang);

  const found = /^\d+$/.test(slug)
    ? await getSeriesByMatecode(slug, lang)
    : await getSeriesBySlug(slug, lang);
  if (!found) notFound();

  const canonicalPath = seriesPublicPath(found.series);
  const hierarchicalPath = (await headers()).get("x-degson-hierarchical-path");
  const requestedPath = hierarchicalPath ?? `/product/series/${encodeURIComponent(slug)}`;
  if (found.resolvedLang !== lang || requestedPath !== canonicalPath) {
    redirect(siteHref(found.resolvedLang, canonicalPath));
  }

  const series = found.series;
  const categoryId = series.category_id?.id ?? null;
  const [variants, related] = await Promise.all([
    getVariants(series.id),
    getRelatedSeries(categoryId, series.matecode, lang, 6),
  ]);
  const crumbs = buildCrumbs(series, lang);

  const mainImage = catalogImage(series.image);
  const facts = seriesFacts(series.short_description ?? series.description);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: series.name,
        sku: variants.map((v) => v.order_no).filter(Boolean),
        ...(mainImage ? { image: mainImage } : {}),
        description: series.description ?? `${series.name} series`,
        url: siteUrl(lang, canonicalPath),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.title,
          ...(c.href ? { item: c.href } : {}),
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <Breadcrumb items={crumbs} />
      <div className="border-b border-[#e4e4e4] bg-white">
        <div className="mx-auto flex max-w-7xl justify-end px-4 py-4 sm:px-6 lg:px-8">
          <ProductSearch lang={lang} />
        </div>
      </div>
      <section className="border-b border-[#dce1e5] bg-[#f5f6f7]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 px-6 py-14 sm:px-10 md:grid-cols-[minmax(320px,0.9fr)_1.1fr] lg:gap-20 lg:px-12 lg:py-16">
          <MediaReveal direction="left" className="relative aspect-square w-full overflow-hidden bg-white">
            {mainImage ? (
              <ProductImage
                src={mainImage}
                alt={series.name}
                sizes="(min-width:768px) 360px, 100vw"
                className="object-contain p-8"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#68747e]">
                {lang === "zh" ? "暂无图片" : "No image available"}
              </div>
            )}
          </MediaReveal>
          <ScrollReveal direction="right"><div>
            <p className="text-[13px] font-semibold text-[#af1728]">{lang === "zh" ? "产品系列" : "Product series"}</p>
            <h1 className="mt-5 text-[clamp(38px,3.8vw,58px)] font-semibold leading-tight tracking-[-0.04em] text-[#17212b]">
              {displayHeading(series.h1, series.name)}
            </h1>
            {series.description ? (
              <p className="mt-6 max-w-2xl text-[16px] leading-8 text-[#53606a]">{series.description}</p>
            ) : null}
            <dl className="mt-7 grid grid-cols-3 gap-4 border-y border-[#dce1e5] py-5">{[[lang === "zh" ? "间距" : "Pitch", facts.pitch ? `${facts.pitch} mm` : "—"], [lang === "zh" ? "额定电流" : "Rated current", facts.current ? `${facts.current} A` : "—"], [lang === "zh" ? "可选型号" : "Variants", String(variants.length)]].map(([label, value]) => <div key={label}><dt className="text-xs text-[#68747e]">{label}</dt><dd className="mt-2 text-xl font-semibold">{value}</dd></div>)}</dl>
            <a href="#variants" className="motion-arrow mt-7 inline-flex border-b-2 border-[#af1728] pb-2 text-sm font-semibold">{lang === "zh" ? "选择产品型号" : "Select a variant"}<span className="ml-4" aria-hidden="true">↘</span></a>
          </div></ScrollReveal>
        </div>
      </section>
      <section id="variants" className="mx-auto max-w-[1280px] scroll-mt-32 px-6 py-16 sm:px-10 lg:px-12 lg:py-24">
        <h2 className="mb-8 border-b border-[#dce1e5] pb-6 text-[clamp(29px,2.7vw,40px)] font-semibold text-[#17212b]">
          {lang === "zh" ? "产品型号" : "Variants"}
        </h2>
        <VariantTable variants={variants} lang={lang} seriesPath={canonicalPath} />
      </section>
      {related.length > 0 ? (
        <section id="related-series" className="border-t border-[#dce1e5] bg-[#f5f6f7]">
          <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 lg:px-12 lg:py-24">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-[#af1728]">
                  {lang === "zh" ? "继续浏览" : "Explore more"}
                </p>
                <h2 className="mt-4 text-[clamp(29px,2.7vw,40px)] font-semibold text-[#17212b]">
                  {lang === "zh" ? "相关系列" : "Related Series"}
                </h2>
              </div>
              {series.category_id ? (
                <a href={siteHref(lang, categoryPublicPath(series.categoryPath) ?? `/product/category/${series.category_id.slug}`)} className="text-sm font-semibold text-[#17212b] underline decoration-[#af1728] underline-offset-8 hover:text-[#af1728]">
                  {lang === "zh" ? "查看该分类全部系列 →" : "View all series in this category →"}
                </a>
              ) : null}
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <SeriesCard key={r.id} series={r} pageLang={lang} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
