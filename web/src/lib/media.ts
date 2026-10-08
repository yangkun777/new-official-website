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

  const directUrl = /^https?:\/\//i.test(value)
    ? value
    : `${(process.env.DIRECTUS_PUBLIC_URL ?? process.env.DIRECTUS_URL ?? "http://localhost:8055").replace(/\/+$/, "")}/assets/${encodeURIComponent(value)}`;

  return isAllowedMediaUrl(directUrl) ? directUrl : null;
}
