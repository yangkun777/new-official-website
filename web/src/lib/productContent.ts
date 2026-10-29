import { apiGetList } from './directus';
import { productPublicSlug } from './productSlug';
import { CONTENT_TAGS } from './cacheTags';
import type { Lang } from './lang';

interface Translation { language: string; group_title?: string | null; label?: string | null; value?: string | null; unit?: string | null }
interface SpecRow { id: number; kind: string; group_key: string | null; sort: number | null; translations: Translation[] }
interface CertRow { language: string; label: string | null; value_1: string | null; value_2: string | null; value_3: string | null; sort: number | null }
interface Certification { id: number; code: string | null; logo_file_id: string | null; sort: number | null; rows: CertRow[] }
interface DocumentRow { id: number; language: string | null; kind: string; title: string | null; file_id: { id: string; filename_download: string | null; type: string | null } | null; sort: number | null }
interface RelationRow { id: number; kind: string; sort: number | null; target_product_id: { order_no: string; title: string | null; status: string; translations: Array<{ language: string; name: string | null }> } | null; target_series_id: { matecode: string; status: string; translations: Array<{ language: string; name: string | null; slug: string | null }> } | null }

export interface ProductContent {
  specs: Array<{ id: number; kind: string; group: string; label: string; value: string }>;
  certifications: Array<{ id: number; code: string; logoFileId: string | null; rows: Array<{ label: string; values: string[] }> }>;
  documents: Array<{ id: number; kind: string; title: string; filename: string; fileId: string }>;
  relations: Array<{ id: number; kind: string; name: string; href: string }>;
}

export async function getProductContent(productId: number, lang: Lang): Promise<ProductContent> {
  const filter = { 'filter[product_id][_eq]': String(productId), 'filter[status][_eq]': 'published', limit: '100', sort: 'sort,id' };
  const [specs, certs, docs, relations] = await Promise.all([
    apiGetList<SpecRow>('/items/product_spec', { ...filter, fields: 'id,kind,group_key,sort,translations.language,translations.group_title,translations.label,translations.value,translations.unit' }, CONTENT_TAGS.product),
    apiGetList<Certification>('/items/product_certification', { ...filter, fields: 'id,code,logo_file_id,sort,rows.language,rows.label,rows.value_1,rows.value_2,rows.value_3,rows.sort' }, CONTENT_TAGS.product),
    apiGetList<DocumentRow>('/items/product_document', { ...filter, fields: 'id,language,kind,title,file_id.id,file_id.filename_download,file_id.type' }, CONTENT_TAGS.product),
    apiGetList<RelationRow>('/items/product_relation', { ...filter, fields: 'id,kind,sort,target_product_id.order_no,target_product_id.title,target_product_id.status,target_product_id.translations.language,target_product_id.translations.name,target_series_id.matecode,target_series_id.status,target_series_id.translations.language,target_series_id.translations.name,target_series_id.translations.slug' }, CONTENT_TAGS.product),
  ]);
  const pick = <T extends { language: string }>(items: T[]) => items.find((item) => item.language === lang) ?? items.find((item) => item.language === 'en');
  return {
    specs: specs.items.flatMap((item) => {
      const t = pick(item.translations ?? []);
      if (!t?.label || !t.value) return [];
      return [{ id: item.id, kind: item.kind, group: t.group_title || '', label: t.label, value: `${t.value}${t.unit ? ` ${t.unit}` : ''}` }];
    }),
    certifications: certs.items.flatMap((item) => {
      const sourceRows = (item.rows ?? []).some((row) => row.language === lang) ? (item.rows ?? []).filter((row) => row.language === lang) : (item.rows ?? []).filter((row) => row.language === 'en');
      const rows = sourceRows.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)).map((row) => ({ label: row.label ?? '', values: [row.value_1, row.value_2, row.value_3].filter((value): value is string => Boolean(value)) })).filter((row) => row.label && row.values.length);
      return rows.length || item.logo_file_id ? [{ id: item.id, code: item.code || '', logoFileId: item.logo_file_id, rows }] : [];
    }),
    documents: docs.items.flatMap((item) => item.file_id && (!item.language || item.language === lang) ? [{ id: item.id, kind: item.kind, title: item.title || item.file_id.filename_download || item.kind, filename: item.file_id.filename_download || item.title || '', fileId: item.file_id.id }] : []),
    relations: relations.items.flatMap((item) => {
      const target = item.target_product_id;
      if (target?.status === 'published') {
        const name = pick(target.translations ?? [])?.name || target.title || target.order_no;
        return [{ id: item.id, kind: item.kind, name, href: `/${lang}/product/${encodeURIComponent(productPublicSlug(name, target.order_no))}` }];
      }
      const series = item.target_series_id;
      if (series?.status === 'published') {
        const translation = pick(series.translations ?? []);
        return [{ id: item.id, kind: item.kind, name: translation?.name || series.matecode, href: `/${lang}/product/series/${encodeURIComponent(translation?.slug || series.matecode)}` }];
      }
      return [];
    }),
  };
}
