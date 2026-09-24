import Link from "next/link";
import ProductImage from "./ProductImage";
import type { SeriesListItem } from "@/types/product";
import type { Lang } from "@/lib/lang";
import { localePath } from "@/lib/site";

export default function SeriesCard({
  series,
  pageLang,
}: {
  series: SeriesListItem;
  pageLang: Lang;
}) {
  return (
    <Link
      href={localePath(series.lang, `/product/series/${series.matecode}`)}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-[#003f88]/30 hover:shadow-lg"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
        <ProductImage
          src={series.image ?? ""}
          alt={series.name}
          sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
        />
        {series.lang !== pageLang ? (
          <span
            title="该系列暂无当前语言版本，将打开英文页"
            className="absolute right-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500"
          >
            EN
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <h2 className="text-base font-semibold text-slate-900 group-hover:text-[#003f88]">
          {series.name}
        </h2>
        {series.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {series.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
