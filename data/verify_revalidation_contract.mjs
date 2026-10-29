import assert from 'node:assert/strict';
import { revalidationDecision } from '../web/src/lib/revalidationAuth.ts';

const secret = 'a-long-local-secret-used-only-in-this-test';

assert.deepEqual(revalidationDecision('category', `Bearer ${secret}`, ''), { status: 503 });
assert.deepEqual(revalidationDecision('category', '', secret), { status: 401 });
assert.deepEqual(revalidationDecision('category', 'Bearer wrong', secret), { status: 401 });
assert.deepEqual(revalidationDecision('internal_audit', `Bearer ${secret}`, secret), { status: 400 });
assert.deepEqual(revalidationDecision('category', `Bearer ${secret}`, secret), { status: 200, tag: 'content:category' });
assert.deepEqual(revalidationDecision('page_sections_translations', `Bearer ${secret}`, secret), { status: 200, tag: 'content:site-pages' });

console.log('PASS revalidation authorization and collection mapping');
