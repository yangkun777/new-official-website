import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import SeriesCard from "@/components/SeriesCard";
import VariantTable from "@/components/VariantTable";
import ProductImage from "@/components/ProductImage";
import {
  getSeriesByMatecode,
  getVariants,
  getRelatedSeries,
} from "@/lib/repo";
import type { Crumb, Series } from "@/types/product";
import { absUrl } from "@/lib/site";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ matecode: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { matecode } = await params;
  const s = await getSeriesByMatecode(matecode);
  if (!s) return {};
  return {
    title: `${s.name} Series`,
    description: (s.description ?? `${s.name} series from DEGSON`).slice(0, 160),
  };
}

function buildCrumbs(s: Series): Crumb[] {
  const crumbs: Crumb[] = [
    { id: 0, title: "Home", href: "/" },
    { id: 0, title: "Products", href: "/#products" },
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
        href: `/product/category/${l2.slug}`,
      });
    }
    crumbs.push({
      id: c3.id,
      title: c3.name,
      href: `/product/category/${c3.slug}`,
    });
  }
  crumbs.push({ id: s.id, title: s.name, current: true });
  return crumbs;
}

export default async function SeriesPage({ params }: PageProps) {
  const { matecode } = await params;
  const series = await getSeriesByMatecode(matecode);
  if (!series) notFound();

  const categoryId = series.category_id?.id ?? null;
  const [variants, related, crumbs] = await Promise.all([
    getVariants(series.id),
    getRelatedSeries(categoryId, matecode, 6),
    Promise.resolve(buildCrumbs(series)),
  ]);

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
        url: absUrl(`/product/series/${series.matecode}`),
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
                  <SeriesCard key={r.id} series={r} />
                ))}
              </div>
            </aside>
          ) : null}
        </div>
      </section>
    </>
  );
}
