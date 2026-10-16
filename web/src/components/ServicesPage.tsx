import ProductImage from "@/components/ProductImage";
import type { PageSectionView } from "@/lib/repo";

function Blocks({ text }: { text: string | null }) {
  if (!text?.trim()) return null;
  return (
    <div className="space-y-3 text-[15px] leading-7 text-slate-700">
      {text
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => (
          <p key={p}>{p}</p>
        ))}
    </div>
  );
}

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
          <dt className="text-3xl font-semibold tracking-tight text-[#003f88]">
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
          <div className="mt-6 space-y-4">
            <Blocks text={section.intro1} />
            <Blocks text={section.intro2} />
          </div>
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

export default function ServicesPage({
  title,
  summary,
  coverImage,
  sections,
}: {
  title: string;
  summary?: string | null;
  coverImage?: string | null;
  sections: PageSectionView[];
}) {
  const nav = sections.flatMap((section) => [
    { id: section.id, title: section.title, nested: false },
    ...section.children.map((child) => ({
      id: child.id,
      title: child.title,
      nested: true,
    })),
  ]);

  return (
    <article>
      <section className="relative min-h-[280px] overflow-hidden bg-[#003f88] text-white sm:min-h-[360px]">
        {coverImage ? (
          <div className="absolute inset-0">
            <ProductImage
              src={coverImage}
              alt=""
              priority
              className="object-cover opacity-45"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#003f88]/90 via-[#003f88]/70 to-[#003f88]/40" />
          </div>
        ) : null}
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-medium text-blue-100/90">DEGSON / 高松</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h1>
          {summary ? (
            <p className="mt-5 max-w-2xl text-lg text-blue-50/95">{summary}</p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8 lg:py-16">
        <nav aria-label={title} className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-sm font-semibold text-slate-900">板块</p>
          <ul className="mt-4 space-y-1 border-l border-slate-200">
            {nav.map((item) => (
              <li key={item.id}>
                <a
                  href={`#section-${item.id}`}
                  className={
                    item.nested
                      ? "block py-1.5 pl-6 text-sm text-slate-600 hover:text-[#003f88]"
                      : "block py-1.5 pl-3 text-sm font-medium text-slate-800 hover:text-[#003f88]"
                  }
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-16">
          {sections.length ? (
            sections.map((section) => (
              <SectionBlock key={section.id} section={section} />
            ))
          ) : (
            <p className="text-slate-500">暂无板块内容。</p>
          )}
        </div>
      </div>
    </article>
  );
}
