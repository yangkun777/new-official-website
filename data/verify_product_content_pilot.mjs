import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const token = readFileSync(process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? 'D:/degson-pilot/.admin_token', 'utf8').trim();
async function get(path) {
  const response = await fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  assert.ok(response.ok, `GET ${path}: ${response.status}`);
  return (await response.json()).data;
}

const required = {
  product_spec: ['product_id', 'kind', 'group_key', 'sort', 'status', 'translations'],
  product_spec_translations: ['product_spec_id', 'language', 'group_title', 'label', 'value', 'unit'],
  product_certification: ['product_id', 'code', 'sort', 'status', 'rows'],
  product_certification_row: ['certification_id', 'language', 'label', 'value_1', 'value_2', 'value_3', 'sort'],
  product_document: ['product_id', 'language', 'kind', 'title', 'file_id', 'sort', 'status'],
  product_relation: ['product_id', 'target_product_id', 'target_series_id', 'kind', 'sort', 'status'],
};
const collections = new Set((await get('/collections')).map((row) => row.collection));
for (const [collection, names] of Object.entries(required)) {
  assert.ok(collections.has(collection), `missing collection ${collection}`);
  const fields = new Map((await get(`/fields/${collection}`)).map((row) => [row.field, row]));
  for (const name of names) assert.ok(fields.has(name), `missing ${collection}.${name}`);
}
const productFields = new Map((await get('/fields/product')).map((row) => [row.field, row]));
for (const [alias, group] of [
  ['specifications', 'product_technical_group'],
  ['certifications', 'product_certification_group'],
  ['documents', 'product_document_group'],
  ['related_products', 'product_relation_group'],
]) {
  assert.equal(productFields.get(alias)?.meta?.group, group, `${alias} editor group`);
  assert.equal(productFields.get(group)?.meta?.interface, 'group-accordion', `${group} visible accordion`);
  assert.deepEqual(productFields.get(group)?.meta?.special, ['alias', 'group', 'no-data'], `${group} alias flags`);
}
for (const [collection, field] of [
  ['product_spec', 'kind'], ['product_document', 'kind'],
  ['product_document', 'language'], ['product_relation', 'kind'],
  ['product_spec_translations', 'language'], ['product_certification_row', 'language'],
]) {
  const item = await get(`/fields/${collection}/${field}`);
  assert.equal(item.meta?.interface, 'select-dropdown', `${collection}.${field} dropdown`);
}
for (const [collection, field, template] of [
  ['product_document', 'file_id', null],
  ['product_relation', 'target_product_id', '{{order_no}}'],
  ['product_relation', 'target_series_id', '{{matecode}}'],
]) {
  const item = await get(`/fields/${collection}/${field}`);
  assert.ok(item.meta?.interface && item.meta.interface !== 'input', `${collection}.${field} selector`);
  if (template) assert.equal(item.meta?.options?.template, template, `${collection}.${field} selector template`);
}
assert.equal(productFields.get('specifications')?.meta?.options?.template, '{{translations.label}}', 'spec list uses labels not kind codes');
assert.equal(productFields.get('related_products')?.meta?.options?.template, '{{target_series_id.matecode}} {{target_product_id.order_no}}', 'relation list hides kind codes');
assert.equal(productFields.get('documents')?.meta?.options?.template, '{{title}}', 'document list uses title');
assert.equal(productFields.get('certifications')?.meta?.options?.template, '{{code}}', 'cert list uses code');
for (const collection of ['product_spec', 'product_certification', 'product_certification_row', 'product_document', 'product_relation']) {
  const item = await get(`/fields/${collection}/legacy_id`);
  assert.equal(item.meta?.hidden, true, `${collection}.legacy_id hidden`);
}
assert.equal(productFields.get('specifications')?.meta?.options?.template, '{{translations.label}}', 'spec list template');
assert.equal(productFields.get('related_products')?.meta?.options?.template, '{{target_series_id.matecode}} {{target_product_id.order_no}}', 'relation list template');
for (const key of ['product_spec.legacy_id', 'product_certification.legacy_id', 'product_document.legacy_id', 'product_relation.legacy_id', 'product_certification_row.legacy_id']) {
  const [collection, field] = key.split('.');
  const item = await get(`/fields/${collection}/${field}`);
  assert.equal(item.meta?.hidden, true, `${key} hidden from operators`);
}
const relationKeys = new Set((await get('/relations')).map((row) => `${row.collection}.${row.field}->${row.related_collection}`));
for (const key of [
  'product_spec.product_id->product',
  'product_spec_translations.product_spec_id->product_spec',
  'product_certification.product_id->product',
  'product_certification_row.certification_id->product_certification',
  'product_document.product_id->product',
  'product_document.file_id->directus_files',
  'product_relation.product_id->product',
  'product_relation.target_product_id->product',
  'product_relation.target_series_id->series',
]) assert.ok(relationKeys.has(key), `missing relation ${key}`);
console.log('PASS product content pilot schema and editor metadata');
