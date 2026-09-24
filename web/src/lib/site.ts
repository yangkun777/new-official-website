export const SITE_ORIGIN = "https://www.degson.com";

export function absUrl(path: string): string {
  return `${SITE_ORIGIN}${path}`;
}
