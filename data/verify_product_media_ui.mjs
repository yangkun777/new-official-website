import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(
	'cms/extensions/product-media-editor/src/interface.vue',
	'utf8',
);

assert.match(source, /externalFileName\(value\)/, 'external URL should use a display-name helper');
assert.match(source, /new URL\(value\)\.pathname/, 'external URL display should parse the pathname');
assert.match(source, /decodeURIComponent\(pathname\.split\('\/'\)\.pop\(\) \|\| ''\)/, 'external filename should be decoded');
assert.match(source, /fileInfo\.value = '历史图片地址'/, 'legacy external images should be labeled clearly');
assert.doesNotMatch(source, /if \(\/\^https\?:.*?\) \{\s*fileName\.value = value;/s, 'raw external URL must not be displayed as the filename');

console.log('PASS product media UI display contract');
