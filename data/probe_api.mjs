/**
 * 取数模式排查：REST 嵌套语法 403 vs GraphQL
 * 用 Node 直发请求，避开 shell 的 JSON 转义问题。
 */
import { readFileSync } from 'node:fs';

const BASE = 'http://localhost:8055';
const TOKEN = readFileSync('D:/degson-pilot/.admin_token', 'utf8').trim();
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function rest(label, path) {
  const r = await fetch(BASE + path, { headers: H });
  const t = await r.text();
  console.log(`  ${r.status === 200 ? '✅' : '❌'} REST ${label}`);
  console.log(`       HTTP ${r.status}  body: ${t.slice(0, 220) || '(空响应体)'}`);
}

async function gql(label, query) {
  const r = await fetch(BASE + '/graphql', { method: 'POST', headers: H, body: JSON.stringify({ query }) });
  const t = await r.text();
  console.log(`  ${r.status === 200 ? '✅' : '❌'} GraphQL ${label}`);
  console.log(`       HTTP ${r.status}  body: ${t.slice(0, 300) || '(空响应体)'}`);
}

console.log('=== A. REST：逐级增加嵌套深度，定位 403 的触发点 ===');
await rest('1) 单表字段        fields=id,title', '/items/product?limit=2&fields=id,title');
await rest('2) M2O 裸字段     fields=id,series_id', '/items/product?limit=2&fields=id,series_id');
await rest('3) M2O 点号展开   fields=series_id.id', '/items/product?limit=2&fields=id,series_id.id');
await rest('4) M2O 通配展开   fields=series_id.*', '/items/product?limit=2&fields=id,series_id.*');
await rest('5) 关系过滤        filter[series_id][matecode]', '/items/product?limit=2&filter[series_id][matecode][_eq]=10020003101');
await rest('6) 关系过滤(编码)  %5B..%5D', '/items/product?limit=2&filter%5Bseries_id%5D%5Bmatecode%5D%5B_eq%5D=10020003101');

console.log('\n=== B. GraphQL：同样的需求能否满足 ===');
await gql('1) 基础字段', '{ product(limit:2){ id title order_no } }');
await gql('2) M2O 嵌套展开', '{ product(limit:2){ id order_no series_id { id matecode } } }');
await gql('3) 三级嵌套', '{ product(limit:2){ id order_no series_id { id matecode category_id { id level } } } }');
await gql('4) 翻译行嵌套', '{ product(limit:2){ id order_no product_translations { language name slug } } }');
await gql('5) 关系过滤', '{ news(filter:{ news_translations:{ language:{ _eq:"en" } } }){ id publish_date news_translations { language name } } }');
await gql('6) 按订货号取一条完整产品', '{ product(filter:{ order_no:{ _eq:"10020002889" } }, limit:1){ id title order_no poles pitch series_id { id matecode category_id { id level } } product_translations { language name slug } } }');
await gql('7) 按语言取翻译行', '{ product_translations(filter:{ language:{ _eq:"en" } }, limit:2){ language name slug product_id { order_no } } }');
