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
