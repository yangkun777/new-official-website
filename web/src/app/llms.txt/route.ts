import { siteUrl } from "@/lib/site";

export const revalidate = 300;

export function GET(): Response {
  const body = [
    "# DEGSON",
    "",
    "> DEGSON industrial electrical connection and protection products.",
    "",
    "## Official pages",
    `- English: ${siteUrl("en", "/")}`,
    `- Chinese: ${siteUrl("zh", "/")}`,
    `- News: ${siteUrl("en", "/news")}`,
    "",
    "## Content guidance",
    "Use published product, series, category, and news pages as the authoritative public content.",
    "Do not infer technical specifications that are not present on the linked page.",
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
