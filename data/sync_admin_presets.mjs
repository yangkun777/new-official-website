import fs from 'node:fs';

const BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const tokenPath = process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? 'D:/degson-pilot/.admin_token';
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN ?? fs.readFileSync(tokenPath, 'utf8').trim();

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function syncPreset(collection) {
  const r = await fetch(`${BASE}/presets?filter[collection][_eq]=${collection}`, { headers });
  const data = await r.json();
  const presets = data.data || [];
  let p = presets.find((x) => x.user === null && x.role === null);

  const payload = {
    layout: 'excel-tabular',
    layout_query: {
      'excel-tabular': {
        limit: 25,
      },
    },
    layout_options: {
      'excel-tabular': {
        widths: {},
      },
    },
  };

  if (!p) {
    const createRes = await fetch(`${BASE}/presets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        collection,
        ...payload,
      }),
    });
    const resData = await createRes.json();
    console.log(`+ 为 ${collection} 创建标准表格预设:`, resData.data?.id);
  } else {
    await fetch(`${BASE}/presets/${p.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });
    console.log(`↻ 更新 ${collection} 预设为 excel-tabular:`, p.id);
  }
}

async function main() {
  await syncPreset('product');
  await syncPreset('category');
}

main().catch(console.error);
