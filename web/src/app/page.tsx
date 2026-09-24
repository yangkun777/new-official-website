import Link from "next/link";
import { getSiteSettings, getCategoriesByLevel } from "@/lib/repo";

export default async function Home() {
  const [settings, level1] = await Promise.all([
    getSiteSettings(),
    getCategoriesByLevel(1),
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
          Data is read live from the Directus backend — edit content in the
          admin, this page follows.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {level1.map((c) => (
            <Link
              key={c.id}
              href={`/product/category/${c.slug}`}
              className="group block rounded-xl border border-slate-200 bg-white p-6 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#003f88]/30 hover:shadow-lg"
            >
              <h2 className="text-lg font-semibold text-slate-900 group-hover:text-[#003f88]">
                {c.name}
              </h2>
              {c.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {c.description}
                </p>
              ) : null}
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-700">Quick demo links</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <Link
              href="/product/category/pcb-plug"
              className="font-medium text-[#003f88] hover:underline"
            >
              PCB Plug (series listing, paginated)
            </Link>
            <Link
              href="/product/series/10020003101"
              className="font-medium text-[#003f88] hover:underline"
            >
              9EDGK-5.0 series (variant table)
            </Link>
            <Link
              href="/news"
              className="font-medium text-[#003f88] hover:underline"
            >
              News (EN / 中文, translations demo)
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
