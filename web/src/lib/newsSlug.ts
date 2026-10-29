/** 后台未填 slug 时，列表会链到 /news/（当前列表页），看起来像点不进去、也没有报错。 */

export function newsPublicSlug(
  slug: string | null | undefined,
  newsId: number
): string {
  const trimmed = (slug ?? "").trim();
  return trimmed || `news-${newsId}`;
}

export function newsIdFromPublicSlug(slug: string): number | null {
  const match = /^news-(\d+)$/.exec(slug.trim());
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}
