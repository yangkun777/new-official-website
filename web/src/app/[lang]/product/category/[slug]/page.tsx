import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Breadcrumb from "@/components/Breadcrumb";
import CategoryCard from "@/components/CategoryCard";
import SeriesExplorer from "@/components/SeriesExplorer";
import ProductImage from "@/components/ProductImage";
import MediaReveal from "@/components/MediaReveal";
import ScrollReveal from "@/components/ScrollReveal";
import { getCatalogSeries } from "@/lib/catalogData";
import { catalogImage } from "@/lib/catalogAssets";
import ProductSearch from "@/components/ProductSearch";
import {
  getCategoryBySlug,
  getSubCategories,
  getSeriesByCategory,
} from "@/lib/repo";
import { toLang, type Lang } from "@/lib/lang";
import { siteUrl, siteHref } from "@/lib/site";
import { serializeJsonLd } from "@/lib/seo";
import { cmsPageMetadata, displayHeading } from "@/lib/pageGeo";
import { categoryPublicPath } from "@/lib/productPaths";
import type { Category, Crumb } from "@/types/product";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function resolveCategory(slug: string, lang: Lang) {
  const found = await getCategoryBySlug(slug, lang);
  if (!found) return null;
  const canonicalPath = categoryPublicPath(found.category.categoryPath) ?? `/product/category/${encodeURIComponent(found.category.slug)}`;
  const hierarchicalPath = (await headers()).get("x-degson-hierarchical-path");
  const requestedPath = hierarchicalPath ?? `/product/category/${encodeURIComponent(slug)}`;
  if (found.resolvedLang !== lang || requestedPath !== canonicalPath) {
    redirect(siteHref(found.resolvedLang, canonicalPath));
  }
  return found;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lang = toLang((await params).lang);
  const found = await resolveCategory(slug, lang);
  if (!found) return {};
  const cat = found.category;
  const path = categoryPublicPath(cat.categoryPath) ?? `/product/category/${encodeURIComponent(cat.slug)}`;
  return cmsPageMetadata({
    lang: found.resolvedLang,
    path,
    title: cat.seo_title ?? cat.name,
    description: cat.seo_description ?? cat.description ?? `${cat.name} from DEGSON`,
    keywords: cat.seo_keywords,
    availableLangs: found.availableLangs,
    pathsByLang: found.pathsByLang,
  });
}

function buildCrumbs(cat: Category, lang: Lang): Crumb[] {
  const crumbs: Crumb[] = [
    { id: 0, title: lang === "zh" ? "首页" : "Home", href: siteHref(lang, "/") },
    { id: 0, title: lang === "zh" ? "产品" : "Products", href: siteHref(lang, "/products") },
  ];
  const parent = cat.parent_id;
  if (parent) {
    const grand = parent.parent_id;
    if (grand) {
      const grandPath = categoryPublicPath(cat.categoryPath.slice(0, 1));
      crumbs.push({ id: grand.id, title: grand.name, ...(grandPath ? { href: siteHref(lang, grandPath) } : {}) });
    }
    crumbs.push({
      id: parent.id,
      title: parent.name,
      href: siteHref(lang, categoryPublicPath(cat.categoryPath.slice(0, -1)) ?? `/product/category/${parent.slug}`),
    });
  }
  crumbs.push({ id: cat.id, title: cat.name, current: true });
  return crumbs;
}

