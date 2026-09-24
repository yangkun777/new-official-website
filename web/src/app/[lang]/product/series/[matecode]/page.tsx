import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import SeriesCard from "@/components/SeriesCard";
import VariantTable from "@/components/VariantTable";
import ProductImage from "@/components/ProductImage";
import {
  getSeriesByMatecode,
  getVariants,
  getRelatedSeries,
} from "@/lib/repo";
import { toLang, type Lang } from "@/lib/lang";
import { absUrl, hreflangMap, localePath } from "@/lib/site";
import type { Crumb, Series } from "@/types/product";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ lang: string; matecode: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang: rawLang, matecode } = await params;
  const found = await getSeriesByMatecode(matecode, toLang(rawLang));
  if (!found) return {};
  const s = found.series;
  const path = `/product/series/${s.matecode}`;
  return {
    title: s.seo_title ?? `${s.name} Series`,
    description: (
      s.seo_description ??
      s.description ??
      `${s.name} series from DEGSON`
    ).slice(0, 160),
    alternates: {
      canonical: absUrl(localePath(found.resolvedLang, path)),
      languages: hreflangMap(path, found.availableLangs),
    },
  };
}

function buildCrumbs(s: Series, lang: Lang): Crumb[] {
  const crumbs: Crumb[] = [
    { id: 0, title: "Home", href: localePath(lang, "/") },
    { id: 0, title: "Products", href: localePath(lang, "/#products") },
  ];
  const c3 = s.category_id;
  if (c3) {
    const l2 = c3.parent_id;
    if (l2) {
      const l1 = l2.parent_id;
      if (l1) crumbs.push({ id: l1.id, title: l1.name });
      crumbs.push({
        id: l2.id,
        title: l2.name,
        href: localePath(lang, `/product/category/${l2.slug}`),
      });
    }
    crumbs.push({
      id: c3.id,
      title: c3.name,
      href: localePath(lang, `/product/category/${c3.slug}`),
    });
  }
  crumbs.push({ id: s.id, title: s.name, current: true });
  return crumbs;
}

export default async function SeriesPage({ params }: PageProps) {
  const { lang: rawLang, matecode } = await params;
  const lang: Lang = toLang(rawLang);

  const found = await getSeriesByMatecode(matecode, lang);
  if (!found) notFound();

  // matecode 与语言无关，但翻译可能缺失 → 收敛到真正有内容的语言页
  if (found.resolvedLang !== lang) {
    redirect(localePath(found.resolvedLang, `/product/series/${matecode}`));
  }

  const series = found.series;
  const categoryId = series.category_id?.id ?? null;
  const [variants, related] = await Promise.all([
    getVariants(series.id),
    getRelatedSeries(categoryId, matecode, lang, 6),
  ]);
  const crumbs = buildCrumbs(series, lang);

  const mainImage = series.image;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: series.name,
        sku: variants.map((v) => v.order_no).filter(Boolean),
        ...(mainImage ? { image: mainImage } : {}),
        description: series.description ?? `${series.name} series`,
        url: absUrl(localePath(lang, `/product/series/${series.matecode}`)),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.title,
          ...(c.href ? { item: absUrl(c.href) } : {}),
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumb items={crumbs} />
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 md:grid-cols-[360px_1fr] lg:px-8">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
            {mainImage ? (
              <ProductImage
                src={mainImage}
                alt={series.name}
                sizes="(min-width:768px) 360px, 100vw"
                className="object-contain p-6"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-300">
                No image
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{series.name}</h1>
            {series.description ? (
              <p className="mt-4 text-slate-600">{series.description}</p>
            ) : null}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_280px]">
          <div>
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Variants
            </h2>
            <VariantTable variants={variants} />
          </div>
          {related.length > 0 ? (
            <aside>
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                Related Series
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {related.map((r) => (
                  <SeriesCard key={r.id} series={r} pageLang={lang} />
                ))}
              </div>
            </aside>
          ) : null}
        </div>
      </section>
    </>
  );
}
