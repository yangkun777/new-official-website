import type { Metadata } from "next";
import { getNewsList } from "@/lib/repo";
import { toLang, type Lang } from "@/lib/lang";
import { absUrl, hreflangMap, localePath } from "@/lib/site";
import NewsCard from "@/components/NewsCard";
import LangSwitcher from "@/components/LangSwitcher";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const lang = toLang((await params).lang);
  const isZh = lang === "zh";
  return {
    title: isZh ? "新闻动态" : "News",
    description: isZh
      ? "德昌最新动态与产品资讯。"
      : "Latest updates and product news from DEGSON.",
    alternates: {
      canonical: absUrl(localePath(lang, "/news")),
      languages: hreflangMap("/news"),
    },
  };
}

export default async function NewsPage({ params }: PageProps) {
  const lang: Lang = toLang((await params).lang);
  const isZh = lang === "zh";
  const news = await getNewsList(lang);

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-10 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isZh ? "新闻动态" : "News"}
            </h1>
            <p className="mt-2 text-slate-600">
              {isZh
                ? "德昌最新动态与产品资讯。"
                : "Latest updates and product news from DEGSON."}
            </p>
          </div>
          <LangSwitcher lang={lang} path="/news" />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {news.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
              <NewsCard key={n.id} news={n} pageLang={lang} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
            {isZh ? "暂无新闻。" : "No news yet."}
          </div>
        )}
      </section>
    </>
  );
}
