import fs from 'node:fs';

const BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const tokenPath = process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? 'D:/degson-pilot/.admin_token';
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN ?? fs.readFileSync(tokenPath, 'utf8').trim();

async function main() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };

  // 1. 查看现有 presets
  const r1 = await fetch(`${BASE}/presets?filter[collection][_eq]=product`, { headers });
  const existing = (await r1.json()).data;
  console.log('Existing presets:', existing.length);

  // 2. 如果没有系统 preset，建一个
  let preset = existing.find((p) => p.user === null && p.role === null);
  if (!preset) {
    const r2 = await fetch(`${BASE}/presets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        collection: 'product',
        layout: 'excel-tabular',
      }),
    });
    const created = await r2.json();
    console.log('Created preset for product:', created);
    preset = created.data;
  } else {
    console.log('Found existing preset:', preset.id, 'layout:', preset.layout);
  }
}

main().catch(console.error);
