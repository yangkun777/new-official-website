import type { Lang } from "@/lib/lang";
import { sanitizeRichText } from "@/lib/contentSafety";
import type { ProductDetail as ProductDetailModel } from "@/types/product";

interface Props {
  product: ProductDetailModel;
  lang: Lang;
}

export default function ProductDetail({ product, lang }: Props) {
  const zh = lang === "zh";
  const labels = zh
    ? { orderNo: "订货号", model: "型号", poles: "极数", pitch: "节距", description: "产品说明" }
    : { orderNo: "Order No.", model: "Model", poles: "Poles", pitch: "Pitch", description: "Description" };
  const rows = [
    [labels.orderNo, product.order_no],
    [labels.model, product.title],
    [labels.poles, product.poles],
    [labels.pitch, product.pitch],
  ].filter(([, value]) => value);

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
        {product.h1 ?? product.name}
      </h1>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        <dl className="divide-y divide-slate-100">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[minmax(8rem,30%)_1fr] gap-4 px-4 py-3 text-sm odd:bg-slate-50">
              <dt className="font-medium text-slate-500">{label}</dt>
              <dd className="text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {product.short_description || product.description ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-slate-900">{labels.description}</h2>
          {product.short_description ? <p className="mt-3 text-slate-600">{product.short_description}</p> : null}
          {product.description ? (
            <div className="prose prose-slate mt-4 max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeRichText(product.description) }} />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
