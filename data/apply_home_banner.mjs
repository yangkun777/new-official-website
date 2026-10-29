/** Idempotent Directus model + seed for homepage banners. Does not change the Next demo homepage. */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BANNERS } from './home_banner_scenes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'admin@degson.dev';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || 'degson1234';

const LANG_CHOICES = [
  { text: '英文 en', value: 'en' },
  { text: '中文 zh', value: 'zh' },
];
const STATUS_CHOICES = [
  { text: '已发布', value: 'published' },
  { text: '草稿（前台不显示）', value: 'draft' },
];
const LINK_CHOICES = [
  { text: '圆形连接器分类', value: '/product/category/circular-connectors' },
  { text: '接线端子分类', value: '/product/category/terminal-blocks' },
  { text: '产品中心', value: '/products' },
  { text: '行业解决方案', value: '/solutions' },
  { text: '服务与支持', value: '/services' },
  { text: '关于我们', value: '/about' },
  { text: '新闻', value: '/news' },
  { text: '外部链接（填下方网址）', value: 'external' },
];
async function api(method, path, token, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function getToken() {
  const tokenFile = process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? join(ROOT, '.admin_token');
  if (existsSync(tokenFile)) {
    const t = readFileSync(tokenFile, 'utf8').trim();
    if (t) {
      const probe = await api('GET', '/users/me', t);
      if (probe.status === 200) return t;
    }
  }
  const login = await api('POST', '/auth/login', null, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (login.status !== 200) throw new Error(`login ${login.status}`);
  return login.json.data.access_token;
}

async function ensureCollection(token, name, meta) {
  const all = await api('GET', '/collections', token);
  const exists = (all.json?.data || []).some(item => item.collection === name);
  const r = exists
    ? await api('PATCH', `/collections/${name}`, token, { meta })
    : await api('POST', '/collections', token, { collection: name, meta, schema: {} });
  if (r.status < 200 || r.status >= 300) throw new Error(`${name} ${r.status} ${JSON.stringify(r.json).slice(0, 400)}`);
}

async function ensureField(token, collection, field, type, schema = {}, meta = {}) {
  const exists = await api('GET', `/fields/${collection}/${field}`, token);
  if (exists.status === 200) {
    const r = await api('PATCH', `/fields/${collection}/${field}`, token, { meta, ...(schema.is_nullable === false ? { schema: { is_nullable: false } } : {}) });
    if (r.status < 200 || r.status >= 300) console.warn(`~ ${collection}.${field} ${r.status}`);
    return;
  }
  const r = await api('POST', `/fields/${collection}`, token, { field, type, schema: { is_nullable: true, ...schema }, meta });
  if (r.status < 200 || r.status >= 300) throw new Error(`${collection}.${field} ${r.status} ${JSON.stringify(r.json).slice(0, 300)}`);
}

async function ensureRelation(token, payload) {
  const list = await api('GET', '/relations?limit=-1', token);
  if ((list.json?.data || []).some(item => item.collection === payload.collection && item.field === payload.field)) return;
  const r = await api('POST', '/relations', token, payload);
  if (r.status < 200 || r.status >= 300) throw new Error(`relation ${payload.field} ${r.status} ${JSON.stringify(r.json).slice(0, 300)}`);
}

async function ensurePermission(token, policyId, collection) {
  const perms = await api('GET', `/permissions?limit=-1&filter[policy][_eq]=${policyId}&filter[collection][_eq]=${collection}&filter[action][_eq]=read`, token);
  if ((perms.json?.data || []).length) return;
  await api('POST', '/permissions', token, { policy: policyId, collection, action: 'read', fields: ['*'], permissions: {}, validation: {}, presets: {} });
}

const token = await getToken();
await ensureCollection(token, 'home_banner', {
  icon: 'view_carousel',
  group: 'content_management',
  hidden: false,
  sort: 6,
  display_template: '{{label}}',
  archive_field: 'status',
  archive_value: 'draft',
  unarchive_value: 'published',
  note: '首页轮播读取这里已发布且本语言内容完整的 Banner。每条记录维护中英文；保存发布后，前台缓存刷新后显示。',
  translations: [{ language: 'zh-CN', translation: '首页 Banner' }],
});
await ensureField(token, 'home_banner', 'key', 'string', { max_length: 64, is_unique: true }, {
  hidden: true, readonly: true, note: '系统内部键，勿改', translations: [{ language: 'zh-CN', translation: '内部键' }],
});
await ensureField(token, 'home_banner', 'label', 'string', { max_length: 128 }, {
  required: true, interface: 'input', width: 'half', note: '只给后台列表辨认，不显示在前台', translations: [{ language: 'zh-CN', translation: '后台备注名' }],
});
await ensureField(token, 'home_banner', 'sort', 'integer', { default_value: 0 }, {
  interface: 'input', width: 'half', note: '数字越小越靠前', translations: [{ language: 'zh-CN', translation: '显示顺序' }],
});
await ensureField(token, 'home_banner', 'status', 'string', { max_length: 16, default_value: 'published' }, {
  interface: 'select-dropdown', options: { choices: STATUS_CHOICES }, width: 'half', note: '整体发布状态。某一语言不想展示，把该语言翻译设为草稿。', translations: [{ language: 'zh-CN', translation: '状态' }],
});
await ensureField(token, 'home_banner', 'link_path', 'string', { max_length: 128 }, {
  interface: 'select-dropdown', options: { choices: LINK_CHOICES }, width: 'half', required: true, note: '优先选站内页面。不要手填旧站网址；外部地址选「外部链接」再填网址。', translations: [{ language: 'zh-CN', translation: '跳转目标' }],
});
await ensureField(token, 'home_banner', 'link_url', 'string', { max_length: 512 }, {
  interface: 'input', width: 'half', note: '仅当跳转目标为「外部链接」时填写完整 https 地址。', translations: [{ language: 'zh-CN', translation: '外部网址' }],
  conditions: [{ name: 'hide-unless-external', rule: { _and: [{ link_path: { _neq: 'external' } }] }, hidden: true }],
});
await ensureField(token, 'home_banner', 'image', 'string', { max_length: 512 }, {
  interface: 'product-media-editor', display: 'image', width: 'full', note: '各语言共用图。某语言要单独换图，填翻译行里的「本语言图片」。还没有图片时这里为空。', translations: [{ language: 'zh-CN', translation: '共用图片' }],
});

await ensureCollection(token, 'home_banner_translations', {
  icon: 'translate', group: 'content_management', hidden: true, sort: 6,
  translations: [{ language: 'zh-CN', translation: '首页 Banner 翻译' }],
});
await ensureField(token, 'home_banner_translations', 'home_banner_id', 'integer', {}, {
  interface: 'select-dropdown-m2o', options: { template: '{{label}}' }, translations: [{ language: 'zh-CN', translation: '所属 Banner' }],
});
await ensureField(token, 'home_banner_translations', 'language', 'string', { max_length: 8, is_nullable: false }, {
  required: true, interface: 'select-dropdown', options: { choices: LANG_CHOICES }, width: 'half', note: '只选英文 en 或中文 zh，不要填「中文」两个字。', translations: [{ language: 'zh-CN', translation: '语言' }],
});
await ensureField(token, 'home_banner_translations', 'status', 'string', { max_length: 16, default_value: 'published' }, {
  interface: 'select-dropdown', options: { choices: STATUS_CHOICES }, width: 'half', note: '该语言未完成或不要展示时选草稿。不要用另一语言文案顶上。', translations: [{ language: 'zh-CN', translation: '本语言状态' }],
});
await ensureField(token, 'home_banner_translations', 'tag', 'string', { max_length: 64 }, {
  interface: 'input', width: 'half', note: '首屏短标签，例如「高松 · 工业连接」。', translations: [{ language: 'zh-CN', translation: '短标签' }],
});
await ensureField(token, 'home_banner_translations', 'title', 'string', { max_length: 255 }, {
  required: true, interface: 'input', note: '该语言标题。', translations: [{ language: 'zh-CN', translation: '标题' }],
});
await ensureField(token, 'home_banner_translations', 'text', 'text', {}, {
  interface: 'input-multiline', note: '该语言简介，不要贴 HTML。', translations: [{ language: 'zh-CN', translation: '简介' }],
});
await ensureField(token, 'home_banner_translations', 'cta', 'string', { max_length: 64 }, {
  interface: 'input', width: 'half', note: '按钮文字，例如「探索圆形连接器」。', translations: [{ language: 'zh-CN', translation: '按钮文字' }],
});
await ensureField(token, 'home_banner_translations', 'image', 'string', { max_length: 512 }, {
  interface: 'product-media-editor', display: 'image', width: 'full', note: '本语言图片。留空则用 Banner 上的共用图。', translations: [{ language: 'zh-CN', translation: '本语言图片' }],
});

const alias = await api('GET', '/fields/home_banner/translations', token);
const aliasMeta = {
  interface: 'list-o2m', special: ['o2m'],
  options: { enableCreate: true, enableSelect: false, template: '{{language}} · {{title}}' },
  note: '点开「中文 zh」或「英文 en」改标题、简介和按钮。不要用 Directus 原生翻译页签。',
  translations: [{ language: 'zh-CN', translation: '中英文内容' }],
};
if (alias.status === 200) await api('PATCH', '/fields/home_banner/translations', token, { meta: aliasMeta });
else {
  const r = await api('POST', '/fields/home_banner', token, { field: 'translations', type: 'alias', meta: aliasMeta });
  if (r.status < 200 || r.status >= 300) throw new Error(`translations alias ${r.status}`);
}
await ensureRelation(token, {
  collection: 'home_banner_translations', field: 'home_banner_id', related_collection: 'home_banner',
  meta: { many_collection: 'home_banner_translations', many_field: 'home_banner_id', one_collection: 'home_banner', one_field: 'translations', one_deselect_action: 'nullify' },
  schema: { on_delete: 'CASCADE' },
});

for (const banner of BANNERS) {
  const found = await api('GET', `/items/home_banner?filter[key][_eq]=${encodeURIComponent(banner.key)}&fields=id&limit=1`, token);
  if (found.status !== 200) throw new Error(`读取 Banner ${banner.key} 失败：${found.status}`);
  let id = found.json?.data?.[0]?.id;
  const payload = { key: banner.key, label: banner.label, sort: banner.sort, status: 'published', image: banner.image, link_path: banner.link_path, link_url: null };
  if (!id) {
    const created = await api('POST', '/items/home_banner', token, payload);
    if (created.status < 200 || created.status >= 300) throw new Error(`banner ${banner.key} ${JSON.stringify(created.json).slice(0, 300)}`);
    id = created.json.data.id;
  } else {
    console.log(`= 保留现有 Banner 内容 ${banner.key}`);
  }
  for (const lang of ['en', 'zh']) {
    const src = banner[lang];
    const list = await api('GET', `/items/home_banner_translations?filter[home_banner_id][_eq]=${id}&filter[language][_eq]=${lang}&fields=id&limit=1`, token);
    if (list.status !== 200) throw new Error(`读取 Banner 翻译 ${banner.key}/${lang} 失败：${list.status}`);
    const row = { home_banner_id: id, language: lang, status: 'published', tag: src.tag, title: src.title, text: src.text, cta: src.cta, image: null };
    const tid = list.json?.data?.[0]?.id;
    if (!tid) {
      const r = await api('POST', '/items/home_banner_translations', token, row);
      if (r.status < 200 || r.status >= 300) throw new Error(`tr ${banner.key} ${lang} ${JSON.stringify(r.json).slice(0, 300)}`);
    } else console.log(`= 保留现有 Banner 翻译 ${banner.key}/${lang}`);
  }
}

const policies = await api('GET', '/policies?limit=-1', token);
const webPolicy = (policies.json?.data || []).find(item => item.name === 'web-read' || item.name === 'Web Read');
if (webPolicy?.id) {
  await ensurePermission(token, webPolicy.id, 'home_banner');
  await ensurePermission(token, webPolicy.id, 'home_banner_translations');
}

console.log('PASS home_banner schema; missing defaults created and existing editorial content preserved');
