/** Non-destructive service page editor migration. Never re-seeds content. */
import { readFileSync } from 'node:fs';

const base = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const token = process.env.DIRECTUS_ADMIN_TOKEN ?? readFileSync(process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? 'D:/degson-pilot/.admin_token', 'utf8').trim();
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
async function api(method, path, body) {
  const response = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(result)}`);
  return result.data;
}
async function field(collection, name) {
  const response = await fetch(`${base}/fields/${collection}/${name}`, { headers });
  if (response.status === 404 || response.status === 403) return null;
  if (!response.ok) throw new Error(`GET ${collection}.${name}: ${response.status}`);
  return (await response.json()).data;
}

const ownerMeta = {
  interface: 'select-dropdown-m2o',
  display: 'related-values',
  display_options: { template: '{{slug}}' },
  options: { template: '{{slug}}' },
  hidden: true,
  note: '页面归属由页面编辑入口维护；普通编辑无需选择 ID。',
  translations: [{ language: 'zh-CN', translation: '所属页面' }],
};
if (!(await field('page_sections', 'site_page_id'))) {
  await api('POST', '/fields/page_sections', { field: 'site_page_id', type: 'integer', schema: { is_nullable: true }, meta: ownerMeta });
} else {
  await api('PATCH', '/fields/page_sections/site_page_id', { meta: ownerMeta });
}
const sectionsMeta = {
  interface: 'list-o2m', special: ['o2m'],
  options: { template: '{{list_title}}', enableCreate: true, enableSelect: false },
  note: '可在这里新建或编辑服务板块，新增板块默认草稿；填写中英文内容后再发布。',
  translations: [{ language: 'zh-CN', translation: '服务页板块' }],
  conditions: [{ rule: { slug: { _neq: 'services' } }, hidden: true }],
  width: 'full', sort: 30,
};
const previewOrigin = (process.env.WEB_PREVIEW_ORIGIN ?? 'http://localhost:3000').replace(/\/$/, '');
const previewMeta = {
  interface: 'presentation-links', special: ['alias', 'no-data'],
  options: { links: [
    { label: '预览中文页面', icon: 'open_in_new', type: 'primary', actionType: 'url', url: `${previewOrigin}/zh/{{slug}}` },
    { label: '预览英文页面', icon: 'open_in_new', type: 'normal', actionType: 'url', url: `${previewOrigin}/en/{{slug}}` },
  ] },
  note: '先保存，再点击对应语言预览；仅预览已发布内容。',
  translations: [{ language: 'zh-CN', translation: '前台预览' }],
  conditions: [{ rule: { slug: { _nin: ['services', 'solutions', 'about'] } }, hidden: true }],
  width: 'full', sort: 11,
};
if (!(await field('site_pages', 'preview_links'))) {
  await api('POST', '/fields/site_pages', { field: 'preview_links', type: 'alias', meta: previewMeta });
} else {
  await api('PATCH', '/fields/site_pages/preview_links', { meta: previewMeta });
}
if (!(await field('site_pages', 'sections'))) {
  await api('POST', '/fields/site_pages', { field: 'sections', type: 'alias', meta: sectionsMeta });
} else {
  await api('PATCH', '/fields/site_pages/sections', { meta: sectionsMeta });
}
const relations = await api('GET', '/relations?limit=-1');
if (!relations.some((item) => item.collection === 'page_sections' && item.field === 'site_page_id')) {
  await api('POST', '/relations', {
    collection: 'page_sections', field: 'site_page_id', related_collection: 'site_pages',
    meta: { many_collection: 'page_sections', many_field: 'site_page_id', one_collection: 'site_pages', one_field: 'sections', one_deselect_action: 'nullify' },
    schema: { on_delete: 'SET NULL' },
  });
}
const statusField = await field('page_sections', 'status');
if (statusField?.schema?.default_value !== 'draft') {
  await api('PATCH', '/fields/page_sections/status', { schema: { default_value: 'draft' } });
}
const pages = await api('GET', '/items/site_pages?filter[slug][_eq]=services&fields=id,slug&limit=1');
const service = pages[0];
if (!service) throw new Error('缺少 services 页面');
for (const [slug, title] of [['home', '首页'], ['news', '新闻列表']]) {
  const matching = await api('GET', `/items/site_pages?filter[slug][_eq]=${slug}&fields=id,list_title&limit=1`);
  if (matching[0] && !matching[0].list_title) {
    await api('PATCH', `/items/site_pages/${matching[0].id}`, { list_title: title });
  }
}
const rows = await api('GET', '/items/page_sections?filter[page_slug][_eq]=services&fields=id,site_page_id&limit=-1');
let changed = 0;
for (const row of rows) {
  if (row.site_page_id == null) {
    await api('PATCH', `/items/page_sections/${row.id}`, { site_page_id: service.id });
    changed += 1;
  } else if (Number(row.site_page_id) !== Number(service.id)) {
    throw new Error(`板块 ${row.id} 页面归属冲突，请人工检查`);
  }
}
console.log(`服务页编辑关系已就绪；${rows.length} 条板块，补关联 ${changed} 条`);
