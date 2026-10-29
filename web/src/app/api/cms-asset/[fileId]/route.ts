import { verifyLocalAssetSignature } from "@/lib/media";

const FILE_ID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  if (process.env.SITE_MODE === "production" || !FILE_ID.test(fileId)) {
    return new Response(null, { status: 404 });
  }
  const query = new URL(request.url).searchParams;
  const signatures = query.getAll("sig");
  query.delete("sig");
  if (signatures.length !== 1 || !verifyLocalAssetSignature(fileId, query.toString(), signatures[0])) {
    return new Response(null, { status: 404 });
  }
  try {
    const base = (process.env.DIRECTUS_URL ?? "http://localhost:8055").replace(/\/+$/, "");
    const search = query.toString();
    const asset = await fetch(`${base}/assets/${fileId}${search ? `?${search}` : ""}`, {
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN ?? ""}` },
    });
    const contentType = asset.headers.get("content-type") ?? "";
    if (!asset.ok || !contentType.startsWith("image/")) return new Response(null, { status: 404 });
    return new Response(asset.body, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=60",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
