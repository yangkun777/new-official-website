import assert from "node:assert/strict";
import { resolveMediaUrl, verifyLocalAssetSignature } from "../web/src/lib/media.ts";

const original = {
  SITE_MODE: process.env.SITE_MODE,
  DIRECTUS_TOKEN: process.env.DIRECTUS_TOKEN,
  CMS_ASSET_SECRET: process.env.CMS_ASSET_SECRET,
};
try {
  process.env.SITE_MODE = "demo-path";
  process.env.DIRECTUS_TOKEN = "test-only-secret";
  delete process.env.CMS_ASSET_SECRET;
  const id = "11111111-1111-4111-8111-111111111111";
  const url = resolveMediaUrl(`http://localhost:8055/assets/${id}?width=640`);
  assert.ok(url?.startsWith(`/api/cms-asset/${id}?`), url);
  const parsed = new URL(url, "http://localhost:3000");
  const signature = parsed.searchParams.get("sig");
  assert.ok(signature, "public image URL must be signed");
  assert.equal(verifyLocalAssetSignature(id, "?width=640", signature), true);
  assert.equal(verifyLocalAssetSignature(id, "?width=1280", signature), false);
  assert.equal(verifyLocalAssetSignature("22222222-2222-4222-8222-222222222222", "?width=640", signature), false);
  assert.equal(verifyLocalAssetSignature(id, "?width=640", "bad"), false);
  assert.equal(resolveMediaUrl(`http://localhost:8055/assets/${id}?sig=attacker`), null);
  console.log("PASS signed CMS image URL");
} finally {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
