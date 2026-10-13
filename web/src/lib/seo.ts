import type { Metadata } from "next";

export interface SocialMetadataInput {
  title: string;
  description: string;
  url: string;
}

export function socialMetadata({
  title,
  description,
  url,
}: SocialMetadataInput): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      siteName: "DEGSON",
      title,
      description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/**
 * Serialize JSON-LD for an inline script without allowing HTML-sensitive
 * characters in CMS-controlled strings to terminate the script element.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
