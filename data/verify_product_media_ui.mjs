import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(
	'cms/extensions/product-media-editor/src/interface.vue',
	'utf8',
);
const preview = fs.readFileSync(
	'cms/extensions/product-media-editor/src/previewUrl.js',
	'utf8',
);

assert.match(source, /if \(\/\^https\?:/, 'external image URLs should be recognized');
assert.match(source, /fileName\.value = value\.split\('\/'\)\.pop\(\) \|\| value;/, 'external images should show a readable file name');
assert.match(source, /fileInfo\.value = '外部图片地址'/, 'external images should be labeled clearly');
assert.match(source, /referrerpolicy="no-referrer"/, 'OSS hotlink protection blocks localhost Referer');
assert.match(source, /fileInfo\.value = '站点图片'/, 'site public images should be labeled clearly');
assert.match(preview, /return `\$\{webOrigin\(\)\}\$\{value\}`;/, 'site public paths should preview through the frontend');
assert.match(source, /grid-template-columns: 280px minmax\(0, 1fr\) auto/, 'metadata column must not overlap the preview image');
assert.match(source, /overflow-wrap: anywhere/, 'long URLs must wrap inside the metadata column');
assert.match(source, /从媒体库选择/, 'library pick must be labeled in Chinese');
assert.match(source, /从媒体库替换/, 'existing images must offer library replace');
assert.match(source, /点击图片可放大查看/, 'current image must be enlargeable');
assert.match(source, /使用这张图/, 'library lightbox must allow choosing the enlarged image');
assert.match(source, /class="overlay lightbox"/, 'library images must open in a lightbox');
assert.match(source, /<Teleport to="body">/, 'enlarged preview must escape Directus form overflow');

console.log('PASS product media UI display contract');
