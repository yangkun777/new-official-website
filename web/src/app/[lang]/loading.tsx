"use client";

import { useParams } from "next/navigation";

export default function Loading() {
  const { lang } = useParams<{ lang: string }>();
  return <section role="status" aria-live="polite" className="mx-auto min-h-[65vh] max-w-[1280px] px-6 py-20 sm:px-10 lg:px-12">
    <p className="flex items-center gap-3 text-sm text-[#68747e]"><span className="route-loading-dot" aria-hidden="true" />{lang === "zh" ? "正在打开页面…" : "Opening page…"}</p>
    <div aria-hidden="true" className="mt-10 space-y-5"><div className="h-9 w-2/3 max-w-[480px] bg-[#eef1f3]" /><div className="h-4 w-1/2 max-w-[320px] bg-[#f5f6f7]" /><div className="mt-12 h-[240px] border-t-2 border-[#af1728] bg-[#f5f6f7]" /></div>
  </section>;
}
