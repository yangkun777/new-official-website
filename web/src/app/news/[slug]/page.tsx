import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getNewsBySlug } from "@/lib/repo";
import LangSwitcher from "@/components/LangSwitcher";
import ProductImage from "@/components/ProductImage";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}

function resolveLang(raw?: string): string {
  return raw === "zh-CN" ? "zh-CN" : "en-US";
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const n = await getNewsBySlug(slug, resolveLang(sp.lang));
  if (!n) return {};
  return {
    title: n.title,
    description: (n.summary ?? n.title).slice(0, 160),
  };
}

export default async function NewsDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const lang = resolveLang(sp.lang);
  const isZh = lang === "zh-CN";
  const n = await getNewsBySlug(slug, lang);
  if (!n) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/news?lang=${lang}`}
          className="text-sm font-medium text-[#003f88] hover:underline"
        >
          ← {isZh ? "返回新闻列表" : "Back to News"}
        </Link>
        <LangSwitcher lang={lang} basePath={`/news/${slug}`} />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-slate-900">{n.title}</h1>
      {n.publish_date ? (
        <p className="mt-2 text-sm text-slate-400">{n.publish_date}</p>
      ) : null}
      {n.cover_image ? (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <ProductImage
            src={n.cover_image}
            alt={n.title}
            sizes="(min-width:768px) 768px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}
      {n.summary ? (
        <p className="mt-6 text-lg leading-relaxed text-slate-600">
          {n.summary}
        </p>
      ) : null}
      {n.body ? (
        <div
          className="mt-6 leading-relaxed text-slate-700 [&_p]:mb-4"
          dangerouslySetInnerHTML={{ __html: n.body }}
        />
      ) : null}
    </article>
  );
}
