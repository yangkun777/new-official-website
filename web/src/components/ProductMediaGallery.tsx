import ProductImage from "./ProductImage";
import type { ProductMedia } from "@/types/product";

interface Props {
  name: string;
  media: ProductMedia[];
  labels: { noImage: string; gallery: string };
}

export default function ProductMediaGallery({ name, media, labels }: Props) {
  const primary = media.find((item) => item.is_primary) ?? media[0] ?? null;
  const rest = media.filter((item) => item.id !== primary?.id);

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white">
        {primary?.url ? (
          <ProductImage
            src={primary.url}
            alt={primary.alt ?? name}
            sizes="(min-width:1024px) 480px, 100vw"
            className="object-contain p-8"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            {labels.noImage}
          </div>
        )}
      </div>
      {rest.length > 0 ? (
        <div className="mt-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {labels.gallery}
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {rest.map((item) => (
              <div key={item.id} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white">
                {item.url ? (
                  <ProductImage
                    src={item.url}
                    alt={item.alt ?? name}
                    sizes="120px"
                    className="object-contain p-2"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
