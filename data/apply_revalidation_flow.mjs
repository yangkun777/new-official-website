/** Idempotent Directus Flow setup. Kept inactive: the request operation blocks localhost.
 *  Live path is cms/extensions/revalidate-hook. Do not enable this Flow on loopback. */
import { readFileSync } from 'node:fs';
import { REVALIDATION_COLLECTIONS } from '../web/src/lib/cacheTags.ts';

const base = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const token = process.env.DIRECTUS_ADMIN_TOKEN ?? readFileSync(process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? 'D:/degson-pilot/.admin_token', 'utf8').trim();
const origin = new URL(process.env.WEB_PREVIEW_ORIGIN ?? 'http://localhost:3000');
if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password || origin.search || origin.hash) {
  throw new Error('WEB_PREVIEW_ORIGIN must be a plain HTTP(S) origin');
}
const activate = process.env.REVALIDATION_FLOW_ACTIVE === '1';
if (activate && ['localhost', '127.0.0.1', '::1'].includes(origin.hostname)) {
  throw new Error('Directus request operation rejects loopback URLs; use an approved reachable origin before activating');
}
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
async function api(method, path, body) {
  const response = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(result)}`);
  return result.data;
}

const name = '前台内容缓存刷新';
const existing = (await api('GET', '/flows?fields=id,name,operation&limit=100')).find(item => item.name === name);
const flowOptions = {
  type: 'action',
  scope: ['items.create', 'items.update', 'items.delete'],
  collections: REVALIDATION_COLLECTIONS,
};
const flow = existing ?? await api('POST', '/flows', {
  name, icon: 'cached', status: 'inactive', trigger: 'event',
  description: '内容保存后通知 Next.js 按集合刷新缓存。密钥来自 Directus 环境变量白名单。',
  options: flowOptions,
});
const operationOptions = {
  method: 'POST',
  url: new URL('/api/revalidate', origin).toString(),
  headers: [
    { header: 'Authorization', value: 'Bearer {{$env.REVALIDATE_SECRET}}' },
    { header: 'Content-Type', value: 'application/json' },
  ],
  body: '{"collection":"{{$trigger.collection}}"}',
};
const operation = flow.operation
  ? await api('PATCH', `/operations/${flow.operation}`, { options: operationOptions })
  : await api('POST', '/operations', {
      name: '通知前台刷新', key: 'notify_frontend', type: 'request', flow: flow.id,
      position_x: 19, position_y: 1, options: operationOptions,
    });
await api('PATCH', `/flows/${flow.id}`, { status: activate ? 'active' : 'inactive', options: flowOptions, operation: operation.id });
console.log(`PASS Directus cache flow ${flow.id} (${REVALIDATION_COLLECTIONS.length} collections, ${activate ? 'active' : 'inactive'})`);
