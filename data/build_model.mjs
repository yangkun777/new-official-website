/**
 * DEGSON 底座建模脚本（Directus 11）
 *
 * 目的：把 §6 数据模型注册进 Directus，使后台可编辑、可导出快照、可重建。
 * 特性：幂等（已存在的集合/字段跳过），出错即报并继续。
 *
 * 用法：
 *   node data/build_model.mjs
 * 前置：Directus 11 已在 8055 运行，且 .admin_token 有效
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const BASE = process.env.DIRECTUS_URL || 'http://localhost:8055';
const TOKEN = readFileSync(
  process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? join(ROOT, '.admin_token'),
  'utf8',
).trim();

let ok = 0, skip = 0, fail = 0;
const failures = [];

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { status: res.status, json };
}

/** 建集合（不含字段） */
async function ensureCollection(name, note) {
  const all = await api('GET', '/collections');
  const exists = (all.json?.data || []).some((c) => c.collection === name);
  if (exists) { console.log(`  = 集合 ${name} 已存在，跳过`); skip++; return true; }
  const r = await api('POST', '/collections', {
    collection: name,
    meta: { note, sort: ok + 1 },
    schema: {},
  });
  if (r.status >= 200 && r.status < 300) { console.log(`  + 集合 ${name}`); ok++; return true; }
  console.log(`  ✗ 集合 ${name} 失败 ${r.status}: ${JSON.stringify(r.json).slice(0, 260)}`);
  fail++; failures.push(`collection:${name}`);
  return false;
}

/** 建字段 */
async function ensureField(collection, field, type, schema = {}, meta = {}) {
  const r = await api('POST', `/fields/${collection}`, {
    field, type,
    meta: { ...meta },
    schema: { ...schema },
  });
  if (r.status >= 200 && r.status < 300) { console.log(`      + ${field} (${type})`); ok++; return true; }
  // 已存在
  if (r.status === 400 && JSON.stringify(r.json).includes('already exists')) { skip++; return true; }
  console.log(`      ✗ ${collection}.${field} 失败 ${r.status}: ${JSON.stringify(r.json).slice(0, 220)}`);
  fail++; failures.push(`field:${collection}.${field}`);
  return false;
}

