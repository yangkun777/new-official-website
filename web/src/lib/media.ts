import { createHmac, timingSafeEqual } from "node:crypto";

function configuredMediaOrigins(): string[] {
  const raw =
    process.env.MEDIA_ORIGINS ??
    "http://localhost:8055,https://enoss.degson.com,https://oss.degson.com";
  return raw.split(",").map((origin) => origin.trim().replace(/\/+$/, "")).filter(Boolean);
}

export function isAllowedMediaUrl(input: string): boolean {
  try {
    const parsed = new URL(input);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      configuredMediaOrigins().includes(parsed.origin)
    );
  } catch {
    return false;
  }
}

export function resolveMediaUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const value = input.trim();
  if (!value) return null;

  // 站点 public/ 下的相对路径（营销图、示例封面等），前台可直接引用
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  const directUrl = /^https?:\/\//i.test(value)
    ? value
    : `${(process.env.DIRECTUS_PUBLIC_URL ?? process.env.DIRECTUS_URL ?? "http://localhost:8055").replace(/\/+$/, "")}/assets/${encodeURIComponent(value)}`;

  if (!isAllowedMediaUrl(directUrl)) return null;
  return rewriteLocalDirectusUrl(directUrl);
}

const FILE_ID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function assetKey(): string {
  return process.env.CMS_ASSET_SECRET || process.env.DIRECTUS_TOKEN || "";
}

function assetSignature(fileId: string, query: URLSearchParams): string | null {
  const key = assetKey();
  if (!key) return null;
  return createHmac("sha256", key)
    .update(`${fileId.toLowerCase()}\n${query.toString()}`)
    .digest("hex");
}

export function verifyLocalAssetSignature(
  fileId: string,
  search: string,
  signature: string | null,
): boolean {
  if (!FILE_ID.test(fileId) || !signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  const query = new URLSearchParams(search);
  if (query.has("sig")) return false;
  const expected = assetSignature(fileId, query);
  return Boolean(expected && timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex")));
}

/** 演示站把 localhost:8055 收成同源代理，同事浏览器不会去访问自己的 8055。 */
export function rewriteLocalDirectusUrl(directUrl: string): string | null {
  if (process.env.SITE_MODE === "production") return directUrl;
  try {
    const parsed = new URL(directUrl);
    if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      return directUrl;
    }
    const match = parsed.pathname.match(/^\/assets\/([^/]+)/);
    if (!match || !FILE_ID.test(match[1]) || parsed.searchParams.has("sig")) return null;
    const signature = assetSignature(match[1], parsed.searchParams);
    if (!signature) return null;
    const query = new URLSearchParams(parsed.searchParams);
    query.set("sig", signature);
    return `/api/cms-asset/${match[1]}?${query.toString()}`;
  } catch {
    return null;
  }
}
