import { productDetailSlug } from "./productSlug";
import { seriesPublicSlug } from "./seriesSlug";
import type { CategoryPathNode, ProductDetail, Series, SeriesListItem } from "@/types/product";

function segments(slugs: string[]): string {
  return slugs.filter(Boolean).map((slug) => encodeURIComponent(slug)).join("/");
}

export function categoryPublicPath(categoryPath: CategoryPathNode[]): string | null {
  const path = segments(categoryPath.map((item) => item.slug));
  return path ? `/products/${path}` : null;
}

export function seriesPublicPath(series: Pick<Series | SeriesListItem, "slug" | "matecode" | "categoryPath">): string {
  const category = segments(series.categoryPath.map((item) => item.slug));
  const slug = encodeURIComponent(seriesPublicSlug(series));
  return category ? `/products/${category}/${slug}` : `/product/series/${slug}`;
}

export function productPublicPath(product: ProductDetail): string {
  const slug = encodeURIComponent(productDetailSlug(product));
  if (!product.series?.categoryPath.length || product.series.lang !== product.lang) return `/product/${slug}`;
  return `${seriesPublicPath(product.series)}/${slug}`;
}

