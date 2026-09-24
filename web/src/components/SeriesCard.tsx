import Link from "next/link";
import ProductImage from "./ProductImage";
import type { SeriesListItem } from "@/types/product";

export default function SeriesCard({ series }: { series: SeriesListItem }) {
  return (
    <Link
      href={`/product/series/${series.matecode}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-[#003f88]/30 hover:shadow-lg"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
        <ProductImage
          src={series.image ?? ""}
          alt={series.name}
          sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
        />
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
