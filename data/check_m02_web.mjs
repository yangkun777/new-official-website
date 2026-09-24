/**
 * 验证：M0.2 前台（degson-pilot/web）的取数请求，在新模型下是否还成立？
 * 直接复现 web/src/lib/repo.ts 里各函数实际发出的 fields / filter。
 */
import { readFileSync } from 'node:fs';
const BASE = 'http://localhost:8055';
const TOKEN = readFileSync('D:/degson-pilot/.admin_token', 'utf8').trim();
const H = { Authorization: `Bearer ${TOKEN}` };

async function t(label, path, note) {
  const r = await fetch(BASE + path, { headers: H });
  const body = await r.text();
  let extra = '';
  try {
    const j = JSON.parse(body);
    if (j.errors) extra = ' ← ' + (j.errors[0]?.message || '').slice(0, 90);
    else if (Array.isArray(j.data)) {
      extra = ` ← 返回 ${j.data.length} 条`;
      if (j.data[0]) extra += '  首条键: ' + Object.keys(j.data[0]).join(',');
    }
  } catch { extra = ' ← ' + body.slice(0, 80); }
  console.log(`  ${r.status === 200 ? '✅' : '❌'} ${label}  [HTTP ${r.status}]`);
  console.log(`       ${note}${extra}`);
}

console.log('=== M0.2 前台发出的请求 vs 新模型 ===\n');

console.log('【分类】repo.ts getCategoryBySlug 请求 fields: id,name,slug,level,description,image,sort,status');
await t('分类查询',
  '/items/category?filter[slug][_eq]=terminal-blocks&fields=id,name,slug,level,description,image,sort,status&limit=1',
  '新模型 category 表实际字段: id,level,parent_id,image,sort,status,created_at,updated_at');

console.log('\n【系列】repo.ts getSeriesByCategory 请求 fields: id,name,matecode,image,description');
await t('系列列表',
  '/items/series?fields=id,name,matecode,image,description&limit=2',
  '新模型 series 表实际字段: id,matecode,category_id,image,sort,status,created_at,updated_at');

console.log('\n【产品变体】repo.ts getVariants 请求 fields: id,title,order_no,poles,pitch');
await t('产品变体',
  '/items/product?fields=id,title,order_no,poles,pitch&limit=2',
  '新模型 product 表含这些字段');

console.log('\n【新闻】repo.ts 请求 news 的 fields: id,slug,publish_date,cover_image,status');
await t('新闻主表',
  '/items/news?fields=id,slug,publish_date,cover_image,status&limit=2',
  '新模型 news 无 slug（已移到 news_translations）');

console.log('\n【新闻翻译】repo.ts 请求 news_translations 的 fields: id,title,summary,body,news_id');
await t('新闻翻译行',
  '/items/news_translations?fields=id,title,summary,body,news_id&limit=2',
  '新模型翻译行字段: language,name,slug,seo_title,...,short_description,description');

console.log('\n=== 对照：新模型下正确的写法 ===');
await t('分类（正确）',
  '/items/category?filter[translations][slug][_eq]=terminal-blocks&fields=id,level,image,status,translations.name,translations.slug&limit=1',
  '走 translations 别名');
await t('系列（正确）',
  '/items/series?fields=id,matecode,image,status,translations.name,translations.short_description&limit=2',
  '名称/简介从翻译行取');
await t('新闻（正确）',
  '/items/news?fields=id,publish_date,cover_image,status,translations.language,translations.name&limit=2',
  'slug 与标题从翻译行取');
