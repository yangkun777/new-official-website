import { readFileSync } from 'node:fs';

// 两条经过旧库只读核对的 SKU 样本。仅写本地 Directus；不连接旧库。
const base = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base)) throw new Error('Pilot seed only accepts local Directus');
const token = readFileSync(process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? 'D:/degson-pilot/.admin_token', 'utf8').trim();
const headers = { Authorization: `Bearer ${token}` };
async function request(path, method = 'GET', data) {
  const response = await fetch(`${base}${path}`, { method, headers: { ...headers, ...(data ? { 'Content-Type': 'application/json' } : {}) }, body: data ? JSON.stringify(data) : undefined });
  const body = await response.json();
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(body)}`);
  return body.data;
}
async function existing(collection, field, value) {
  const q = new URLSearchParams({ [`filter[${field}][_eq]`]: String(value), limit: '1', fields: 'id' });
  return (await request(`/items/${collection}?${q}`))[0]?.id ?? null;
}
async function upsert(collection, field, value, data) {
  const id = await existing(collection, field, value);
  return id ?? (await request(`/items/${collection}`, 'POST', data)).id;
}
async function upload(url, filename) {
  const search = new URLSearchParams({ 'filter[filename_download][_eq]': filename, fields: 'id', limit: '1' });
  const prior = (await request(`/files?${search}`))[0];
  if (prior) return prior.id;
  const remote = await fetch(url);
  if (!remote.ok) throw new Error(`Legacy file unavailable: ${remote.status} ${url}`);
  const form = new FormData();
  form.append('file', new Blob([await remote.arrayBuffer()], { type: remote.headers.get('content-type') ?? 'application/octet-stream' }), filename);
  const uploaded = await fetch(`${base}/files`, { method: 'POST', headers, body: form });
  const body = await uploaded.json();
  if (!uploaded.ok) throw new Error(`Upload ${filename}: ${uploaded.status} ${JSON.stringify(body)}`);
  return body.data.id;
}
const samples = [
  { orderNo: '10010012354', legacyId: 5276214, model: '2CDGKRP-5.08', summary: 'Pluggable terminal blocks; rated current 12A; rated voltage (III/2) 320V; pitch 5.08mm; green; tin contact surface.',
    specs: [['Rated current', '12A'], ['Rated voltage (III/2)', '320V'], ['Pitch', '5.08mm'], ['Color', 'Green'], ['Contact surface', 'Tin']],
    certs: [
      { legacyId: 5276299, code: 'UL parameters', rows: [['AWG', '24~12AWG', '24~12AWG', '24~12AWG'], ['Rated current', '15A', '/', '10A'], ['Rated voltage', '300V', '/', '300V'], ['Use group', 'B', 'C', 'D']] },
      { legacyId: 5276300, code: 'VDE parameters', rows: [['Cross section', '0.2~2.5mm²', '0.2~2.5mm²', '0.2~2.5mm²'], ['Rated current', '12A', '12A', '12A'], ['Rated voltage', '250V', '320V', '630V'], ['Overvoltage category/Degree of pollution', 'III/3', 'III/2', 'II/2']] },
    ],
    docs: [
      { legacyId: 5276613, kind: 'datasheet', title: 'Data sheet', filename: '2CDGKRP-5.08-XXP-1Y-00Z(H).pdf', url: 'https://oss.degson.com/upload/file/20260614/20260614100911_11773.pdf' },
      { legacyId: 5276614, kind: 'cad', title: 'CAD data', filename: '2CDGKRP-5.08-XXP-1Y-00Z(H).dxf', url: 'https://oss.degson.com/upload/file/20260614/20260614100852_93116.dxf' },
      { legacyId: 5276615, kind: 'model_3d', title: '3D model', filename: '2CDGKRP-5.08-02P-1Y-00Z(H).stp', url: 'https://oss.degson.com/upload/file/20260614/20260614100833_63575.stp' },
    ] },
  { orderNo: '29010000012', legacyId: 5326353, model: 'PV-DC-MG-CS-2P-150A-6-CNG331(CNE013)', summary: 'For use in photovoltaic equipment; rated current 150A; rated voltage 600V; cable specification 35mm²; protection rating IP66 (mated); TÜV certified.',
    specs: [['Rated current', '150A'], ['Rated voltage', '600V'], ['Cable specification', '35mm²'], ['Protection rating (mated)', 'IP66']],
    certs: [{ legacyId: 5326376, code: 'Technical Specifications', rows: [['Rated current', '150A'], ['Rated voltage', '600V']] }],
    docs: [
      { legacyId: 5326395, kind: 'model_3d', title: '3D model', filename: 'PV-DC-MG-CS-2P-150A-6-CNG331(CNE013).stp', url: 'https://oss.degson.com/upload/image/20260924/29010000012/PV-DC-MG-CS-2P-150A-6-CNG331   (CNE013).stp' },
      { legacyId: 5326396, kind: 'datasheet', title: 'Data sheet', filename: 'PV-DC-MG-CS-2P-150A-6-CNG331(CNE013).pdf', url: 'https://oss.degson.com/upload/image/20260924/29010000012/PV-DC-MG-CS-2P-150A-6-CNG331   (CNE013).pdf' },
    ] },
];
for (const sample of samples) {
  const productId = await upsert('product', 'order_no', sample.orderNo, { order_no: sample.orderNo, title: sample.model, combined_title: `${sample.model}-${sample.orderNo}`, status: 'published' });
  const tq = new URLSearchParams({ 'filter[product_id][_eq]': String(productId), 'filter[language][_eq]': 'en', fields: 'id', limit: '1' });
  if (!(await request(`/items/product_translations?${tq}`)).length) await request('/items/product_translations', 'POST', { product_id: productId, language: 'en', name: sample.model, slug: sample.orderNo, short_description: sample.summary });
  for (const [index, [label, value]] of sample.specs.entries()) {
    const sq = new URLSearchParams({ 'filter[product_id][_eq]': String(productId), 'filter[sort][_eq]': String(index + 1), fields: 'id', limit: '1' });
    const specId = (await request(`/items/product_spec?${sq}`))[0]?.id ?? (await request('/items/product_spec', 'POST', { product_id: productId, kind: 'technical', group_key: 'general', sort: index + 1, status: 'published' })).id;
    const xq = new URLSearchParams({ 'filter[product_spec_id][_eq]': String(specId), 'filter[language][_eq]': 'en', fields: 'id', limit: '1' });
    if (!(await request(`/items/product_spec_translations?${xq}`)).length) await request('/items/product_spec_translations', 'POST', { product_spec_id: specId, language: 'en', group_title: 'Technical data', label, value });
  }
  for (const cert of sample.certs) {
    if (!cert.rows.length) continue;
    const certId = await upsert('product_certification', 'legacy_id', cert.legacyId, { product_id: productId, code: cert.code, legacy_id: cert.legacyId, status: 'published' });
    for (const [index, [label, value_1, value_2, value_3]] of cert.rows.entries()) {
      const rq = new URLSearchParams({ 'filter[certification_id][_eq]': String(certId), 'filter[language][_eq]': 'en', 'filter[sort][_eq]': String(index + 1), fields: 'id', limit: '1' });
      if (!(await request(`/items/product_certification_row?${rq}`)).length) await request('/items/product_certification_row', 'POST', { certification_id: certId, language: 'en', label, value_1, value_2, value_3, sort: index + 1 });
    }
  }
  for (const [index, doc] of sample.docs.entries()) {
    const fileId = await upload(doc.url, doc.filename);
    const data = { product_id: productId, language: 'en', kind: doc.kind, title: doc.title, file_id: fileId, sort: index + 1, status: 'published', legacy_id: doc.legacyId };
    const prior = await existing('product_document', 'legacy_id', doc.legacyId);
    if (prior) await request(`/items/product_document/${prior}`, 'PATCH', data);
    else await request('/items/product_document', 'POST', data);
  }
  if (sample.orderNo === '10010012354') {
    // 旧站关联记录 5276657 的 description=10010002779；PHP 将其按系列码解析。
    const seriesId = await upsert('series', 'matecode', '10010002779', { matecode: '10010002779', status: 'published' });
    const sq = new URLSearchParams({ 'filter[series_id][_eq]': String(seriesId), 'filter[language][_eq]': 'en', fields: 'id', limit: '1' });
    if (!(await request(`/items/series_translations?${sq}`)).length) await request('/items/series_translations', 'POST', { series_id: seriesId, language: 'en', name: '2EDGKRP-5.08', slug: '2EDGKRP-5.08' });
    const rq = new URLSearchParams({ 'filter[product_id][_eq]': String(productId), 'filter[target_series_id][_eq]': String(seriesId), fields: 'id', limit: '1' });
    if (!(await request(`/items/product_relation?${rq}`)).length) await request('/items/product_relation', 'POST', { product_id: productId, target_series_id: seriesId, kind: 'related', status: 'published', legacy_id: 5276657 });
  }
  console.log(`SEEDED ${sample.orderNo} product_id=${productId}`);
}
