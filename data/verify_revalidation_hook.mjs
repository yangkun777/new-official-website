import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { REVALIDATION_COLLECTIONS } from '../web/src/lib/cacheTags.ts';
import { REVALIDATION_COLLECTIONS as hookCollections } from '../cms/extensions/revalidate-hook/collections.js';

const source = readFileSync(new URL('../cms/extensions/revalidate-hook/dist/index.js', import.meta.url), 'utf8');
assert.deepEqual([...hookCollections].sort(), [...REVALIDATION_COLLECTIONS].sort());
assert.match(source, /items\.create/);
assert.match(source, /items\.update/);
assert.match(source, /items\.delete/);
assert.match(source, /\/api\/revalidate/);
assert.match(source, /REVALIDATE_SECRET/);
assert.doesNotMatch(source, /[A-F0-9]{64}/);
assert.match(source, /void notify/);
console.log(`PASS revalidate-hook config (${hookCollections.length} collections, non-blocking)`);
