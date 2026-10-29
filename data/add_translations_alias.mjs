/**
 * 为四个翻译集合在父表上建 O2M 别名（translations）
 * —— 使翻译行可被 REST/GraphQL 遍历，也是 Directus「语言页签」的前提。
 *
 * 背景：M0.3 首次建模时只建了 M2O（翻译表 → 父表），父表上没有反向 O2M 别名，
 *      因此 GraphQL 报 "Cannot query field product_translations on type product"。
 *
 * 用法：node data/add_translations_alias.mjs [集合名]   （不传则处理全部四个）
 */
import { readFileSync } from 'node:fs';

const BASE = 'http://localhost:8055';
const TOKEN = readFileSync('D:/degson-pilot/.admin_token', 'utf8').trim();
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

const PAIRS = [
  { parent: 'category', child: 'category_translations', fk: 'category_id' },
  { parent: 'series',   child: 'series_translations',   fk: 'series_id' },
  { parent: 'product',  child: 'product_translations',  fk: 'product_id' },
  { parent: 'news',     child: 'news_translations',     fk: 'news_id' },
];

const only = process.argv[2];
const targets = only ? PAIRS.filter((p) => p.parent === only) : PAIRS;

async function api(method, path, body) {
  const r = await fetch(BASE + path, {
    method, headers: H,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch { j = { raw: t }; }
  return { status: r.status, json: j };
}

for (const { parent, child, fk } of targets) {
  console.log(`\n### ${parent} ← ${child}（别名 translations）`);

  // 1) 建 O2M 别名字段
  const f = await api('POST', `/fields/${parent}`, {
    field: 'translations',
    type: 'alias',
    meta: {
      special: ['o2m'],
      interface: 'list-o2m',
      options: { template: '{{language}} · {{name}}', enableCreate: true, enableSelect: false },
      display: 'related-values',
      display_options: { template: '{{language}} · {{name}}' },
      note: '还没有内容时请点「新建」，中文、英文各一条。每一行会标明这条是「中文 zh」还是「英文 en」。',
    },
  });
  const created = f.status >= 200 && f.status < 300;
  console.log(`  别名字段: ${created ? '✅ 已建' : `状态 ${f.status} ${JSON.stringify(f.json).slice(0, 180)}`}`);

  // 2) 关系反向别名：★ 不能用 PATCH /relations —— Directus 11.17.4 的
  //    RelationsService.alterType 会在这一步崩溃（实测两次，服务直接挂掉）。
  //    改为由 SQL 直接写 directus_relations.one_field，见步骤 3。
  console.log(`  关系别名: 跳过 PATCH（Directus 11 bug），改由 SQL 写入`);
}

console.log('\n下一步（SQL，不需 API）:');
console.log("  UPDATE directus_relations SET one_field='translations'");
console.log("  WHERE many_collection IN ('category_translations','series_translations','product_translations','news_translations');");
console.log('然后重启 Directus 使 schema 缓存刷新。');
