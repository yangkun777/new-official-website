import assert from "node:assert/strict";
import { sanitizeRichText } from "../web/src/lib/contentSafety.ts";
import { isAllowedMediaUrl } from "../web/src/lib/media.ts";

const dirty = '<p>Hello</p><script>alert(1)</script><a href="javascript:alert(1)" onclick="steal()">safe label</a><iframe src="https://evil.example"></iframe>';
const clean = sanitizeRichText(dirty);

assert.match(clean, /<p>Hello<\/p>/);
assert.doesNotMatch(clean, /script|onclick|javascript:|iframe/i);
assert.equal(isAllowedMediaUrl("http://localhost:8055/assets/demo"), true);
assert.equal(isAllowedMediaUrl("https://oss.degson.com/assets/demo"), true);
assert.equal(isAllowedMediaUrl("https://evil.example/assets/demo"), false);
assert.equal(isAllowedMediaUrl("javascript:alert(1)"), false);

console.log("PASS content safety and media policy");
