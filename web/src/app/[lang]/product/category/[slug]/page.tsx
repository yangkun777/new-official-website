import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import CategoryCard from "@/components/CategoryCard";
import SeriesCard from "@/components/SeriesCard";
import Pagination from "@/components/Pagination";
import {
  getCategoryBySlug,
  getSubCategories,
  getSeriesByCategory,
} from "@/lib/repo";
import { toLang, type Lang } from "@/lib/lang";
import { hreflangMap, siteUrl } from "@/lib/site";
import { serializeJsonLd, socialMetadata } from "@/lib/seo";
import type { Category, Crumb } from "@/types/product";

export const revalidate = 60;
const PER_PAGE = 12;

interface PageProps {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const found = await getCategoryBySlug(slug, toLang((await params).lang));
  if (!found) return {};
  const cat = found.category;
  const path = `/product/category/${cat.slug}`;
  const title = cat.seo_title ?? cat.name;
  const description = (
    cat.seo_description ??
    cat.description ??
    `${cat.name} from DEGSON`
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

function buildCrumbs(cat: Category, lang: Lang): Crumb[] {
  const crumbs: Crumb[] = [
    { id: 0, title: "Home", href: siteUrl(lang, "/") },
    { id: 0, title: "Products", href: siteUrl(lang, "/#products") },
  ];
  const parent = cat.parent_id;
  if (parent) {
    const grand = parent.parent_id;
    if (grand) crumbs.push({ id: grand.id, title: grand.name });
    crumbs.push({
      id: parent.id,
      title: parent.name,
      href: siteUrl(lang, `/product/category/${parent.slug}`),
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

  const found = await getCategoryBySlug(slug, lang);
  if (!found) notFound();

  // slug 属于某一条翻译行 → 收敛到该行语言的 URL，避免跨语言重复内容
  if (found.resolvedLang !== lang) {
    redirect(siteUrl(found.resolvedLang, `/product/category/${slug}`));
  }

  const cat = found.category;
  const crumbs = buildCrumbs(cat, lang);
  const pageUrl = siteUrl(lang, `/product/category/${cat.slug}`);

  const jsonLdCrumb = {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.title,
      ...(c.href ? { item: c.href } : {}),
    })),
  };

  // level 1 / 2 → 子分类卡片；level 3 → 系列分页
  if (cat.level === 1 || cat.level === 2) {
    const subs = await getSubCategories(cat.id, lang);
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          name: cat.name,
          description: cat.description ?? `${cat.name} from DEGSON`,
          url: pageUrl,
        },
        jsonLdCrumb,
      ],
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
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
                <CategoryCard key={s.id} category={s} pageLang={lang} />
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
  const probe = await getSeriesByCategory(cat.id, 1, lang, 1);
  const total = probe.total;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(Math.max(1, clampPage(sp.page)), totalPages);
  const { items } = await getSeriesByCategory(cat.id, page, lang, PER_PAGE);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: cat.name,
        url: pageUrl,
      },
      jsonLdCrumb,
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
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
                <SeriesCard key={s.id} series={s} pageLang={lang} />
              ))}
            </div>
            <div className="mt-10">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                basePath={siteUrl(lang, `/product/category/${cat.slug}`)}
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
