import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN ?? readFileSync(process.env.DIRECTUS_ADMIN_TOKEN_FILE ?? 'D:/degson-pilot/.admin_token', 'utf8').trim();
const headers = { Authorization: `Bearer ${TOKEN}` };

async function get(path) {
  const response = await fetch(BASE + path, { headers });
  assert.equal(response.status, 200, `GET ${path} ${response.status}`);
  return (await response.json()).data;
}

function choiceValues(meta) {
  return (meta?.options?.choices ?? []).map(item => item.value);
}

const banner = await get('/collections/home_banner');
assert.equal(banner.meta?.hidden, false);
assert.match(JSON.stringify(banner.meta?.translations ?? []), /首页 Banner/);
assert.match(banner.meta?.note ?? '', /首页轮播读取/);

const translationsField = await get('/fields/home_banner/translations');
assert.equal(translationsField.meta?.interface, 'list-o2m');

const status = await get('/fields/home_banner/status');
assert.equal(status.meta?.interface, 'select-dropdown');
assert.deepEqual(choiceValues(status.meta).sort(), ['draft', 'published']);

const language = await get('/fields/home_banner_translations/language');
assert.equal(language.meta?.interface, 'select-dropdown');
assert.deepEqual(choiceValues(language.meta).sort(), ['en', 'zh']);

const langStatus = await get('/fields/home_banner_translations/status');
assert.equal(langStatus.meta?.interface, 'select-dropdown');

const link = await get('/fields/home_banner/link_path');
assert.equal(link.meta?.interface, 'select-dropdown');
assert.ok(choiceValues(link.meta).includes('/product/category/circular-connectors'));
assert.ok(choiceValues(link.meta).includes('external'));
assert.ok(!choiceValues(link.meta).includes('product_main'));

const image = await get('/fields/home_banner/image');
assert.equal(image.meta?.interface, 'product-media-editor');
const override = await get('/fields/home_banner_translations/image');
assert.equal(override.meta?.interface, 'product-media-editor');

const rows = await get('/items/home_banner?fields=id,key,label,sort,status,link_path,image,translations.language,translations.title,translations.status&sort=sort&limit=20');
assert.ok(rows.length >= 3, 'need at least 3 banner records');
for (const row of rows.slice(0, 3)) {
  const langs = (row.translations ?? []).map(item => item.language).sort();
  assert.deepEqual(langs, ['en', 'zh'], `${row.key} needs en and zh translations`);
}

const homeBanner = readFileSync(new URL('../web/src/components/HomeBanner.tsx', import.meta.url), 'utf8');
const homePage = readFileSync(new URL('../web/src/app/[lang]/page.tsx', import.meta.url), 'utf8');
const homeData = readFileSync(new URL('../web/src/lib/homeBanners.ts', import.meta.url), 'utf8');
const seedScript = readFileSync(new URL('./apply_home_banner.mjs', import.meta.url), 'utf8');
assert.match(homeBanner, /slides: HomeBannerSlide\[\]/);
assert.doesNotMatch(homeBanner, /const SLIDES =/);
assert.match(homePage, /getHomeBanners/);
assert.match(homePage, /bannerSlides = await getHomeBanners\(lang\)/);
assert.match(homePage, /bannerSlides=\{bannerSlides\}/);
assert.match(homeData, /filter\[status\]\[_eq\]": "published"/);
assert.match(homeData, /mapHomeBannerRows\(items, lang/);
assert.match(seedScript, /if \(!id\)/);
assert.match(seedScript, /if \(!tid\)/);
assert.doesNotMatch(seedScript, /api\('PATCH', `\/items\/home_banner/);
assert.match(homePage, /HomeCatalogDemo/);

console.log(`PASS home_banner admin model (${rows.length} rows); bilingual Directus data feeds the existing homepage carousel`);
