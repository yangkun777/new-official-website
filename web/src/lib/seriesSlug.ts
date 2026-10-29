import type { Series, SeriesListItem } from "@/types/product";

export function seriesPublicSlug(series: Pick<Series | SeriesListItem, "slug" | "matecode">): string {
  const stored = series.slug?.trim();
  if (stored && stored !== series.matecode) return stored;
  // If CMS has no slug, keep the matecode route so the fallback remains resolvable.
  return series.matecode;
}
