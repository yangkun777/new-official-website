import Link from "next/link";
import type { Lang } from "@/lib/lang";
import { siteHref } from "@/lib/site";
import { seriesPublicPath } from "@/lib/productPaths";
import { sanitizeRichText } from "@/lib/contentSafety";
import type { ProductDetail as ProductDetailModel } from "@/types/product";
import type { ProductContent } from "@/lib/productContent";

interface Props {
  product: ProductDetailModel;
  lang: Lang;
  contactEmail?: string | null;
  specs?: ProductContent["specs"];
}

export default function ProductDetail({ product, lang, contactEmail, specs = [] }: Props) {
  const zh = lang === "zh";
  const quickFacts = specs.length ? specs.filter(spec => spec.kind !== "additional").slice(0, 4).map(spec => [spec.label, spec.value]) : [
    [zh ? "型号" : "Model", product.title],
    [zh ? "极数" : "Poles", product.poles],
  ].filter(([, value]) => value);
  const email = contactEmail?.trim();
  const inquiryHref = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? `mailto:${email}?subject=${encodeURIComponent(`DEGSON ${product.order_no}`)}`
    : null;

  return (
    <div className="lg:py-3">
      <p className="text-[13px] font-semibold text-[#af1728]">
        {zh ? "产品详情" : "Product details"}
      </p>
      <h1 className="mt-5 text-[clamp(38px,3.8vw,58px)] font-semibold leading-tight tracking-[-0.04em] text-[#17212b]">
        {product.h1 ?? product.name}
      </h1>
      <p className="mt-6 inline-flex border-l-2 border-[#af1728] bg-white px-4 py-3 text-sm font-medium text-[#53606a]">
        {zh ? "订货号" : "Order No."} <span className="ml-2 font-semibold text-slate-900">{product.order_no}</span>
      </p>
      {product.short_description ? (
        <p className="mt-6 max-w-2xl text-base leading-8 text-[#53606a]">{product.short_description}</p>
      ) : null}
      {quickFacts.length > 0 ? (
        <dl className="mt-8 grid max-w-lg grid-cols-2 gap-px border border-[#dce1e5] bg-[#dce1e5]">
          {quickFacts.map(([label, value]) => (
            <div key={label} className="product-quick-fact bg-white px-4 py-4">
              <dt className="text-xs font-medium tracking-wide text-slate-500">{label}</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="mt-8 border-t border-slate-200 pt-7">
        <p className="text-sm leading-6 text-slate-600">
          {zh
            ? "咨询时请提供订货号、应用场景及所需参数。"
            : "Include the order number, application and required ratings in your inquiry."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {inquiryHref ? (
            <a href={inquiryHref} className="motion-arrow inline-flex min-h-12 items-center gap-5 bg-[#17212b] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#af1728] focus-visible:bg-[#af1728]">
              {zh ? "邮件咨询此产品" : "Ask about this product"}
              <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <Link href={siteHref(lang, "/services")} className="motion-arrow inline-flex min-h-12 items-center gap-5 bg-[#17212b] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#af1728] focus-visible:bg-[#af1728]">
              {zh ? "查看服务支持" : "Explore services"}
              <span aria-hidden="true">↗</span>
            </Link>
          )}
          <Link href={siteHref(lang, "/products")} className="motion-arrow inline-flex min-h-12 items-center gap-5 border border-[#17212b] bg-white px-6 text-sm font-semibold text-[#17212b] transition-colors hover:border-[#af1728] hover:text-[#af1728] focus-visible:border-[#af1728] focus-visible:text-[#af1728]">
            {zh ? "返回产品中心" : "Back to product center"}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ProductTechnicalDetails({ product, lang }: Pick<Props, "product" | "lang">) {
  const zh = lang === "zh";
  const rows = [
    [zh ? "订货号" : "Order No.", product.order_no],
    [zh ? "型号" : "Model", product.title],
    [zh ? "极数" : "Poles", product.poles],
  ].filter(([, value]) => value);

  return (
    <section id="technical-details" className="border-t border-[#dce1e5] bg-white">
      <div className="mx-auto max-w-[1280px] px-6 py-16 sm:px-10 lg:px-12 lg:py-24">
        <div className="border-b border-slate-200 pb-6">
          <p className="text-[13px] font-semibold text-[#af1728]">
            {zh ? "产品资料" : "Product information"}
          </p>
          <h2 className="mt-4 text-[clamp(29px,2.7vw,40px)] font-semibold text-[#17212b]">
            {zh ? "技术信息与产品说明" : "Technical information and description"}
          </h2>
        </div>
        <div className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:gap-16">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {zh ? "已提供的参数" : "Available specifications"}
            </h3>
            <dl className="mt-4 border-t border-slate-200">
              {rows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[minmax(8rem,36%)_1fr] gap-4 border-b border-slate-200 py-4 text-sm">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {zh ? "产品说明" : "Product description"}
            </h3>
            {product.description ? (
              <div className="prose prose-slate mt-4 max-w-none text-sm leading-7" dangerouslySetInnerHTML={{ __html: sanitizeRichText(product.description) }} />
            ) : product.short_description ? (
              <p className="mt-4 text-sm leading-7 text-slate-700">{product.short_description}</p>
            ) : (
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {zh ? "如需进一步的技术资料，请提供订货号与应用要求。" : "For more technical information, provide the order number and your application requirements."}
              </p>
            )}
            {product.series ? (
              <div className="mt-8 border-l-2 border-[#af1728] bg-[#f5f6f7] px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {zh ? "所属系列" : "Product series"}
                </p>
                <Link href={siteHref(product.series.lang, seriesPublicPath(product.series))} className="mt-2 inline-flex text-base font-semibold text-[#17212b] hover:text-[#af1728] hover:underline">
                  {product.series.name} →
                </Link>
                <p className="mt-1 text-xs text-slate-500">
                  {zh ? "查看系列介绍及其他型号" : "See the series and other variants"}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
