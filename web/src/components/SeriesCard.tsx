import Link from "next/link";
import ProductImage from "./ProductImage";
import { catalogImage } from "@/lib/catalogAssets";
import type { SeriesListItem } from "@/types/product";
import type { Lang } from "@/lib/lang";
import { siteHref } from "@/lib/site";
import { seriesPublicPath } from "@/lib/productPaths";

export default function SeriesCard({
  series,
  pageLang,
}: {
  series: SeriesListItem;
  pageLang: Lang;
}) {
  return (
    <Link
      href={siteHref(series.lang, seriesPublicPath(series))}
      className="motion-card group block overflow-hidden border border-[#dce1e5] bg-white hover:border-[#af1728] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#af1728]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[#f3f5f6]">
        <ProductImage
          src={catalogImage(series.image) ?? ""}
          alt=""
          sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
          className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.03] group-focus-visible:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
        />
        {series.lang !== pageLang ? (
          <span
            title={pageLang === "zh" ? "该系列暂无当前语言版本，将打开英文页" : "This series is available in English"}
            className="absolute right-3 top-3 bg-white/90 px-2 py-1 text-[11px] font-semibold text-[#53606a]"
          >
            EN
          </span>
        ) : null}
      </div>
      <div className="border-t border-[#dce1e5] px-5 py-5">
        <h2 className="text-[18px] font-semibold text-[#17212b] transition-colors duration-200 group-hover:text-[#af1728] group-focus-visible:text-[#af1728] motion-reduce:transition-none">
          {series.name}
        </h2>
        {series.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#68747e]">
            {series.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
