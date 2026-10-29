import { revalidateTag } from "next/cache";
import { revalidationDecision } from "@/lib/revalidationAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  if (raw.length > 4096) return Response.json({ revalidated: false }, { status: 413 });

  let collection: unknown;
  try {
    collection = (JSON.parse(raw) as { collection?: unknown }).collection;
  } catch {
    return Response.json({ revalidated: false }, { status: 400 });
  }

  const decision = revalidationDecision(collection, request.headers.get("authorization"), process.env.REVALIDATE_SECRET);
  if (decision.status !== 200) return Response.json({ revalidated: false }, { status: decision.status });

  revalidateTag(decision.tag);
  return Response.json({ revalidated: true, collection, tag: decision.tag });
}
