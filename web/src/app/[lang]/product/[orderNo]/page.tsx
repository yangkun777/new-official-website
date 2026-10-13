import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import ProductDetail from "@/components/ProductDetail";
import ProductMediaGallery from "@/components/ProductMediaGallery";
import { getProductByOrderNo } from "@/lib/repo";
import { toLang, type Lang } from "@/lib/lang";
import { hreflangMap, siteUrl } from "@/lib/site";
import { serializeJsonLd, socialMetadata } from "@/lib/seo";
import type { Crumb, ProductDetail as ProductDetailModel } from "@/types/product";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ lang: string; orderNo: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: rawLang, orderNo } = await params;
  const found = await getProductByOrderNo(orderNo, toLang(rawLang));
  if (!found) return {};
  const product = found.product;
  const path = `/product/${product.order_no}`;
  const title = product.seo_title ?? product.name;
  const description = (
    product.seo_description ??
    product.short_description ??
    `${product.name} from DEGSON`
  ).slice(0, 160);
  return {
    title,
    description,
    ...socialMetadata({ title, description, url: siteUrl(found.resolvedLang, path) }),
    alternates: {
      canonical: siteUrl(found.resolvedLang, path),
      languages: hreflangMap(path, found.availableLangs),
    },
  };
}

function buildCrumbs(product: ProductDetailModel, lang: Lang): Crumb[] {
  return [
    { id: 0, title: lang === "zh" ? "首页" : "Home", href: siteUrl(lang, "/") },
    { id: 0, title: lang === "zh" ? "产品" : "Products", href: siteUrl(lang, "/#products") },
    { id: product.id, title: product.name, current: true },
  ];
}

export default async function ProductPage({ params }: PageProps) {
  const { lang: rawLang, orderNo } = await params;
  const lang = toLang(rawLang);
  const found = await getProductByOrderNo(orderNo, lang);
  if (!found) notFound();

  if (found.resolvedLang !== lang) {
    redirect(siteUrl(found.resolvedLang, `/product/${found.product.order_no}`));
  }

  const product = found.product;
  const crumbs = buildCrumbs(product, lang);
  const pageUrl = siteUrl(lang, `/product/${product.order_no}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        sku: product.order_no,
        ...(product.media.length ? { image: product.media.map((item) => item.url).filter(Boolean) } : {}),
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
    ? { noImage: "暂无图片", gallery: "产品图片" }
    : { noImage: "No image available", gallery: "Product images" };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <Breadcrumb items={crumbs} />
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(320px,480px)_1fr] lg:px-8">
          <ProductMediaGallery name={product.name} media={product.media} labels={labels} />
          <ProductDetail product={product} lang={lang} />
        </div>
      </section>
    </>
  );
}
