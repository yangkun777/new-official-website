import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getNewsBySlug } from "@/lib/repo";
import { toLang, type Lang } from "@/lib/lang";
import { siteUrl, siteHref } from "@/lib/site";
import LangSwitcher from "@/components/LangSwitcher";
import ProductImage from "@/components/ProductImage";
import MediaReveal from "@/components/MediaReveal";
import { sanitizeRichText } from "@/lib/contentSafety";
import { serializeJsonLd } from "@/lib/seo";
import { cmsPageMetadata, displayHeading } from "@/lib/pageGeo";
import { getDemoNewsBySlug } from "@/lib/newsDemo";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  const lang = toLang(rawLang);
  const found = await getNewsBySlug(slug, lang);
  if (!found) {
    const demo = getDemoNewsBySlug(lang, slug);
    if (!demo) return {};
    const copy = demo[lang];
    return cmsPageMetadata({
      lang,
      path: `/news/${copy.slug}`,
      title: copy.title,
      description: copy.summary,
      availableLangs: ["en", "zh"],
    });
  }
  const path = `/news/${found.news.slug}`;
  return cmsPageMetadata({
    lang: found.resolvedLang,
    path,
    title: found.news.seo_title || found.news.title,
    description: found.news.seo_description || found.news.summary || found.news.title,
    keywords: found.news.seo_keywords,
    availableLangs: found.availableLangs,
  });
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { lang: rawLang, slug } = await params;
  const lang: Lang = toLang(rawLang);

  const found = await getNewsBySlug(slug, lang);
  if (!found) {
    const demo = getDemoNewsBySlug(lang, slug);
    if (!demo) notFound();
    return <DemoNewsArticle lang={lang} story={demo} />;
  }

  // slug 属于某一条翻译行；若请求语言与该行语言不符，收敛到真正有内容的语言页，
  // 避免同一篇文章在 /zh 与 /en 下产出重复内容（PRD §6.4 / §8.1.1）
  if (found.resolvedLang !== lang) {
    redirect(siteHref(found.resolvedLang, `/news/${found.news.slug}`));
  }

  const n = found.news;
  const isZh = lang === "zh";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: n.title,
    description: n.summary ?? n.title,
    datePublished: n.publish_date ?? undefined,
    image: n.cover_image ? [n.cover_image] : undefined,
    inLanguage: lang === "zh" ? "zh-Hans" : "en",
    mainEntityOfPage: siteUrl(lang, `/news/${n.slug}`),
    publisher: {
      "@type": "Organization",
      name: "DEGSON",
      url: siteUrl("en", "/"),
    },
  };

  return (
    <article className="mx-auto max-w-[900px] px-6 py-16 text-[#17212b] sm:px-10 lg:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={siteHref(lang, "/news")}
          className="text-sm font-semibold text-[#17212b] underline decoration-[#af1728] underline-offset-4 hover:text-[#af1728]"
        >
          ← {isZh ? "返回新闻列表" : "Back to News"}
        </Link>
        <LangSwitcher
          lang={lang}
          path={`/news/${n.slug}`}
          available={found.availableLangs}
          paths={Object.fromEntries(
            Object.entries(found.slugs).map(([code, translatedSlug]) => [
              code,
              `/news/${translatedSlug}`,
            ])
          ) as Partial<Record<Lang, string>>}
        />
      </div>
      <h1 className="mt-10 text-[clamp(38px,3.8vw,58px)] font-semibold leading-tight tracking-[-0.04em] text-[#17212b]">
        {displayHeading(n.h1, n.title)}
      </h1>
      {n.publish_date ? (
        <p className="mt-5 text-sm text-[#68747e]">{n.publish_date}</p>
      ) : null}
      {n.cover_image ? (
        <MediaReveal direction="up" className="relative mt-10 aspect-[16/9] w-full bg-[#eef1f3]">
          <ProductImage
            src={n.cover_image}
            alt={n.title}
            sizes="(min-width:768px) 768px, 100vw"
            className="object-cover"
          />
        </MediaReveal>
      ) : null}
      {n.summary ? (
        <p className="mt-10 border-l-2 border-[#af1728] pl-6 text-[19px] leading-9 text-[#53606a]">
          {n.summary}
        </p>
      ) : null}
      {n.body ? (
        <div
          className="mt-10 text-[16px] leading-8 text-[#53606a] [&_p]:mb-5 [&_h2]:mt-10 [&_h2]:text-[28px] [&_h2]:font-semibold [&_a]:text-[#af1728]"
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(n.body) }}
        />
      ) : null}
    </article>
  );
}

function DemoNewsArticle({
  lang,
  story,
}: {
  lang: Lang;
  story: NonNullable<ReturnType<typeof getDemoNewsBySlug>>;
}) {
  const copy = story[lang];
  const zh = lang === "zh";
  const paths = {
    en: `/news/${story.en.slug}`,
    zh: `/news/${story.zh.slug}`,
  };
  const url = siteUrl(lang, paths[lang]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: copy.title,
    description: copy.summary,
    image: [story.image],
    inLanguage: lang === "zh" ? "zh-Hans" : "en",
    mainEntityOfPage: url,
    publisher: {
      "@type": "Organization",
      name: "DEGSON",
      url: siteUrl("en", "/"),
    },
  };

  return (
    <article className="mx-auto max-w-[900px] px-6 py-16 text-[#17212b] sm:px-10 lg:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={siteHref(lang, "/news")}
          className="text-sm font-semibold text-[#17212b] underline decoration-[#af1728] underline-offset-4 hover:text-[#af1728]"
        >
          ← {zh ? "返回新闻列表" : "Back to News"}
        </Link>
        <LangSwitcher
          lang={lang}
          path={paths[lang]}
          available={["en", "zh"]}
          paths={paths}
        />
      </div>
      <p className="mt-10 text-[13px] font-semibold text-[#af1728]">{copy.tag}</p>
      <h1 className="mt-4 text-[clamp(38px,3.8vw,58px)] font-semibold leading-tight tracking-[-0.04em] text-[#17212b]">
        {copy.title}
      </h1>
      <MediaReveal direction="up" className="relative mt-10 aspect-[16/9] w-full bg-[#eef1f3]">
        <ProductImage
          src={story.image}
          alt={copy.title}
          sizes="(min-width:768px) 768px, 100vw"
          className="object-cover"
        />
      </MediaReveal>
      <p className="mt-10 border-l-2 border-[#af1728] pl-6 text-[19px] leading-9 text-[#53606a]">
        {copy.summary}
      </p>
      <div className="mt-10 text-[16px] leading-8 text-[#53606a]">
        {copy.paragraphs.map((paragraph) => (
          <p key={paragraph} className="mb-5 last:mb-0">
            {paragraph}
          </p>
        ))}
      </div>
      <section className="mt-14 border-t border-[#dce1e5] pt-8">
        <p className="text-[13px] font-semibold text-[#af1728]">
          {zh ? "继续探索" : "Explore further"}
        </p>
        <Link
          href={siteHref(lang, copy.relatedHref)}
          className="motion-arrow mt-5 inline-flex min-h-12 items-center gap-4 bg-[#17212b] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#af1728] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#af1728] motion-reduce:transition-none"
        >
          {copy.relatedLabel}
          <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </article>
  );
}
