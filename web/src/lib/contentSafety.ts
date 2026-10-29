import sanitizeHtml from "sanitize-html";
import { rewriteLocalDirectusUrl } from "./media.ts";
import { toSitePath } from "./siteConfig.ts";

const allowedTags = [
  "p", "br", "strong", "em", "ul", "ol", "li", "blockquote",
  "h2", "h3", "table", "thead", "tbody", "tr", "th", "td", "a", "img",
];

export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeHtml(input, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      a: ["http", "https", "mailto"],
      img: ["http", "https"],
    },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href;
        if (!href || !/^https?:\/\//i.test(href)) {
          return { tagName, attribs };
        }
        try {
          const host = new URL(href).hostname;
          if (host === "localhost" || host === "127.0.0.1") {
            return { tagName, attribs: { ...attribs, href: toSitePath(href) } };
          }
        } catch {
          /* keep */
        }
        return { tagName, attribs };
      },
      img: (tagName, attribs) => {
        const src = attribs.src;
        if (!src) return { tagName, attribs };
        if (src.startsWith("/") && !src.startsWith("//")) {
          return { tagName, attribs };
        }
        const rewritten = rewriteLocalDirectusUrl(src);
        return {
          tagName,
          attribs: { ...attribs, ...(rewritten ? { src: rewritten } : { src: "" }) },
        };
      },
    },
  });
}

function escapePlain(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** 富文本原样消毒；历史纯文本按段落转成 HTML。 */
export function cmsHtml(input: string | null | undefined): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";
  if (/<[a-z][\s\S]*>/i.test(raw)) return sanitizeRichText(raw);
  const html = raw
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapePlain(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
  return sanitizeRichText(html);
}
