import fs from 'node:fs';

const BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const tokenPath = process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? 'D:/degson-pilot/.admin_token';
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN ?? fs.readFileSync(tokenPath, 'utf8').trim();

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function main() {
  const r = await fetch(`${BASE}/presets?limit=-1`, { headers });
  const data = await r.json();
  for (const p of data.data || []) {
    if (p.collection === 'category' || p.collection === 'product') {
      console.log(`Deleting preset ${p.id} for ${p.collection}...`);
      await fetch(`${BASE}/presets/${p.id}`, { method: 'DELETE', headers });
    }
  }
  console.log('Done restoring presets!');
}

main().catch(console.error);
