// Directus REST 取数封装：前台只通过此文件访问数据，不持有任何数据库凭据。
// 缓存策略：dev 下 no-store（闭环演示——改后台立即反映）；prod 用 ISR 60s + tag。

const BASE = process.env.DIRECTUS_URL ?? "http://localhost:8055";
const TOKEN = process.env.DIRECTUS_TOKEN ?? "";

function init(tag: string): RequestInit {
  const headers = { Authorization: `Bearer ${TOKEN}` };
  if (process.env.NODE_ENV === "development") {
    return { headers, cache: "no-store" };
  }
  return { headers, next: { revalidate: 60, tags: [tag] } };
}

/** 取单条/单对象（返回 data 字段） */
export async function apiGet<T>(
  path: string,
  params?: Record<string, string>,
  tag = "default"
): Promise<T> {
  const url = new URL(BASE + path);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, init(tag));
  if (!res.ok) throw new Error(`Directus ${res.status} ${url.pathname}${url.search}`);
  const json = await res.json();
  return json.data as T;
}

/** 取列表（带 meta.filter_count 总数，用于分页） */
export async function apiGetList<T>(
  path: string,
  params?: Record<string, string>,
  tag = "default"
): Promise<{ items: T[]; total: number }> {
  const url = new URL(BASE + path);
  const merged = { ...(params ?? {}), meta: "filter_count" };
  for (const [k, v] of Object.entries(merged)) url.searchParams.set(k, v);
  const res = await fetch(url, init(tag));
  if (!res.ok) throw new Error(`Directus ${res.status} ${url.pathname}${url.search}`);
  const json = await res.json();
  return {
    items: (json.data ?? []) as T[],
    total: json?.meta?.filter_count ?? (json.data?.length ?? 0),
  };
}
