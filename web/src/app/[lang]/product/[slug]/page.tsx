import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Breadcrumb from "@/components/Breadcrumb";
import ProductDetail, { ProductTechnicalDetails } from "@/components/ProductDetail";
import ProductMediaGallery from "@/components/ProductMediaGallery";
import ProductContentSections from "@/components/ProductContentSections";
import ProductEngineeringGuide from "@/components/ProductEngineeringGuide";
import ScrollReveal from "@/components/ScrollReveal";
import { catalogImage } from "@/lib/catalogAssets";
import { getProductContent } from "@/lib/productContent";
import { getProductByOrderNo, getSiteSettings } from "@/lib/repo";
import { toLang, type Lang } from "@/lib/lang";
import { siteUrl, siteHref } from "@/lib/site";
import { serializeJsonLd } from "@/lib/seo";
import { cmsPageMetadata } from "@/lib/pageGeo";
import { productOrderNoFromSlug } from "@/lib/productSlug";
import { productPublicPath } from "@/lib/productPaths";
import type { Crumb, ProductDetail as ProductDetailModel } from "@/types/product";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  const orderNo = productOrderNoFromSlug(slug);
  if (!orderNo) return {};
  const found = await getProductByOrderNo(orderNo, toLang(rawLang));
  if (!found) return {};
  const product = found.product;
  const path = productPublicPath(product);
  return cmsPageMetadata({
    lang: found.resolvedLang,
    path,
    title: product.seo_title ?? product.name,
    description:
      product.seo_description ??
      product.short_description ??
      `${product.name} from DEGSON`,
    keywords: product.seo_keywords,
    availableLangs: found.availableLangs,
    pathsByLang: found.pathsByLang,
  });
}

function buildCrumbs(product: ProductDetailModel, lang: Lang): Crumb[] {
  return [
    { id: 0, title: lang === "zh" ? "首页" : "Home", href: siteHref(lang, "/") },
    { id: 0, title: lang === "zh" ? "产品" : "Products", href: siteHref(lang, "/products") },
    { id: product.id, title: product.name, current: true },
  ];
}

export default async function ProductPage({ params }: PageProps) {
  const { lang: rawLang, slug } = await params;
  const lang = toLang(rawLang);
  const orderNo = productOrderNoFromSlug(slug);
  if (!orderNo) notFound();
  const found = await getProductByOrderNo(orderNo, lang);
  if (!found) notFound();

  const canonicalPath = productPublicPath(found.product);
  const hierarchicalPath = (await headers()).get("x-degson-hierarchical-path");
  const requestedPath = hierarchicalPath ?? `/product/${encodeURIComponent(slug)}`;
  if (found.resolvedLang !== lang || requestedPath !== canonicalPath) {
    // Preserve old /product/{slug-or-orderNo} links while moving to the category hierarchy URL.
    redirect(siteHref(found.resolvedLang, canonicalPath));
  }

  const product = found.product;
  const settings = await getSiteSettings();
  const content = await getProductContent(product.id, lang);
  const crumbs = buildCrumbs(product, lang);
  const pageUrl = siteUrl(lang, canonicalPath);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        sku: product.order_no,
        ...(product.media.length ? { image: product.media.map((item) => item.url && new URL(item.url, pageUrl).toString()).filter(Boolean) } : {}),
        description: product.short_description ?? product.description ?? `${product.name} from DEGSON`,
        url: pageUrl,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.title,
          ...(crumb.href ? { item: crumb.href } : {}),
        })),
      },
    ],
  };
  const labels = lang === "zh"
    ? { noImage: "暂无图片", gallery: "产品图片", seriesReference: "系列参考图 · 具体外观以订货号为准", zoom: "放大查看产品图片", close: "关闭图片" }
    : { noImage: "No image available", gallery: "Product images", seriesReference: "Series reference image · variant may differ", zoom: "Enlarge product image", close: "Close image" };
  const fallbackImage = catalogImage(product.series?.image) ?? (product.order_no === "10010012354" ? "/images/products/2cdgkrp-reference.jpg" : null);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <Breadcrumb items={crumbs} />
      <section className="bg-[#f5f6f7]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-start gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[minmax(320px,480px)_minmax(0,1fr)] lg:gap-20 lg:px-12 lg:py-16">
          <ProductMediaGallery name={product.name} media={product.media} fallbackImage={fallbackImage} labels={labels} />
          <ScrollReveal direction="right"><ProductDetail product={product} lang={lang} contactEmail={settings?.contact_email} specs={content.specs} /></ScrollReveal>
        </div>
      </section>
      {content.specs.length > 0 ? <ProductEngineeringGuide content={content} lang={lang} /> : <ProductTechnicalDetails product={product} lang={lang} />}
      <ProductContentSections content={content} lang={lang} orderNo={product.order_no} />
    </>
  );
}
