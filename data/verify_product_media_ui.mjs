import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(
	'cms/extensions/product-media-editor/src/interface.vue',
	'utf8',
);

assert.match(source, /fileName\.value = value;/, 'external URL should remain visible as metadata');
assert.match(source, /fileInfo\.value = '历史图片地址'/, 'legacy external images should be labeled clearly');
assert.match(source, /grid-template-columns: 280px minmax\(0, 1fr\) auto/, 'metadata column must not overlap the preview image');
assert.match(source, /overflow-wrap: anywhere/, 'long URLs must wrap inside the metadata column');

console.log('PASS product media UI display contract');
