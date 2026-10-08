import Link from "next/link";
import { DEFAULT_LANG } from "@/lib/lang";
import { siteUrl } from "@/lib/site";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wider text-[#003f88]">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-3 text-slate-600">
        该页面不存在，或对应内容尚未发布 / 暂无该语言版本。
      </p>
      <Link
        href={siteUrl(DEFAULT_LANG, "/")}
        className="mt-6 font-medium text-[#003f88] hover:underline"
      >
        ← Back to home
      </Link>
    </section>
  );
}
