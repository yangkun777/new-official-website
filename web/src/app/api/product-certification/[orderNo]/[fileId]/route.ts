import { apiGetList } from '@/lib/directus';
interface CertificationLink { logo_file_id: string; product_id: { status: string } }
export async function GET(_request: Request, { params }: { params: Promise<{ orderNo: string; fileId: string }> }) {
  const { orderNo, fileId } = await params;
  if (!/^[\w.-]{1,80}$/.test(orderNo) || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(fileId)) return new Response(null, { status: 404 });
  try {
    const { items } = await apiGetList<CertificationLink>('/items/product_certification', { 'filter[product_id][order_no][_eq]': orderNo, 'filter[status][_eq]': 'published', 'filter[logo_file_id][_eq]': fileId, fields: 'logo_file_id,product_id.status', limit: '1' });
    if (!items.length || items[0].product_id?.status !== 'published') return new Response(null, { status: 404 });
    const base = (process.env.DIRECTUS_URL ?? 'http://localhost:8055').replace(/\/+$/, '');
    const asset = await fetch(`${base}/assets/${fileId}`, { headers: { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN ?? ''}` } });
    const type = asset.headers.get('content-type') ?? '';
    if (!asset.ok || !type.startsWith('image/')) return new Response(null, { status: 404 });
    return new Response(asset.body, { headers: { 'content-type': type, 'cache-control': 'public, max-age=60', 'x-content-type-options': 'nosniff' } });
  } catch { return new Response(null, { status: 502 }); }
}
