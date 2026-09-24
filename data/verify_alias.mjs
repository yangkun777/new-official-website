/** 验证 O2M 别名生效：REST 能否遍历翻译行 */
import { readFileSync } from 'node:fs';
const BASE = 'http://localhost:8055';
const TOKEN = readFileSync('D:/degson-pilot/.admin_token', 'utf8').trim();
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function rest(label, path) {
  const r = await fetch(BASE + path, { headers: H });
  const t = await r.text();
  const okk = r.status === 200;
  console.log(`  ${okk ? '✅' : '❌'} ${label}`);
  console.log(`       HTTP ${r.status}  ${t.slice(0, 260) || '(空)'}`);
}

console.log('=== A. REST 遍历翻译行（O2M 别名）===');
await rest('product 带 translations', '/items/product?limit=2&fields=id,order_no,translations.language,translations.name');
await rest('series 带 translations', '/items/series?limit=2&fields=id,matecode,translations.name,translations.slug');
await rest('category 带 translations', '/items/category?limit=2&fields=id,level,translations.name,translations.slug');
await rest('news 带 translations（应有 en+zh）', '/items/news?limit=2&fields=id,publish_date,translations.language,translations.name');

console.log('\n=== B. REST 关系过滤（跨关系，之前误报 403）===');
await rest('按翻译行语言筛产品', '/items/product?limit=2&filter[translations][language][_eq]=en');
await rest('按翻译行语言筛新闻', '/items/news?limit=2&filter[translations][language][_eq]=zh');
await rest('三级关联过滤', '/items/product?limit=2&filter[series_id][category_id][level][_eq]=3');

console.log('\n=== C. GraphQL 遍历翻译行（别名是否被 GraphQL 暴露）===');
async function gql(label, query) {
  const r = await fetch(BASE + '/graphql', { method: 'POST', headers: H, body: JSON.stringify({ query }) });
  const t = await r.text();
  console.log(`  ${r.status === 200 ? '✅' : '❌'} ${label}`);
  console.log(`       HTTP ${r.status}  ${t.slice(0, 300) || '(空)'}`);
}
await gql('product 带 translations', '{ product(limit:2){ id order_no translations { language name slug } } }');
await gql('news 带 translations', '{ news(limit:2){ id publish_date translations { language name } } }');
await gql('按翻译语言筛产品', '{ product(filter:{ translations:{ language:{ _eq:"en" } } }, limit:2){ id order_no } }');

console.log('\n=== D. 缺翻译回退验证（zh 应无 product 翻译行）===');
await rest('product_translations 语言分布', '/items/product_translations?limit=1&aggregate[count]=id&groupBy[]=language');
await rest('news_translations 语言分布', '/items/news_translations?limit=5&fields=language,name');
