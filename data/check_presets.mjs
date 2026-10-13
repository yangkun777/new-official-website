import fs from 'node:fs';

const BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const tokenPath = process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? 'D:/degson-pilot/.admin_token';
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN ?? fs.readFileSync(tokenPath, 'utf8').trim();

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function checkLayoutOptions() {
  const r = await fetch(`${BASE}/presets/2`, { headers });
  const data = await r.json();
  console.log('Preset 2:', JSON.stringify(data.data, null, 2));
}

checkLayoutOptions().catch(console.error);
