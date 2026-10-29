"use client";

import { useState } from "react";
import { siteHref } from "@/lib/site";
import type { Lang } from "@/lib/lang";

function targetPath(raw: string): string | null {
  const q = raw.trim();
  if (/^\d{6,}$/.test(q)) return `/product/${q}`;
  const lower = q.toLowerCase();
  if (/圆形|预铸/.test(q) || /circular|m12|m8|cordset/.test(lower)) {
    return "/product/category/circular-connectors";
  }
  if (/端子|接线/.test(q) || /terminal|block/.test(lower)) {
    return "/product/category/terminal-blocks";
  }
  return q ? `/products?q=${encodeURIComponent(q)}#catalog` : null;
}

export default function ProductSearch({ lang }: { lang: Lang }) {
  const [hint, setHint] = useState("");
  const zh = lang === "zh";
  const placeholder = zh ? "订货号、系列名称或产品类别" : "Order number, series name or product family";
  const label = zh ? "查找" : "Search";

  return (
    <form
      className="w-full max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const q = String(fd.get("q") ?? "");
        const target = targetPath(q);
        if (target) {
          setHint("");
          window.location.assign(siteHref(lang, target));
        } else {
          setHint(zh ? "请输入订货号、系列名称或产品类别。" : "Enter an order number, series name or product family.");
        }
      }}
    >
      <div className="flex border border-[#e4e4e4] bg-white">
      <label className="sr-only" htmlFor="product-q">
        {placeholder}
      </label>
      <input
        id="product-q"
        name="q"
        type="search"
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-[14px] text-[#161616] outline-none placeholder:text-[#999]"
      />
      <button
        type="submit"
        className="shrink-0 bg-[#161616] px-5 text-[13px] font-medium text-white hover:bg-black"
      >
        {label}
      </button>
      </div>
      {hint && <p className="mt-2 text-[13px] text-[#af1728]" role="status">{hint}</p>}
    </form>
  );
}
