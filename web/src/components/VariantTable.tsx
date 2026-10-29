"use client";

import { useId, useState } from "react";
import { siteHref } from "@/lib/site";
import { productPublicSlug } from "@/lib/productSlug";
import type { Lang } from "@/lib/lang";
import type { Variant } from "@/types/product";

function cell(value: string | null | undefined): string {
  return value && value.trim() !== "" ? value : "—";
}

export default function VariantTable({ variants, lang, seriesPath }: { variants: Variant[]; lang: Lang; seriesPath: string }) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const filtered = variants.filter(variant => `${variant.title ?? ""} ${variant.order_no ?? ""} ${variant.poles ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  if (variants.length === 0) {
    return (
      <div className="border border-[#dce1e5] bg-[#f5f6f7] p-6 text-sm text-[#68747e]">
        {lang === "zh" ? "当前系列暂无型号资料。" : "Variant information is being recorded."}
      </div>
    );
  }

  return (
    <div><div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex min-h-12 w-full max-w-[440px] border border-[#cbd2d7] bg-white px-4 focus-within:border-[#af1728]"><label htmlFor={inputId} className="sr-only">{lang === "zh" ? "筛选型号与订货号" : "Filter variants and order numbers"}</label><input id={inputId} value={query} onChange={event => setQuery(event.target.value)} placeholder={lang === "zh" ? "输入型号、订货号或极数" : "Model, order number or pole count"} className="min-w-0 flex-1 py-3 text-sm outline-none" /></div><p role="status" className="text-xs text-[#68747e]">{lang === "zh" ? `${filtered.length} / ${variants.length} 个型号` : `${filtered.length} / ${variants.length} variants`}</p></div><div className="max-h-[620px] overflow-auto border border-[#dce1e5]" role="region" aria-label={lang === "zh" ? "产品型号表，可滚动查看" : "Product variants, scroll to explore"} tabIndex={0}>
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-[#17212b] text-white">
          <tr>
            <th scope="col" className="px-5 py-4 text-left font-semibold">{lang === "zh" ? "型号" : "Model"}</th>
            <th scope="col" className="px-5 py-4 text-left font-semibold">{lang === "zh" ? "极数" : "Poles"}</th>
            <th scope="col" className="px-5 py-4 text-left font-semibold">{lang === "zh" ? "订货号" : "Order No."}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#dce1e5]">
          {filtered.map((v) => (
            <tr key={v.id} className="product-variant-row odd:bg-white even:bg-[#f5f6f7]">
              <td className="px-5 py-4 font-medium text-[#17212b]">{cell(v.title)}</td>
              <td className="px-5 py-4 text-[#53606a]">{cell(v.poles)}</td>
              <td className="px-5 py-4 font-mono text-[#17212b]">{v.order_no ? <a href={siteHref(lang, `${seriesPath}/${productPublicSlug(v.title, v.order_no)}`)} className="motion-arrow whitespace-nowrap font-semibold text-[#af1728]">{v.order_no}<span className="ml-3 inline-block" aria-hidden="true">↗</span></a> : "—"}</td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={3} className="px-5 py-10 text-sm text-[#68747e]">{lang === "zh" ? "没有匹配的型号，请尝试其他关键词。" : "No matching variants. Try another keyword."}</td></tr>}
        </tbody>
      </table>
    </div></div>
  );
}
