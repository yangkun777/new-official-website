import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../web/.env.local', import.meta.url), 'utf8');
const secret = env.match(/^REVALIDATE_SECRET=(.+)$/m)?.[1]?.trim();
assert.ok(secret && secret.length >= 32, 'web/.env.local needs REVALIDATE_SECRET');

const base = process.env.WEB_PREVIEW_ORIGIN ?? 'http://localhost:3000';
async function post(collection, token) {
  const response = await fetch(`${base}/api/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ collection }),
  });
  return { status: response.status, body: await response.json() };
}

assert.equal((await post('news', 'wrong')).status, 401);
assert.equal((await post('internal_audit', secret)).status, 400);
const malformed = await fetch(`${base}/api/revalidate`, { method: 'POST', headers: { Authorization: `Bearer ${secret}` }, body: '{' });
assert.equal(malformed.status, 400);
const get = await fetch(`${base}/api/revalidate`);
assert.equal(get.status, 405);
const valid = await post('news_translations', secret);
assert.equal(valid.status, 200);
assert.equal(valid.body.tag, 'content:news');
assert.equal(valid.body.revalidated, true);

console.log('PASS POST /api/revalidate: authentication, allowlist, tag invalidation');
