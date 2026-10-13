import fs from 'node:fs';

const BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const tokenPath = process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? 'D:/degson-pilot/.admin_token';
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN ?? fs.readFileSync(tokenPath, 'utf8').trim();

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function fixPreset() {
  await fetch(`${BASE}/presets/2`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      layout: 'excel-tabular',
      layout_query: {
        'excel-tabular': {
          fields: ['id', 'order_no', 'title', 'poles', 'pitch', 'status'],
          sort: ['id'],
          limit: 25,
        },
      },
      layout_options: {
        'excel-tabular': {
          widths: {},
        },
      },
    }),
  });
  console.log('Fixed preset 2 options and query');
}

fixPreset().catch(console.error);