/** 建 M2O 关系；可选在父表建 O2M 别名（translations），使翻译行可被遍历 */
async function ensureRelation(collection, field, related, oneField = null, onDelete = 'SET NULL') {
  const r = await api('POST', '/relations', {
    collection, field, related_collection: related,
    meta: { many_collection: collection, many_field: field, one_collection: related, one_field: oneField, one_deselect_action: 'nullify' },
    schema: { on_delete: onDelete },
  });
  if (r.status >= 200 && r.status < 300) { console.log(`      ↔ 关系 ${collection}.${field} → ${related}${oneField ? `  (O2M 别名: ${oneField})` : ''}`); ok++; return true; }
  if (r.status === 400 && /already/i.test(JSON.stringify(r.json))) {
    if (!oneField) {
      console.log(`      = 关系已存在 ${collection}.${field} → ${related}`);
      skip++;
      return true;
    }
    const existing = await api('GET', '/relations');
    const match = (existing.json?.data || []).find(
      (item) => item.collection === collection && item.field === field && item.related_collection === related,
    );
    if (match?.meta?.one_field === oneField) {
      console.log(`      = 关系已存在且包含 O2M 别名 ${related}.${oneField}`);
      skip++;
      return true;
    }
    // Directus 11.17.4 的 PATCH /relations 路径可能导致服务崩溃。
    // 已存在关系只报告状态；别名不一致必须通过 snapshot/受控重建修复。
    if (oneField && JSON.stringify(r.json).includes(oneField)) {
      console.log(`      = 关系已存在且包含 O2M 别名 ${related}.${oneField}`);
      skip++; return true;
    }
    console.log(`      ✗ 关系已存在但无法确认 O2M 别名；请导出 snapshot 后人工修复 ${related}.${oneField}`);
    fail++; failures.push(`o2m:${related}.${oneField}`);
    return false;
  }
  console.log(`      ✗ 关系 ${collection}.${field} 失败 ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
  fail++; failures.push(`rel:${collection}.${field}`);
  return false;
}

const TS_CREATED = { interface: 'datetime', readonly: true, special: ['date-created'], width: 'half' };
const TS_UPDATED = { interface: 'datetime', readonly: true, special: ['date-updated'], width: 'half' };
const RICH = { interface: 'input-rich-text-html' };
const FILE = { interface: 'file' };

/** 翻译表统一字段模板（★ 四个翻译集合完全一致，运营心智只有一套） */
async function buildTranslation(collection, parentCollection, parentField, note) {
  console.log(`\n### ${collection}`);
  if (!await ensureCollection(collection, note)) return;
  await ensureField(collection, 'language', 'string', { max_length: 8, is_nullable: false }, { required: true });
  await ensureField(collection, parentField, 'integer', { is_nullable: false }, { required: true });
  await ensureField(collection, 'name', 'string', { max_length: 255, is_nullable: true });
  await ensureField(collection, 'slug', 'string', { max_length: 160, is_nullable: true });
  await ensureField(collection, 'seo_title', 'string', { max_length: 255, is_nullable: true });
  await ensureField(collection, 'seo_description', 'text', { is_nullable: true });
  await ensureField(collection, 'h1', 'string', { max_length: 255, is_nullable: true });
  await ensureField(collection, 'short_description', 'text', { is_nullable: true });
  await ensureField(collection, 'description', 'text', { is_nullable: true }, RICH);
  await ensureField(collection, 'created_at', 'timestamp', { is_nullable: true }, TS_CREATED);
  await ensureField(collection, 'updated_at', 'timestamp', { is_nullable: true }, TS_UPDATED);
  // ★ O2M 别名 translations：让翻译行在 REST/GraphQL 可遍历，也是 Directus「语言页签」的前提
  await ensureRelation(collection, parentField, parentCollection, 'translations', 'CASCADE');
}

console.log('=== DEGSON 底座建模（Directus 11）===');
console.log('BASE =', BASE);

// ---------- 1. category ----------
console.log('\n### category');
if (await ensureCollection('category', '产品分类（一级/二级/三级；名称等可翻译字段在 category_translations）')) {
  await ensureField('category', 'level', 'integer', { is_nullable: true });
  await ensureField('category', 'parent_id', 'integer', { is_nullable: true });
  await ensureField('category', 'image', 'string', { max_length: 512, is_nullable: true });
  await ensureField('category', 'sort', 'integer', { is_nullable: true, default_value: 0 });
  await ensureField('category', 'status', 'string', { max_length: 16, is_nullable: true, default_value: 'published' });
  await ensureField('category', 'created_at', 'timestamp', { is_nullable: true }, TS_CREATED);
  await ensureField('category', 'updated_at', 'timestamp', { is_nullable: true }, TS_UPDATED);
  await ensureRelation('category', 'parent_id', 'category', null, 'SET NULL');
  await ensureFieldMeta('category', 'image', {
    interface: 'product-media-editor',
    note: '分类图片：支持大图预览、上传、替换和清除；兼容历史图片地址',
    width: 'full',
  });
}

// ---------- 2. series ----------
console.log('\n### series');
if (await ensureCollection('series', '产品系列（matecode = 系列码，语言无关）')) {
  await ensureField('series', 'matecode', 'string', { max_length: 32, is_nullable: false, is_unique: true, is_indexed: true }, { required: true });
  await ensureFieldSchema('series', 'matecode', { is_unique: true, is_indexed: true });
  await ensureField('series', 'category_id', 'integer', { is_nullable: true });
  await ensureField('series', 'image', 'string', { max_length: 512, is_nullable: true });
  await ensureField('series', 'sort', 'integer', { is_nullable: true, default_value: 0 });
  await ensureField('series', 'status', 'string', { max_length: 16, is_nullable: true, default_value: 'published' });
  await ensureField('series', 'created_at', 'timestamp', { is_nullable: true }, TS_CREATED);
  await ensureField('series', 'updated_at', 'timestamp', { is_nullable: true }, TS_UPDATED);
  await ensureRelation('series', 'category_id', 'category', null, 'SET NULL');
}

// ---------- 3. product ----------
console.log('\n### product');
if (await ensureCollection('product', '产品变体（order_no = 订货号，全库唯一；语言无关字段）')) {
  await ensureField('product', 'title', 'string', { max_length: 255, is_nullable: true }, { note: '型号，语言无关（如 15EDGK-3.5）' });
  await ensureField('product', 'order_no', 'string', { max_length: 64, is_nullable: false, is_unique: true, is_indexed: true }, { required: true });
  await ensureFieldSchema('product', 'order_no', { is_unique: true, is_indexed: true });
  await ensureField('product', 'series_id', 'integer', { is_nullable: true });
  await ensureField('product', 'poles', 'string', { max_length: 16, is_nullable: true });
  await ensureField('product', 'pitch', 'string', { max_length: 16, is_nullable: true });
  await ensureField('product', 'combined_title', 'string', { max_length: 255, is_nullable: true });
  await ensureField('product', 'status', 'string', { max_length: 16, is_nullable: true, default_value: 'published' });
  await ensureField('product', 'created_at', 'timestamp', { is_nullable: true }, TS_CREATED);
  await ensureField('product', 'updated_at', 'timestamp', { is_nullable: true }, TS_UPDATED);
  await ensureRelation('product', 'series_id', 'series', null, 'CASCADE');
  await ensureFieldMeta('product', 'title', { translations: [{ language: 'zh-CN', translation: '型号' }] });
  await ensureFieldMeta('product', 'poles', { translations: [{ language: 'zh-CN', translation: '极数' }] });
  await ensureFieldMeta('product', 'pitch', { translations: [{ language: 'zh-CN', translation: '节距' }] });
  await ensureFieldMeta('product', 'combined_title', { translations: [{ language: 'zh-CN', translation: '组合标题' }] });
  await ensureFieldMeta('product', 'translations', { translations: [{ language: 'zh-CN', translation: '多语言内容' }] });
}

/** 建反向 O2M 别名字段；Directus 不会自动从 relation meta 创建它。 */
async function ensureAliasField(collection, field, note) {
  const r = await api('POST', `/fields/${collection}`, {
    field,
    type: 'alias',
    meta: {
      special: ['o2m'],
      interface: 'list-o2m',
      options: { template: '{{kind}}', enableCreate: true, enableSelect: true },
      display: 'related-values',
      display_options: { template: '{{kind}} — {{sort}}' },
      note,
    },
  });
  if (r.status >= 200 && r.status < 300) { console.log(`      + ${field} (O2M alias)`); ok++; return true; }
  if (r.status === 400 && /already/i.test(JSON.stringify(r.json))) { skip++; return true; }
  console.log(`      ✗ ${collection}.${field} 别名失败 ${r.status}: ${JSON.stringify(r.json).slice(0, 220)}`);
  fail++; failures.push(`alias:${collection}.${field}`);
  return false;
}

/** 补齐已有字段的约束元数据；历史建模可能已创建字段但没有索引。 */
async function ensureFieldSchema(collection, field, schema) {
  const current = await api('GET', `/fields/${collection}/${field}`);
  const currentSchema = current.json?.data?.schema ?? {};
  const needsPatch = Object.entries(schema).some(([key, value]) => currentSchema[key] !== value);
  if (!needsPatch) { skip++; return true; }
  const r = await api('PATCH', `/fields/${collection}/${field}`, { schema });
  if (r.status >= 200 && r.status < 300) {
    console.log(`      ↻ ${collection}.${field} 约束已补齐`);
    ok++;
    return true;
  }
  console.log(`      ✗ ${collection}.${field} 约束失败 ${r.status}: ${JSON.stringify(r.json).slice(0, 220)}`);
  fail++; failures.push(`schema:${collection}.${field}`);
  return false;
}

/** 补齐已有字段的后台编辑器元数据；字段已存在时，POST 不会更新 meta。 */
async function ensureFieldMeta(collection, field, meta) {
  const current = await api('GET', `/fields/${collection}/${field}`);
  if (current.status < 200 || current.status >= 300) {
    console.log(`      ✗ ${collection}.${field} 元数据读取失败 ${current.status}`);
    fail++; failures.push(`meta-read:${collection}.${field}`);
    return false;
  }
  const currentMeta = current.json?.data?.meta ?? {};
  const needsPatch = Object.entries(meta).some(([key, value]) =>
    JSON.stringify(currentMeta[key]) !== JSON.stringify(value),
  );
  if (!needsPatch) { skip++; return true; }
  const r = await api('PATCH', `/fields/${collection}/${field}`, { meta });
  if (r.status >= 200 && r.status < 300) {
    console.log(`      ↻ ${collection}.${field} 后台编辑器已补齐`);
    ok++;
    return true;
  }
  console.log(`      ✗ ${collection}.${field} 后台编辑器失败 ${r.status}: ${JSON.stringify(r.json).slice(0, 220)}`);
  fail++; failures.push(`meta:${collection}.${field}`);
  return false;
}

// ---------- 3.1 product media ----------
console.log('\n### media');
if (await ensureCollection('media', '统一媒体元数据（文件本体保存在 Directus 文件库）')) {
  await ensureField('media', 'file_id', 'string', { max_length: 36, is_nullable: true }, { ...FILE });
  await ensureField('media', 'kind', 'string', { max_length: 32, is_nullable: false }, { required: true, note: 'product_main/product_detail 等用途' });
  await ensureField('media', 'language', 'string', { max_length: 8, is_nullable: true }, { note: '为空表示语言无关' });
  await ensureField('media', 'alt', 'string', { max_length: 255, is_nullable: true });
  await ensureField('media', 'caption', 'text', { is_nullable: true });
  await ensureField('media', 'sort', 'integer', { is_nullable: true, default_value: 0 });
  await ensureField('media', 'status', 'string', { max_length: 16, is_nullable: true, default_value: 'published' });
  await ensureField('media', 'created_at', 'timestamp', { is_nullable: true }, TS_CREATED);
  await ensureField('media', 'updated_at', 'timestamp', { is_nullable: true }, TS_UPDATED);
  await ensureRelation('media', 'file_id', 'directus_files', null, 'SET NULL');
}

console.log('\n### product_media');
if (await ensureCollection('product_media', 'SKU 媒体关联（主图/详情图/工程图按用途和顺序管理）')) {
  await ensureField('product_media', 'product_id', 'integer', { is_nullable: false }, { required: true });
  await ensureField('product_media', 'media_id', 'integer', { is_nullable: true }, { required: false });
  await ensureField('product_media', 'file_id', 'string', { max_length: 36, is_nullable: true }, { interface: 'file', note: '媒体文件' });
  await ensureField('product_media', 'kind', 'string', { max_length: 32, is_nullable: false }, { required: true });
  await ensureField('product_media', 'sort', 'integer', { is_nullable: true, default_value: 0 });
  await ensureField('product_media', 'is_primary', 'boolean', { is_nullable: true, default_value: false });
  await ensureFieldSchema('product_media', 'media_id', { is_nullable: true });
  await ensureFieldMeta('product_media', 'file_id', {
    interface: 'product-media-editor',
    note: '图片：支持大图预览、上传、替换和清除',
    width: 'full',
  });
  await ensureFieldMeta('product_media', 'media_id', {
    hidden: true,
    note: '高级：复用媒体库中的已有媒体；普通上传请使用图片字段',
  });
  await ensureFieldMeta('product_media', 'kind', {
    interface: 'select-dropdown',
    options: {
      choices: [
        { text: '主图', value: 'product_main' },
        { text: '详情图', value: 'product_detail' },
        { text: '工程图', value: 'product_diagram' },
      ],
    },
  });
  await ensureFieldMeta('product_media', 'sort', { width: 'half' });
  await ensureFieldMeta('product_media', 'is_primary', { interface: 'boolean', width: 'half' });
  await ensureAliasField('product', 'media_links', 'SKU 媒体关联');
  await ensureFieldMeta('product', 'media_links', { translations: [{ language: 'zh-CN', translation: '产品图片' }] });
  await ensureAliasField('media', 'product_links', '被 SKU 引用的媒体');
  await ensureRelation('product_media', 'product_id', 'product', 'media_links', 'CASCADE');
  await ensureRelation('product_media', 'media_id', 'media', 'product_links', 'CASCADE');
  await ensureRelation('product_media', 'file_id', 'directus_files', null, 'SET NULL');
}

// ---------- 4. news ----------
console.log('\n### news');
if (await ensureCollection('news', '新闻/文章主数据（标题正文等可翻译字段在 news_translations）')) {
  await ensureField('news', 'cover_image', 'string', { max_length: 512, is_nullable: true });
  await ensureField('news', 'publish_date', 'date', { is_nullable: true });
  await ensureField('news', 'sort', 'integer', { is_nullable: true, default_value: 0 });
  await ensureField('news', 'status', 'string', { max_length: 16, is_nullable: true, default_value: 'published' });
  await ensureField('news', 'created_at', 'timestamp', { is_nullable: true }, TS_CREATED);
  await ensureField('news', 'updated_at', 'timestamp', { is_nullable: true }, TS_UPDATED);
}

// ---------- 5. 四个翻译集合（统一模板）----------
await buildTranslation('category_translations', 'category', 'category_id', '分类翻译行（每语言一行）');
await buildTranslation('series_translations', 'series', 'series_id', '系列翻译行（每语言一行）');
await buildTranslation('product_translations', 'product', 'product_id', '产品翻译行（每语言一行）');
await buildTranslation('news_translations', 'news', 'news_id', '新闻翻译行（每语言一行）');

// ---------- 6. site_settings ----------
console.log('\n### site_settings');
if (await ensureCollection('site_settings', '站点设置（单例）')) {
  await ensureField('site_settings', 'site_name', 'string', { max_length: 128, is_nullable: true });
  await ensureField('site_settings', 'site_description', 'string', { max_length: 512, is_nullable: true });
  await ensureField('site_settings', 'hero_title', 'string', { max_length: 255, is_nullable: true });
  await ensureField('site_settings', 'hero_subtitle', 'string', { max_length: 255, is_nullable: true });
  await ensureField('site_settings', 'footer_text', 'string', { max_length: 512, is_nullable: true });
  await ensureField('site_settings', 'contact_email', 'string', { max_length: 128, is_nullable: true });
  await ensureField('site_settings', 'created_at', 'timestamp', { is_nullable: true }, TS_CREATED);
  await ensureField('site_settings', 'updated_at', 'timestamp', { is_nullable: true }, TS_UPDATED);
}

// ---------- 7. 语言注册表 ----------
// 说明：Directus 11 没有内置 directus_languages（那是 12 的特性）。
//      11 的惯例是自建一个 languages 集合作为「语言单一来源」。
console.log('\n### languages（语言单一来源）');
if (await ensureCollection('languages', '语言注册表：全站语言码的单一来源（en / zh / de …）')) {
  await ensureField('languages', 'code', 'string', { max_length: 8, is_nullable: false }, { required: true });
  await ensureField('languages', 'name', 'string', { max_length: 64, is_nullable: false }, { required: true });
  await ensureField('languages', 'direction', 'string', { max_length: 3, is_nullable: true, default_value: 'ltr' });
  await ensureField('languages', 'sort', 'integer', { is_nullable: true, default_value: 0 });
  await ensureField('languages', 'enabled', 'boolean', { is_nullable: true, default_value: true });
}
console.log('  --- 播种语言 ---');
for (const [code, name, sort] of [['en', 'English', 1], ['zh', '简体中文', 2]]) {
  const chk = await api('GET', `/items/languages?filter[code][_eq]=${code}&limit=1`);
  if ((chk.json?.data || []).length) { console.log(`  = 语言 ${code} 已存在`); skip++; continue; }
  const r = await api('POST', '/items/languages', { code, name, direction: 'ltr', sort, enabled: true });
  if (r.status >= 200 && r.status < 300) { console.log(`  + 语言 ${code} (${name})`); ok++; }
  else { console.log(`  ✗ 语言 ${code} 失败 ${r.status}: ${JSON.stringify(r.json).slice(0, 160)}`); fail++; failures.push(`lang:${code}`); }
}

console.log('\n============================================');
console.log(`结果：新增 ${ok} / 跳过 ${skip} / 失败 ${fail}`);
if (failures.length) { console.log('失败项：'); failures.forEach((f) => console.log('  - ' + f)); }
console.log('============================================');
