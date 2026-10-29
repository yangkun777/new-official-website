import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const token = process.env.DIRECTUS_ADMIN_TOKEN ?? readFileSync(process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? 'D:/degson-pilot/.admin_token', 'utf8').trim();
const headers = { Authorization: `Bearer ${token}` };
async function get(path, params) {
  const url = new URL(path, base);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, { headers });
  assert.equal(response.status, 200, `GET ${url.pathname}`);
  return (await response.json()).data;
}

const flow = (await get('/flows', { 'filter[name][_eq]': '前台内容缓存刷新', fields: 'id,name', limit: '1' }))[0];
assert.ok(flow, 'Flow missing');
const activity = (await get('/activity', {
  'filter[action][_eq]': 'run', 'filter[item][_eq]': flow.id, sort: '-id', limit: '1', fields: 'id,timestamp',
}))[0];
assert.ok(activity, 'No Flow run recorded');
const revision = (await get('/revisions', { 'filter[activity][_eq]': String(activity.id), fields: 'data', limit: '1' }))[0];
assert.ok(revision, 'No Flow run revision');
const step = revision.data?.steps?.find(item => item.key === 'notify_frontend');
const result = revision.data?.data?.notify_frontend;
console.log(`Flow run ${activity.id}: ${step?.status ?? 'unknown'}, HTTP ${result?.status ?? 'none'}, error ${String(result?.message ?? '').replace(/[A-Fa-f0-9]{64}/g, '[redacted]').slice(0, 300)}`);
assert.equal(step?.status, 'resolve');
assert.equal(result?.status, 200);
