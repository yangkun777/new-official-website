import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import CategoryCard from "@/components/CategoryCard";
import SeriesCard from "@/components/SeriesCard";
import Pagination from "@/components/Pagination";
import {
  getCategoryBySlug,
  getSubCategories,
  getSeriesByCategory,
} from "@/lib/repo";
import type { Category, Crumb } from "@/types/product";
import { absUrl } from "@/lib/site";

export const revalidate = 60;
const PER_PAGE = 12;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return {};
  return {
    title: cat.name,
    description: (cat.description ?? `${cat.name} from DEGSON`).slice(0, 160),
  };
}

function buildCrumbs(cat: Category): Crumb[] {
  const crumbs: Crumb[] = [
    { id: 0, title: "Home", href: "/" },
    { id: 0, title: "Products", href: "/#products" },
  ];
  const parent = cat.parent_id;
  if (parent) {
    const grand = parent.parent_id;
    if (grand) crumbs.push({ id: grand.id, title: grand.name });
    crumbs.push({
      id: parent.id,
      title: parent.name,
      href: `/product/category/${parent.slug}`,
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
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();

  const crumbs = buildCrumbs(cat);

  // level 1 / 2 → 子分类卡片；level 3 → 系列分页
  if (cat.level === 1 || cat.level === 2) {
    const subs = await getSubCategories(cat.id);
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          name: cat.name,
          description: cat.description ?? `${cat.name} from DEGSON`,
          url: absUrl(`/product/category/${cat.slug}`),
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
        <section
          className="relative overflow-hidden bg-[#003f88]"
          style={
            cat.image
              ? {
                  backgroundImage: `url(${cat.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#003f88] to-[#003f88]/60" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              {cat.name}
            </h1>
            {cat.description ? (
              <p className="mt-4 max-w-2xl text-base text-blue-50/90">
                {cat.description}
              </p>
            ) : null}
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {subs.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {subs.map((s) => (
                <CategoryCard key={s.id} category={s} />
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No subcategories available.</p>
          )}
        </section>
      </>
    );
  }

  // level 3 → 系列分页
  const sp = await searchParams;
  const probe = await getSeriesByCategory(cat.id, 1, 1);
  const total = probe.total;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(Math.max(1, clampPage(sp.page)), totalPages);
  const { items } = await getSeriesByCategory(cat.id, page, PER_PAGE);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: cat.name,
        url: absUrl(`/product/category/${cat.slug}`),
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
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900">{cat.name}</h1>
          {cat.description ? (
            <p className="mt-3 max-w-2xl text-slate-600">{cat.description}</p>
          ) : null}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((s) => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
            <div className="mt-10">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                basePath={`/product/category/${cat.slug}`}
              />
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
            No series in this category yet.
          </div>
        )}
      </section>
    </>
  );
}
