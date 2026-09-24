import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings, getCategoriesByLevel } from "@/lib/repo";
import { toLang, type Lang } from "@/lib/lang";
import { absUrl, hreflangMap, localePath } from "@/lib/site";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const lang = toLang((await params).lang);
  return {
    alternates: {
      canonical: absUrl(localePath(lang, "/")),
      languages: hreflangMap("/"),
    },
  };
}

export default async function Home({ params }: PageProps) {
  const lang: Lang = toLang((await params).lang);

  const [settings, level1] = await Promise.all([
    getSiteSettings(),
    getCategoriesByLevel(1, lang),
  ]);

  const heroTitle = settings?.hero_title ?? "DEGSON";
  const heroSubtitle =
    settings?.hero_subtitle ??
    "Terminal blocks, connectors and industrial components";

  return (
    <>
      <section className="bg-gradient-to-br from-[#003f88] to-[#0056b3] text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {heroTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-blue-50/90">
            {heroSubtitle}
          </p>
        </div>
      </section>

      <section
        id="products"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-[#003f88]">
          Product Categories
        </p>
        <p className="mt-1 text-slate-600">
          数据实时读取自 Directus 后台 —— 在后台改内容，这里跟着变。
        </p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {level1.map((c) => (
            <Link
              key={c.id}
              href={localePath(c.lang, `/product/category/${c.slug}`)}
              className="group block rounded-xl border border-slate-200 bg-white p-6 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#003f88]/30 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-[#003f88]">
                  {c.name}
                </h2>
                {c.lang !== lang ? (
                  <span
                    title="该分类暂无当前语言版本，将打开英文页"
                    className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500"
                  >
                    EN
                  </span>
                ) : null}
              </div>
              {c.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {c.description}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-700">
            多语言演示（en / zh 同源数据）
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            {(["en", "zh"] as const).map((l) => (
              <Link
                key={l}
                href={localePath(l, "/news")}
                className="font-medium text-[#003f88] hover:underline"
              >
                {l === "zh" ? "中文新闻" : "English news"}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