function clampPage(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { lang: rawLang, slug } = await params;
  const lang: Lang = toLang(rawLang);

  const found = await resolveCategory(slug, lang);
  if (!found) notFound();

  const cat = found.category;
  const crumbs = buildCrumbs(cat, lang);
  const pageUrl = siteUrl(lang, categoryPublicPath(cat.categoryPath) ?? `/product/category/${encodeURIComponent(cat.slug)}`);
  const familySlugs = Object.values(found.slugByLang);

  const jsonLdCrumb = {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.title,
      ...(c.href ? { item: c.href } : {}),
    })),
  };

  let subs = cat.level < 3 ? await getSubCategories(cat.id, lang) : [];
  if (cat.level === 1 && subs.length === 1) {
    const children = await getSubCategories(subs[0].id, lang);
    if (children.length > 0) subs = children;
  }
  const catalog = familySlugs.includes("terminal-blocks") ? await getCatalogSeries(lang) : null;
  const result = cat.level === 3 ? await getSeriesByCategory(cat.id, 1, lang, 200) : null;
  const sp = await searchParams;
  const image = familySlugs.includes("terminal-blocks")
    ? "/images/marketing/home-push.jpg"
    : familySlugs.includes("circular-connectors")
      ? "/images/marketing/circular-connectors.jpg"
      : catalogImage(result?.items[0]?.image ?? cat.image);
  const jsonLd = { "@context": "https://schema.org", "@graph": [{ "@type": "CollectionPage", name: cat.name, description: cat.description ?? cat.name, url: pageUrl }, jsonLdCrumb] };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
    <Breadcrumb items={crumbs} />
    <section className="border-b border-[#dce1e5] bg-white"><div className="mx-auto grid max-w-[1280px] items-end gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.35fr_0.65fr] lg:gap-16 lg:px-12 lg:py-12"><ScrollReveal direction="left"><div><p className="text-[13px] font-semibold text-[#af1728]">{lang === "zh" ? "产品目录" : "Product catalog"}</p><h1 className="mt-4 max-w-[18em] text-[clamp(32px,3.4vw,48px)] font-semibold leading-tight tracking-[-0.035em] text-[#17212b]">{displayHeading(cat.h1, cat.name)}</h1>{cat.description && <p className="mt-4 max-w-[620px] text-sm leading-7 text-[#53606a]">{cat.description}</p>}<div className="mt-6"><ProductSearch lang={lang} /></div></div></ScrollReveal>{image && <MediaReveal direction="right" className="relative hidden aspect-[16/10] border border-[#e5e9ec] bg-[#f5f6f7] lg:block"><ProductImage src={image} alt={cat.name} sizes="420px" priority className="object-contain p-6" /></MediaReveal>}</div></section>
    {subs.length > 0 && <section className="mx-auto max-w-[1280px] px-6 py-12 sm:px-10 lg:px-12"><ScrollReveal direction="left" className="mb-7 flex flex-wrap items-center justify-between gap-4"><h2 className="text-2xl font-semibold">{lang === "zh" ? "选择连接方式" : "Choose a connection type"}</h2><a href={siteHref(lang, "/products")} className="motion-link text-xs font-semibold">{lang === "zh" ? "返回产品中心" : "Back to product center"}</a></ScrollReveal><div className={`grid gap-5 sm:grid-cols-2 ${subs.length > 2 ? "lg:grid-cols-3" : ""}`}>{subs.map(item => <CategoryCard key={item.id} category={item} pageLang={lang} />)}</div></section>}
    {(catalog || result) && <section id="category-series" className="mx-auto max-w-[1280px] scroll-mt-32 px-6 py-12 sm:px-10 lg:px-12 lg:pb-20"><ScrollReveal direction="left"><h2 className="mb-8 text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.03em]">{lang === "zh" ? "浏览产品系列" : "Explore product series"}</h2></ScrollReveal><SeriesExplorer lang={lang} groups={catalog?.groups ?? [{ slug: cat.slug, name: cat.name }]} items={catalog?.items ?? (result?.items ?? []).map(item => ({ ...item, image: catalogImage(item.image), categorySlug: cat.slug, categoryName: cat.name }))} initialPage={clampPage(sp.page)} /></section>}
    <section className="border-t border-[#dce1e5] bg-[#f5f6f7]"><div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-6 px-6 py-10 sm:px-10 md:flex-row md:items-center lg:px-12"><ScrollReveal direction="left"><div><h2 className="text-2xl font-semibold">{lang === "zh" ? "需要进一步确认选型？" : "Need help reviewing the selection?"}</h2><p className="mt-3 text-sm text-[#68747e]">{lang === "zh" ? "带上应用条件、安装尺寸和关键参数，继续工程沟通。" : "Bring the application, dimensions and key ratings to the engineering conversation."}</p></div></ScrollReveal><ScrollReveal direction="right"><a href={siteHref(lang, "/services#service-preparation")} className="motion-arrow inline-flex shrink-0 border-b-2 border-[#af1728] pb-2 text-sm font-semibold">{lang === "zh" ? "准备需求清单" : "Prepare your checklist"}<span className="ml-4" aria-hidden="true">↗</span></a></ScrollReveal></div></section>
  </>;
}
