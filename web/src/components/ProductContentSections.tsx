import Link from 'next/link';
import type { Lang } from '@/lib/lang';
import type { ProductContent } from '@/lib/productContent';
import ProductContentNavigation from '@/components/ProductContentNavigation';

export default function ProductContentSections({ content, lang, orderNo }: { content: ProductContent; lang: Lang; orderNo: string }) {
  const zh = lang === 'zh';
  const technical = content.specs.filter((item) => item.kind !== 'additional');
  const accessories = content.specs.filter((item) => item.kind === 'additional');
  const documentKind: Record<string, string> = zh
    ? { datasheet: '数据表', cad: 'CAD 图纸', model_3d: '3D 模型', other: '其他' }
    : { datasheet: 'Data sheet', cad: 'CAD drawing', model_3d: '3D model', other: 'Other' };
  const nav = [
    [technical.length > 0, 'specifications', zh ? '技术参数' : 'Specifications'],
    [accessories.length > 0, 'accessories', zh ? '产品附件' : 'Accessories'],
    [content.certifications.length > 0, 'certifications', zh ? '认证' : 'Certifications'],
    [content.documents.length > 0, 'downloads', zh ? '资料下载' : 'Downloads'],
    [content.relations.length > 0, 'related', zh ? '配套与相关产品' : 'Related products'],
  ] as const;
  if (!nav.some(([visible]) => visible)) return null;
  const section = 'scroll-mt-52 border-t border-[#dce1e5] py-12 lg:scroll-mt-40';
  const heading = 'mb-7 text-[clamp(25px,2.3vw,34px)] font-semibold text-[#17212b]';
  return <div className="bg-white"><div className="mx-auto max-w-[1280px] px-6 pb-20 sm:px-10 lg:px-12">
    <ProductContentNavigation label={zh ? '产品资料导航' : 'Product content navigation'} items={nav.filter(([visible]) => visible).map(([, id, label]) => ({ id, label }))} />
    {technical.length > 0 && <section id="specifications" className={section}>
      <h2 className={heading}>{zh ? '技术参数' : 'Specifications'}</h2>
      <dl className="overflow-hidden border border-[#dce1e5]">
        {technical.map((item) => <div key={item.id} className="product-data-row grid gap-1 border-b border-slate-200 px-4 py-3 last:border-0 sm:grid-cols-[minmax(12rem,35%)_1fr] sm:gap-5"><dt className="text-sm text-slate-600">{item.group ? `${item.group} · ` : ''}{item.label}</dt><dd className="text-sm font-medium text-slate-900">{item.value}</dd></div>)}
      </dl>
    </section>}
    {accessories.length > 0 && <section id="accessories" className={section}><h2 className={heading}>{zh ? '产品附件' : 'Accessories'}</h2><dl className="overflow-hidden border border-[#dce1e5]">{accessories.map((item) => <div key={item.id} className="product-data-row grid gap-1 border-b border-slate-200 px-4 py-3 last:border-0 sm:grid-cols-[minmax(12rem,35%)_1fr] sm:gap-5"><dt className="text-sm text-slate-600">{item.label}</dt><dd className="text-sm font-medium text-slate-900">{item.value}</dd></div>)}</dl></section>}
    {content.certifications.length > 0 && <section id="certifications" className={section}>
      <h2 className={heading}>{zh ? '认证' : 'Certifications'}</h2>
      <div className="grid gap-5 lg:grid-cols-2">{content.certifications.map((cert) => <article key={cert.id} className="border border-[#dce1e5] p-6">
        {cert.logoFileId && <img src={`/api/product-certification/${encodeURIComponent(orderNo)}/${cert.logoFileId}`} alt={cert.code} className="mb-4 max-h-16 max-w-40 object-contain" />}
        <h3 className="mb-3 font-semibold text-slate-900">{cert.code}</h3>
        {cert.rows.length > 0 && <dl>{cert.rows.map((row, index) => <div key={index} className="grid gap-1 border-t border-slate-100 py-2 text-sm sm:grid-cols-2"><dt className="text-slate-600">{row.label}</dt><dd className={`grid gap-2 text-slate-900 ${row.values.length > 1 ? 'grid-cols-3' : ''}`}>{row.values.map((value, valueIndex) => <span key={valueIndex} className={valueIndex > 0 ? 'border-l border-slate-100 pl-2' : ''}>{value}</span>)}</dd></div>)}</dl>}
      </article>)}</div>
    </section>}
    {content.documents.length > 0 && <section id="downloads" className={section}>
      <h2 className={heading}>{zh ? '资料下载' : 'Downloads'}</h2>
      <ul className="divide-y divide-[#dce1e5] border border-[#dce1e5]">{content.documents.map((doc) => <li key={doc.id} className="product-download-row flex flex-wrap items-center justify-between gap-3 px-4 py-4"><div><span className="mr-3 bg-[#f5f6f7] px-2 py-1 text-xs text-[#53606a]">{documentKind[doc.kind] ?? doc.kind}</span><span className="font-medium text-[#17212b]">{doc.title}</span><p className="mt-1 break-all text-xs text-[#68747e]">{doc.filename}</p></div><a href={`/api/product-document/${encodeURIComponent(orderNo)}/${doc.fileId}`} className="motion-arrow motion-arrow-down inline-flex items-center gap-2 text-sm font-semibold text-[#17212b] underline decoration-[#af1728] underline-offset-4 hover:text-[#af1728] focus-visible:text-[#af1728]" download>{zh ? '下载' : 'Download'} <span aria-hidden="true">↓</span></a></li>)}</ul>
    </section>}
    {content.relations.length > 0 && <section id="related" className={section}>
      <h2 className={heading}>{zh ? '配套与相关产品' : 'Related products'}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{content.relations.map((item) => <Link key={item.id} href={item.href} className="product-related-card motion-arrow flex items-center justify-between gap-3 border border-[#dce1e5] p-5 font-medium text-[#17212b]">{item.name}<span aria-hidden="true">↗</span></Link>)}</div>
    </section>}
  </div></div>;
}
