import CmsHtml from "@/components/CmsHtml";
import ProductImage from "@/components/ProductImage";
import type { PageSectionView } from "@/lib/repo";

function Stats({
  section,
}: {
  section: PageSectionView;
}) {
  const items = [
    { value: section.stat1, label: section.stat1Label },
    { value: section.stat2, label: section.stat2Label },
  ].filter((item) => item.value || item.label);
  if (!items.length) return null;
  return (
    <dl className="mt-8 grid grid-cols-2 gap-px bg-slate-200 sm:max-w-md">
      {items.map((item) => (
        <div key={`${item.value}-${item.label}`} className="bg-white px-4 py-5">
          <dt className="text-3xl font-semibold tracking-tight text-brand">
            {item.value}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-600">{item.label}</dd>
        </div>
      ))}
    </dl>
  );
}

function SectionBlock({
  section,
  nested = false,
}: {
  section: PageSectionView;
  nested?: boolean;
}) {
  const heading = nested ? (
    <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
      {section.title}
    </h3>
  ) : (
    <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
      {section.title}
    </h2>
  );

  return (
    <article
      id={`section-${section.id}`}
      className={nested ? "scroll-mt-28 border-t border-slate-200 pt-10" : "scroll-mt-28"}
    >
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,420px)]">
        <div>
          {heading}
          {section.intro ? (
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-700">
              {section.intro}
            </p>
          ) : null}
          <Stats section={section} />
          <CmsHtml
            html={section.intro1}
            className="mt-6 max-w-2xl space-y-3 text-[15px] leading-7 text-slate-700 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-brand [&_img]:mt-3 [&_img]:max-w-full"
          />
          <CmsHtml
            html={section.intro2}
            className="mt-4 max-w-2xl space-y-3 text-[15px] leading-7 text-slate-700 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-brand [&_img]:mt-3 [&_img]:max-w-full"
          />
        </div>
        {section.image ? (
          <div className="relative aspect-[498/280] overflow-hidden bg-slate-100">
            <ProductImage
              src={section.image}
              alt={section.title}
              className="object-cover"
              sizes="(min-width:1024px) 420px, 100vw"
            />
          </div>
        ) : null}
      </div>
      {section.children.length > 0 ? (
        <div className="mt-12 space-y-12">
          {section.children.map((child) => (
            <SectionBlock key={child.id} section={child} nested />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function PageSectionList({ sections }: { sections: PageSectionView[] }) {
  if (!sections.length) return null;
  return (
    <div className="mx-auto max-w-5xl space-y-16 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      {sections.map((section) => (
        <SectionBlock key={section.id} section={section} />
      ))}
    </div>
  );
}

export default function ServicesPage({
  title,
  summary,
  body,
  coverImage,
  sections,
}: {
  title: string;
  summary?: string | null;
  body?: string | null;
  coverImage?: string | null;
  sections: PageSectionView[];
}) {
  return (
    <article>
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
          <p className="text-sm font-medium text-brand-fog/90">DEGSON / 高松</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h1>
          {summary ? (
            <p className="mt-5 max-w-2xl text-lg text-brand-mist/95">{summary}</p>
          ) : null}
        </div>
      </section>

      {body ? (
        <section className="mx-auto max-w-5xl px-4 pt-12 sm:px-6 lg:px-8">
          <CmsHtml
            html={body}
            className="max-w-3xl space-y-4 text-base leading-relaxed text-slate-700 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-brand [&_img]:mt-4 [&_img]:max-w-full"
          />
        </section>
      ) : null}

      {sections.length ? (
        <PageSectionList sections={sections} />
      ) : body ? null : (
        <p className="mx-auto max-w-5xl px-4 py-12 text-slate-500 sm:px-6 lg:px-8">
          暂无板块内容。
        </p>
      )}
    </article>
  );
}
