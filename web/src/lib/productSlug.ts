import type { ProductDetail } from "@/types/product";

/** Make a readable, language-independent product URL while keeping SKU uniqueness. */
export function productPublicSlug(model: string | null | undefined, orderNo: string): string {
  let readable = (model ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
  const sku = orderNo.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (readable === sku) readable = "";
  else if (readable.endsWith(`-${sku}`)) readable = readable.slice(0, -(sku.length + 1));
  return `${readable || "product"}-${sku}`;
}

export function productDetailSlug(product: Pick<ProductDetail, "combined_title" | "title" | "name" | "order_no">): string {
  return productPublicSlug(product.combined_title || product.title || product.name, product.order_no);
}

/** Product order numbers are numeric in the current catalog; accept the legacy URL too. */
export function productOrderNoFromSlug(slug: string): string | null {
  const legacy = /^\d{6,}$/.exec(slug);
  if (legacy) return legacy[0];
  const match = /-([0-9]{6,})$/.exec(slug);
  return match?.[1] ?? null;
}
