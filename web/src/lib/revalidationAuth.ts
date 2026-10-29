import { createHash, timingSafeEqual } from "node:crypto";
import { tagForCollection, type ContentTag } from "./cacheTags.ts";

type Decision = { status: 200; tag: ContentTag } | { status: 400 | 401 | 503 };

/** Keep collection names constrained to the same tags used by Directus reads. */
export function revalidationDecision(
  collection: unknown,
  authorization: string | null,
  secret: string | undefined,
): Decision {
  if (!secret || secret.length < 32) return { status: 503 };

  const supplied = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!supplied || !timingSafeEqual(digest(supplied), digest(secret))) return { status: 401 };

  if (typeof collection !== "string") return { status: 400 };
  try {
    return { status: 200, tag: tagForCollection(collection) };
  } catch {
    return { status: 400 };
  }
}
