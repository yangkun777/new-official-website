import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getNewsBySlug } from "@/lib/repo";
import { toLang, type Lang } from "@/lib/lang";
import { hreflangMap, siteUrl } from "@/lib/site";
import LangSwitcher from "@/components/LangSwitcher";
import ProductImage from "@/components/ProductImage";
import { sanitizeRichText } from "@/lib/contentSafety";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const found = await getNewsBySlug(slug);
  if (!found) return {};
  const path = `/news/${found.news.slug}`;
  return {
    title: found.news.title,
    description: (found.news.summary ?? found.news.title).slice(0, 160),
    alternates: {
      canonical: siteUrl(found.resolvedLang, path),
      languages: hreflangMap(path, found.availableLangs),
    },
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { lang: rawLang, slug } = await params;
  const lang: Lang = toLang(rawLang);

  const found = await getNewsBySlug(slug);
  if (!found) notFound();

  // slug 属于某一条翻译行；若请求语言与该行语言不符，收敛到真正有内容的语言页，
  // 避免同一篇文章在 /zh 与 /en 下产出重复内容（PRD §6.4 / §8.1.1）
  if (found.resolvedLang !== lang) {
    redirect(siteUrl(found.resolvedLang, `/news/${found.news.slug}`));
  }

  const n = found.news;
  const isZh = lang === "zh";

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={siteUrl(lang, "/news")}
          className="text-sm font-medium text-[#003f88] hover:underline"
        >
          ← {isZh ? "返回新闻列表" : "Back to News"}
        </Link>
        <LangSwitcher
          lang={lang}
          path={`/news/${n.slug}`}
          available={found.availableLangs}
        />
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
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(n.body) }}
        />
      ) : null}
    </article>
  );
}
