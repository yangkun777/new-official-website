import Link from "next/link";
import ProductImage from "./ProductImage";
import type { NewsListItem } from "@/types/news";
import type { Lang } from "@/lib/lang";
import { siteUrl } from "@/lib/site";

export default function NewsCard({
  news,
  pageLang,
}: {
  news: NewsListItem;
  pageLang: Lang;
}) {
  return (
    <Link
      href={siteUrl(news.lang, `/news/${news.slug}`)}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-[#003f88]/30 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-50">
        <ProductImage
          src={news.cover_image ?? ""}
          alt={news.title}
          sizes="(min-width:1024px) 33vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {news.lang !== pageLang ? (
          <span
            title="该文章暂无当前语言版本，将打开英文页"
            className="absolute right-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500"
          >
            EN
          </span>
        ) : null}
      </div>
      <div className="p-4">
        {news.publish_date ? (
          <p className="text-xs text-slate-400">{news.publish_date}</p>
        ) : null}
        <h2 className="mt-1 text-lg font-semibold text-slate-900 group-hover:text-[#003f88]">
          {news.title}
        </h2>
        {news.summary ? (
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {news.summary}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
