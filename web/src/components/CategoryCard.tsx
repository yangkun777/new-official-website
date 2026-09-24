import Link from "next/link";
import ProductImage from "./ProductImage";
import type { SubCategoryCard } from "@/types/product";

export default function CategoryCard({ category }: { category: SubCategoryCard }) {
  return (
    <Link
      href={`/product/category/${category.slug}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-[#003f88]/30 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
        <ProductImage
          src={category.image ?? ""}
          alt={category.name}
          sizes="(min-width:1024px) 33vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-slate-900 group-hover:text-[#003f88]">
          {category.name}
        </h2>
        {category.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {category.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
