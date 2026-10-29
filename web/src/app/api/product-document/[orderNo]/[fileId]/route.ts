import { apiGetList } from '@/lib/directus';

interface DocumentLink { file_id: string; product_id: { order_no: string; status: string } }

export async function GET(_request: Request, { params }: { params: Promise<{ orderNo: string; fileId: string }> }) {
  const { orderNo, fileId } = await params;
  if (!/^[\w.-]{1,80}$/.test(orderNo) || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(fileId)) return new Response(null, { status: 404 });
  try {
    const { items } = await apiGetList<DocumentLink>('/items/product_document', {
      'filter[product_id][order_no][_eq]': orderNo,
      'filter[status][_eq]': 'published',
      'filter[file_id][_eq]': fileId,
      fields: 'file_id,product_id.order_no,product_id.status', limit: '1',
    });
    if (!items.length || items[0].product_id?.status !== 'published') return new Response(null, { status: 404 });
    const base = (process.env.DIRECTUS_URL ?? 'http://localhost:8055').replace(/\/+$/, '');
    const asset = await fetch(`${base}/assets/${fileId}`, { headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN ?? ''}` } });
    if (!asset.ok) return new Response(null, { status: 404 });
    return new Response(asset.body, { headers: {
      'content-type': asset.headers.get('content-type') ?? 'application/octet-stream',
      'content-disposition': (asset.headers.get('content-disposition') ?? 'attachment').replace(/^inline/i, 'attachment'),
      'cache-control': 'public, max-age=60',
      'x-content-type-options': 'nosniff',
    } });
  } catch { return new Response(null, { status: 502 }); }
}
