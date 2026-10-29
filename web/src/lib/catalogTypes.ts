import type { SeriesListItem } from "@/types/product";

export type CatalogSeries = SeriesListItem & { categorySlug: string; categoryName: string };
export type CatalogGroup = { slug: string; name: string };

/** Only extract values explicitly present in the source description. */
export function seriesFacts(description: string | null) {
  return {
    current: description?.match(/rated\s*current\s*[:：]?\s*([\d.]+)\s*A/i)?.[1] ?? null,
    pitch: description?.match(/pitch\s*[:：]?\s*([\d.]+)\s*mm/i)?.[1] ?? null,
  };
}
