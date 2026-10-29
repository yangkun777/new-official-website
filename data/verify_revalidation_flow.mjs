import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const token = process.env.DIRECTUS_ADMIN_TOKEN ?? readFileSync(process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? 'D:/degson-pilot/.admin_token', 'utf8').trim();
const headers = { Authorization: `Bearer ${token}` };
async function get(path) {
  const response = await fetch(base + path, { headers });
  assert.equal(response.status, 200, `GET ${path}`);
  return (await response.json()).data;
}

const flows = await get('/flows?fields=id,name,status,trigger,options,operation&limit=100');
const flow = flows.find(item => item.name === '前台内容缓存刷新');
assert.ok(flow, 'Directus revalidation flow is not installed');
assert.equal(flow.status, process.env.REVALIDATION_FLOW_ACTIVE === '1' ? 'active' : 'inactive');
assert.equal(flow.trigger, 'event');
assert.equal(flow.options?.type, 'action');
assert.ok(flow.options?.scope?.includes('items.update'));
assert.ok(flow.options?.scope?.includes('items.create'));
assert.ok(flow.options?.scope?.includes('items.delete'));
assert.ok(flow.options?.collections?.includes('news_translations'));
assert.ok(flow.operation);
const operation = await get(`/operations/${flow.operation}`);
assert.equal(operation.type, 'request');
assert.equal(operation.options?.method?.toUpperCase(), 'POST');
assert.match(operation.options?.url ?? '', /\/api\/revalidate$/);
assert.ok(Array.isArray(operation.options?.headers));
assert.match(JSON.stringify(operation.options), /\$env\.REVALIDATE_SECRET/);
assert.doesNotMatch(JSON.stringify(operation.options), /[A-F0-9]{64}/);

console.log('PASS Directus save flow configuration');
