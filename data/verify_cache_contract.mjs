import assert from "node:assert/strict";
import { CONTENT_TAGS, tagForCollection } from "../web/src/lib/cacheTags.ts";

assert.equal(tagForCollection("site_settings"), CONTENT_TAGS.settings);
assert.equal(tagForCollection("category"), CONTENT_TAGS.category);
assert.equal(tagForCollection("series"), CONTENT_TAGS.series);
assert.equal(tagForCollection("product"), CONTENT_TAGS.product);
assert.equal(tagForCollection("news"), CONTENT_TAGS.news);
assert.throws(() => tagForCollection("internal_audit"), /Unknown public collection/);

console.log("PASS cache tag contract");
