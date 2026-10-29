import { apiGetList } from "@/lib/directus";

interface MediaLink {
  file_id: string | null;
  media_id: { file_id: string | null; status: string | null } | null;
}

interface ProductMediaAccess {
  media_links: MediaLink[] | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNo: string; fileId: string }> },
) {
  const { orderNo, fileId } = await params;
  if (!/^[\w.-]{1,80}$/.test(orderNo) || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(fileId)) {
    return new Response(null, { status: 404 });
  }

  try {
    const { items } = await apiGetList<ProductMediaAccess>("/items/product", {
      "filter[status][_eq]": "published",
      "filter[order_no][_eq]": orderNo,
      fields: "media_links.file_id,media_links.media_id.file_id,media_links.media_id.status",
      limit: "1",
    });
    const linked = items[0]?.media_links?.some(
      (link) => link.media_id?.status !== "draft" &&
        (link.file_id === fileId || link.media_id?.file_id === fileId),
    );
    if (!linked) return new Response(null, { status: 404 });

    const base = (process.env.DIRECTUS_URL ?? "http://localhost:8055").replace(/\/+$/, "");
    const asset = await fetch(`${base}/assets/${fileId}`, {
      headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN ?? ""}` },
    });
    const contentType = asset.headers.get("content-type") ?? "";
    if (!asset.ok || !contentType.startsWith("image/")) {
      return new Response(null, { status: 404 });
    }
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
