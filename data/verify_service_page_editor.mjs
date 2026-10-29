import { readFileSync } from 'node:fs';

const base = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const token = process.env.DIRECTUS_ADMIN_TOKEN ?? readFileSync(process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? 'D:/degson-pilot/.admin_token', 'utf8').trim();
async function get(path) {
  const response = await fetch(base + path, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`${path}: ${response.status} ${await response.text()}`);
  return (await response.json()).data;
}
const failures = [];
const page = (await get('/items/site_pages?filter[slug][_eq]=services&fields=id,slug&limit=1'))[0];
if (!page) throw new Error('缺少 services 页面');
const sectionField = await get('/fields/site_pages/sections').catch(() => null);
if (sectionField?.meta?.interface !== 'list-o2m') failures.push('site_pages.sections.interface');
if (sectionField?.meta?.options?.enableCreate !== true) failures.push('site_pages.sections.create');
if (sectionField?.meta?.conditions?.[0]?.rule?.slug?._neq !== 'services') failures.push('site_pages.sections.visibility');
const previewField = await get('/fields/site_pages/preview_links').catch(() => null);
if (previewField?.meta?.interface !== 'presentation-links') failures.push('site_pages.preview_links.interface');
if (previewField?.meta?.options?.links?.length !== 2) failures.push('site_pages.preview_links.languages');
if (!previewField?.meta?.conditions?.[0]?.hidden) failures.push('site_pages.preview_links.visibility');
const ownerField = await get('/fields/page_sections/site_page_id').catch(() => null);
if (ownerField?.meta?.interface !== 'select-dropdown-m2o') failures.push('page_sections.site_page_id.interface');
const statusField = await get('/fields/page_sections/status');
if (statusField?.schema?.default_value !== 'draft') failures.push('page_sections.status.default_draft');
const pageSlugField = await get('/fields/page_sections/page_slug');
if (pageSlugField?.schema?.default_value !== 'services') failures.push('page_sections.page_slug.default_services');
const relation = (await get('/relations?limit=-1')).find((item) => item.collection === 'page_sections' && item.field === 'site_page_id');
if (relation?.meta?.one_field !== 'sections') failures.push('page_sections.site_page_id.relation');
const rows = await get('/items/page_sections?filter[page_slug][_eq]=services&fields=id,code,site_page_id,translations.language&limit=-1');
if (rows.some((row) => Number(row.site_page_id) !== Number(page.id))) failures.push('service_sections.owner');
if (rows.some((row) => !row.translations?.length)) failures.push('service_sections.translations');
if (failures.length) {
  console.error(`FAIL ${failures.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`PASS 服务页 ${page.id}，关联板块 ${rows.length} 条`);
}
