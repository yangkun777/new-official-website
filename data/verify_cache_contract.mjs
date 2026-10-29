import assert from "node:assert/strict";
import { CONTENT_TAGS, tagForCollection } from "../web/src/lib/cacheTags.ts";

assert.equal(tagForCollection("site_settings"), CONTENT_TAGS.settings);
assert.equal(tagForCollection("category"), CONTENT_TAGS.category);
assert.equal(tagForCollection("category_translations"), CONTENT_TAGS.category);
assert.equal(tagForCollection("series"), CONTENT_TAGS.series);
assert.equal(tagForCollection("series_translations"), CONTENT_TAGS.series);
assert.equal(tagForCollection("product"), CONTENT_TAGS.product);
assert.equal(tagForCollection("product_translations"), CONTENT_TAGS.product);
assert.equal(tagForCollection("product_spec_translations"), CONTENT_TAGS.product);
assert.equal(tagForCollection("product_document"), CONTENT_TAGS.product);
assert.equal(tagForCollection("news"), CONTENT_TAGS.news);
assert.equal(tagForCollection("news_translations"), CONTENT_TAGS.news);
assert.equal(tagForCollection("site_pages_translations"), CONTENT_TAGS.pages);
assert.equal(tagForCollection("page_sections"), CONTENT_TAGS.pages);
assert.equal(tagForCollection("page_sections_translations"), CONTENT_TAGS.pages);
assert.equal(tagForCollection("home_banner"), CONTENT_TAGS.home);
assert.equal(tagForCollection("home_banner_translations"), CONTENT_TAGS.home);
assert.throws(() => tagForCollection("internal_audit"), /Unknown public collection/);

console.log("PASS cache tag contract");
