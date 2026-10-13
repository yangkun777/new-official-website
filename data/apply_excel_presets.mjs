import fs from 'node:fs';

const BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const tokenPath = process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? 'D:/degson-pilot/.admin_token';
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN ?? fs.readFileSync(tokenPath, 'utf8').trim();

const COLLECTIONS = [
  'category',
  'category_translations',
  'series',
  'series_translations',
  'product',
  'product_translations',
  'news',
  'news_translations',
];

async function main() {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };

  for (const collection of COLLECTIONS) {
    const res = await fetch(`${BASE}/presets?filter[collection][_eq]=${collection}`, { headers });
    const existing = (await res.json()).data || [];

    const systemPreset = existing.find((p) => p.user === null && p.role === null);
    if (!systemPreset) {
      const createRes = await fetch(`${BASE}/presets`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          collection,
          layout: 'excel-tabular',
        }),
      });
      const data = await createRes.json();
      console.log(`+ 为 ${collection} 创建默认 excel-tabular 预设:`, data.data?.id);
    } else {
      if (systemPreset.layout !== 'excel-tabular') {
        await fetch(`${BASE}/presets/${systemPreset.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ layout: 'excel-tabular' }),
        });
        console.log(`↻ 更新 ${collection} 预设为 excel-tabular:`, systemPreset.id);
      } else {
        console.log(`= ${collection} 预设已经是 excel-tabular:`, systemPreset.id);
      }
    }
  }
}

main().catch(console.error);
