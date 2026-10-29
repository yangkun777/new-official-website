import assert from 'node:assert/strict';
import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const base = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const token = process.env.DIRECTUS_ADMIN_TOKEN ?? readFileSync(process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? 'D:/degson-pilot/.admin_token', 'utf8').trim();
const statusFile = new URL('../cms/.revalidate-last.json', import.meta.url);
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function api(method, path, body) {
  const response = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  assert.equal(response.status, 200, `${method} ${path}: ${response.status} ${JSON.stringify(result).slice(0, 300)}`);
  return result.data;
}

if (existsSync(statusFile)) unlinkSync(statusFile);

const settings = await api('GET', '/items/site_settings/1?fields=id,site_name');
const saved = await api('PATCH', '/items/site_settings/1', { site_name: settings.site_name });
assert.equal(saved.id, 1);

let status;
for (let i = 0; i < 25; i++) {
  await sleep(200);
  if (!existsSync(statusFile)) continue;
  status = JSON.parse(readFileSync(statusFile, 'utf8'));
  if (status.collection === 'site_settings') break;
}

assert.ok(status, 'Hook did not write cms/.revalidate-last.json after save');
assert.equal(status.collection, 'site_settings');
assert.equal(status.http, 200);
assert.equal(status.ok, true);
console.log(`PASS Directus save still 200; hook reached Next /api/revalidate (${status.at})`);
