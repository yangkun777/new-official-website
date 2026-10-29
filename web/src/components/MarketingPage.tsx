import CmsHtml from "@/components/CmsHtml";
import ProductImage from "@/components/ProductImage";
import { serializeJsonLd } from "@/lib/seo";

export interface MarketingPanel {
  image: string | null;
  title: string;
  text: string;
}

export default function MarketingPage({
  title,
  summary,
  body,
  coverImage,
  panels = [],
  jsonLd,
}: {
  title: string;
  summary?: string | null;
  body?: string | null;
  coverImage?: string | null;
  panels?: MarketingPanel[];
  jsonLd?: Record<string, unknown>;
}) {
  return (
    <article>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      ) : null}
      <section className="relative min-h-[280px] overflow-hidden bg-brand text-white sm:min-h-[360px]">
        {coverImage ? (
          <div className="absolute inset-0">
            <ProductImage
              src={coverImage}
              alt=""
              priority
              className="object-cover opacity-45"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand/90 via-brand/70 to-brand/40" />
          </div>
        ) : null}
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-fog/90">
            DEGSON
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h1>
          {summary ? (
            <p className="mt-5 max-w-2xl text-lg text-brand-mist/95">{summary}</p>
          ) : null}
        </div>
      </section>

      {panels.length > 0 ? (
        <section className="border-b border-slate-100 bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
            {panels.map((panel, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative aspect-[16/10] bg-slate-100">
                  {panel.image ? (
                    <ProductImage
                      src={panel.image}
                      alt={panel.title}
                      className="object-cover"
                      sizes="(min-width:768px) 33vw, 100vw"
                    />
                  ) : null}
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {panel.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {panel.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {body ? (
          <CmsHtml
            html={body}
            className="space-y-5 text-base leading-relaxed text-slate-700 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-brand [&_img]:mt-4 [&_img]:max-w-full"
          />
        ) : (
          <p className="text-slate-500">暂无正文内容。</p>
        )}
      </section>
    </article>
  );
}
